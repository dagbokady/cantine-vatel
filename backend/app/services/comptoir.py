"""Service au comptoir : vérification du ticket signé puis passage à « servie » (R9)."""
from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..models import Creneau, Eleve, MenuJour, Place, Plat, Reservation, TableSalle
from .notifications import notifier
from .reservations import _allergenes_du_plat
from .tickets import verify_ticket

AVANCE_CRENEAU = timedelta(minutes=15)


def _h(t) -> str:
    return t.strftime("%H h %M")


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
    conflit = _allergenes_du_plat(db, plat.id) & {a.lower() for a in eleve.allergies or []}
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
