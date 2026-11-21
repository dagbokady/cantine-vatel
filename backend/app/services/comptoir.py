"""Service au comptoir : vérification du ticket signé puis passage à « servie » (R9)."""
from __future__ import annotations

import threading
import time as _time
from collections import defaultdict, deque
from datetime import datetime, timedelta

from fastapi import HTTPException

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..models import Creneau, Eleve, MenuJour, Place, Plat, Reservation, TableSalle
from .codes import normaliser_code
from .composition import allergenes_reservation, noms_composition
from .notifications import notifier
from .reservations import _allergenes_du_plat
from .tickets import verify_ticket

AVANCE_CRENEAU = timedelta(minutes=15)


def _h(t) -> str:
    return t.strftime("%H h %M")


# Recherche par code : au plus ESSAIS_MAX codes inconnus par agent sur la fenêtre glissante.
ESSAIS_MAX = 8
FENETRE_S = 300
_echecs: dict[int, deque] = defaultdict(deque)
_verrou = threading.Lock()


def _controler_essais(user_id: int) -> None:
    with _verrou:
        q = _echecs[user_id]
        limite = _time.monotonic() - FENETRE_S
        while q and q[0] < limite:
            q.popleft()
        if len(q) >= ESSAIS_MAX:
            raise HTTPException(status_code=429, detail="Trop de codes erronés : réessaie dans quelques minutes.")


def _noter_echec(user_id: int) -> None:
    with _verrou:
        _echecs[user_id].append(_time.monotonic())


def servir(db: Session, ticket: str, now: datetime) -> dict:
    payload = verify_ticket(ticket)
    if payload is None or "reservation_id" not in payload:
        return {"ok": False, "raison": "Ticket invalide : signature non reconnue."}

    res = db.execute(
        select(Reservation)
        .where(Reservation.id == int(payload["reservation_id"]))
        .with_for_update()
    ).scalar_one_or_none()
    if res is None or res.eleve_id != payload.get("eleve_id"):
        return {"ok": False, "raison": "Commande introuvable."}
    return _servir(db, res, now)


def servir_par_code(db: Session, saisie: str, user_id: int, now: datetime) -> dict:
    """Solution de secours sans QR : même contrôle que le ticket, à partir du code court."""
    _controler_essais(user_id)
    code = normaliser_code(saisie)
    res = None
    if code is not None:
        res = db.execute(
            select(Reservation).where(Reservation.code == code, Reservation.statut != "annulee").with_for_update()
        ).scalar_one_or_none()
    if res is None:
        _noter_echec(user_id)
        return {"ok": False, "raison": "Code inconnu ou commande annulée."}
    return _servir(db, res, now)


def _servir(db: Session, res: Reservation, now: datetime) -> dict:
    if res.creneau_id is None or res.place_id is None:
        return {"ok": False, "raison": "Vague non choisie pour cette commande."}
    eleve = db.get(Eleve, res.eleve_id)
    menu = db.get(MenuJour, res.menu_jour_id)
    plat = db.get(Plat, menu.plat_id)
    creneau = db.get(Creneau, res.creneau_id)
    place = db.get(Place, res.place_id)
    table = db.get(TableSalle, place.table_id)
    detail = {
        "eleve": {
            "nom": eleve.nom,
            "classe": eleve.classe,
            "photo": eleve.photo,
            "allergies": list(eleve.allergies or []),
        },
        "plat_nom": plat.nom,
        "plat_photo": plat.photo,
        "composition": noms_composition(db, [res.id])[res.id],
        "tiers": res.tiers,
        "table_nom": table.nom,
        "place_numero": place.numero,
        "heure_debut": creneau.heure_debut,
        "heure_fin": creneau.heure_fin,
    }

    def refus(raison: str) -> dict:
        return {"ok": False, "raison": raison, **detail}

    if res.statut == "annulee":
        return refus("Commande annulée.")
    if res.statut == "servie":
        quand = res.servie_a.astimezone().strftime("%H h %M") if res.servie_a else ""
        return refus(f"Déjà servi{' à ' + quand if quand else ''}.")
    if menu.date != now.date():
        return refus(f"Mauvais jour : ticket du {menu.date.strftime('%d/%m')}.")
    if settings.comptoir_controle_creneau:
        debut = datetime.combine(now.date(), creneau.heure_debut) - AVANCE_CRENEAU
        fin = datetime.combine(now.date(), creneau.heure_fin)
        if not debut <= now <= fin:
            return refus(
                f"Mauvais créneau : {_h(creneau.heure_debut)} – {_h(creneau.heure_fin)}."
            )
    composition = _allergenes_du_plat(db, plat.id) | allergenes_reservation(db, res.id)
    conflit = composition & {a.lower() for a in eleve.allergies or []}
    if conflit:
        return refus(f"ALERTE allergène : {', '.join(sorted(conflit))}. Ne pas servir.")

    res.statut = "servie"
    res.servie_a = now.astimezone()
    notifier(
        db,
        eleve,
        f"{eleve.nom.split()[0]} a déjeuné à {_h(now.time())} : {plat.nom} ({res.tiers}/3).",
    )
    db.flush()
    return {"ok": True, "raison": None, **detail}


def service_du_jour(db: Session, now: datetime) -> dict:
    rows = db.execute(
        select(Reservation.statut)
        .join(MenuJour, MenuJour.id == Reservation.menu_jour_id)
        .where(MenuJour.date == now.date(), Reservation.statut != "annulee")
    ).all()
    return {"commandes": len(rows), "servies": sum(1 for (s,) in rows if s == "servie")}
