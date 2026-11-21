"""Tableau de bord (D1–D4)."""
from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date as _date
from datetime import datetime, time

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Appel, Classe, Creneau, Eleve, MenuJour, Place, Presence, Reservation, Transaction


def tableau_de_bord(db: Session, jour: _date) -> dict:
    menus = db.scalars(select(MenuJour).where(MenuJour.date == jour)).all()
    menu_ids = [m.id for m in menus] or [-1]
    res = db.execute(
        select(Reservation, Eleve.classe)
        .join(Eleve, Eleve.id == Reservation.eleve_id)
        .where(Reservation.menu_jour_id.in_(menu_ids), Reservation.statut != "annulee")
    ).all()

    prepares = sum(m.stock_prevu for m in menus) / 3
    commandes_tiers = sum(r.tiers for r, _ in res)
    servis_tiers = sum(r.tiers for r, _ in res if r.statut == "servie")

    # Mode Classe : présents à l'appel = portions standard servies.
    presences = db.execute(
        select(Classe.nom, Presence.present)
        .join(Appel, Appel.id == Presence.appel_id)
        .join(Classe, Classe.id == Appel.classe_id)
        .where(Appel.date == jour)
    ).all()
    presents_classe = sum(1 for _, p in presences if p)

    servis = servis_tiers / 3 + presents_classe
    sauves = 0.0  # anti-gaspi : P2
    gaspillage = round(100 * max(prepares - servis - sauves, 0) / prepares, 1) if prepares else 0.0

    creneaux = db.scalars(select(Creneau).where(Creneau.date == jour).order_by(Creneau.heure_debut)).all()
    par_creneau = Counter(r.creneau_id for r, _ in res)
    servis_creneau = Counter(r.creneau_id for r, _ in res if r.statut == "servie")
    nb_places = db.scalar(select(func.count(Place.id))) or 0
    capacite_salle = nb_places * len(creneaux)

    ventes = sum(r.prix for r, _ in res)
    debut, fin = datetime.combine(jour, time.min), datetime.combine(jour, time.max)
    recharges = db.scalar(
        select(func.coalesce(func.sum(Transaction.montant), 0)).where(
            Transaction.type == "recharge",
            Transaction.statut == "validee",
            Transaction.created_at.between(debut.astimezone(), fin.astimezone()),
        )
    )

    par_classe: dict[str, dict] = defaultdict(lambda: {"attendus": 0, "presents": 0})
    for r, classe in res:
        par_classe[classe]["attendus"] += 1
        par_classe[classe]["presents"] += r.statut == "servie"
    for classe, present in presences:
        par_classe[classe]["attendus"] += 1
        par_classe[classe]["presents"] += bool(present)

    allergies = Counter(a for (al,) in db.execute(select(Eleve.allergies)) for a in al or [])

    return {
        "date": jour,
        "portions": {
            "preparees": round(prepares, 1),
            "commandees": round(commandes_tiers / 3, 1),
            "servies": round(servis, 1),
            "restantes": round(max(prepares - servis, 0), 1),
            "sauvees": sauves,
            "taux_gaspillage": gaspillage,
        },
        "creneaux": [
            {
                "heure_debut": c.heure_debut,
                "heure_fin": c.heure_fin,
                "capacite": c.capacite,
                "commandes": par_creneau[c.id],
                "servies": servis_creneau[c.id],
            }
            for c in creneaux
        ],
        "occupation_salle": round(100 * len(res) / capacite_salle, 1) if capacite_salle else 0.0,
        "recettes": {"ventes": ventes, "recharges": recharges},
        "presence_par_classe": [
            {"classe": k, **v} for k, v in sorted(par_classe.items())
        ],
        "allergies": [{"allergene": k, "eleves": v} for k, v in allergies.most_common()],
    }
