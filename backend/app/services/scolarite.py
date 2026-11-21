"""Gestion des classes et des élèves par l'administration.

Les allergies et le régime ne sont jamais modifiés ici : ils relèvent du parent (R10).
"""
from __future__ import annotations

import re

from fastapi import HTTPException
from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session

from ..models import Classe, Eleve, Niveau

# Matricule Côte d'Ivoire : 8 chiffres puis 1 lettre majuscule (ex. 15079766N).
MATRICULE_RE = re.compile(r"^[0-9]{8}[A-Z]$")
MATRICULE_ERREUR = "Matricule invalide : 8 chiffres suivis d'une lettre majuscule (ex. 15079766N)."


def normaliser_matricule(m: str) -> str:
    m = (m or "").strip().upper()
    if not MATRICULE_RE.fullmatch(m):
        raise HTTPException(status_code=422, detail=MATRICULE_ERREUR)
    return m


def classe_out(db: Session, c: Classe, niveau: Niveau | None = None) -> dict:
    niveau = niveau or db.get(Niveau, c.niveau_id)
    effectif = db.scalar(select(func.count(Eleve.id)).where(Eleve.classe == c.nom)) or 0
    return {
        "id": c.id,
        "nom": c.nom,
        "niveau_id": c.niveau_id,
        "niveau": niveau.nom if niveau else None,
        "mode": niveau.mode if niveau else None,
        "effectif": effectif,
    }


def lister_classes(db: Session) -> list[dict]:
    effectifs = dict(db.execute(select(Eleve.classe, func.count(Eleve.id)).group_by(Eleve.classe)).all())
    rows = db.execute(select(Classe, Niveau).join(Niveau, Niveau.id == Classe.niveau_id).order_by(Niveau.id, Classe.nom)).all()
    return [
        {"id": c.id, "nom": c.nom, "niveau_id": n.id, "niveau": n.nom, "mode": n.mode, "effectif": effectifs.get(c.nom, 0)}
        for c, n in rows
    ]


def _verifier_niveau(db: Session, niveau_id: int) -> Niveau:
    n = db.get(Niveau, niveau_id)
    if n is None:
        raise HTTPException(status_code=422, detail="Niveau inconnu.")
    return n


def creer_classe(db: Session, nom: str, niveau_id: int) -> dict:
    nom = nom.strip()
    n = _verifier_niveau(db, niveau_id)
    if db.scalars(select(Classe.id).where(func.lower(Classe.nom) == nom.lower())).first():
        raise HTTPException(status_code=409, detail="Une classe porte déjà ce nom.")
    c = Classe(nom=nom, niveau_id=n.id)
    db.add(c)
    db.commit()
    return classe_out(db, c, n)


def modifier_classe(db: Session, classe_id: int, nom: str, niveau_id: int) -> dict:
    c = db.execute(select(Classe).where(Classe.id == classe_id).with_for_update()).scalar_one_or_none()
    if c is None:
        raise HTTPException(status_code=404, detail="Classe introuvable.")
    nom = nom.strip()
    n = _verifier_niveau(db, niveau_id)
    if db.scalars(select(Classe.id).where(func.lower(Classe.nom) == nom.lower(), Classe.id != c.id)).first():
        raise HTTPException(status_code=409, detail="Une classe porte déjà ce nom.")
    if nom != c.nom:
        # Eleve.classe référence la classe par son nom : renommage dans la même transaction.
        db.execute(update(Eleve).where(Eleve.classe == c.nom).values(classe=nom))
        c.nom = nom
    c.niveau_id = n.id
    db.commit()
    return classe_out(db, c, n)


def eleve_out(e: Eleve, classe_id: int | None = None) -> dict:
    return {
        "id": e.id,
        "matricule": e.matricule,
        "nom": e.nom,
        "classe": e.classe,
        "classe_id": classe_id,
        "photo": e.photo,
        "allergies": list(e.allergies or []),
        "parent_rattache": e.parent_id is not None,
        "acces_actif": e.pin_hash is not None,
    }


def lister_eleves(db: Session, classe_id: int | None, q: str | None) -> list[dict]:
    ids_classes = {c.nom: c.id for c in db.scalars(select(Classe))}
    stmt = select(Eleve).order_by(Eleve.nom)
    if classe_id is not None:
        c = db.get(Classe, classe_id)
        if c is None:
            raise HTTPException(status_code=404, detail="Classe introuvable.")
        stmt = stmt.where(Eleve.classe == c.nom)
    if q and q.strip():
        motif = f"%{q.strip()}%"
        stmt = stmt.where(or_(Eleve.nom.ilike(motif), Eleve.matricule.ilike(motif)))
    return [eleve_out(e, ids_classes.get(e.classe)) for e in db.scalars(stmt.limit(300))]


def _classe(db: Session, classe_id: int) -> Classe:
    c = db.get(Classe, classe_id)
    if c is None:
        raise HTTPException(status_code=422, detail="Classe inconnue.")
    return c


def creer_eleve(db: Session, matricule: str, nom: str, classe_id: int) -> dict:
    m = normaliser_matricule(matricule)
    c = _classe(db, classe_id)
    if db.scalars(select(Eleve.id).where(Eleve.matricule == m)).first():
        raise HTTPException(status_code=409, detail="Ce matricule est déjà attribué.")
    e = Eleve(matricule=m, nom=nom.strip(), classe=c.nom, allergies=[], solde=0)
    db.add(e)
    db.commit()
    return eleve_out(e, c.id)


def modifier_eleve(db: Session, eleve_id: int, matricule: str, nom: str, classe_id: int) -> dict:
    e = db.execute(select(Eleve).where(Eleve.id == eleve_id).with_for_update()).scalar_one_or_none()
    if e is None:
        raise HTTPException(status_code=404, detail="Élève introuvable.")
    c = _classe(db, classe_id)
    saisi = (matricule or "").strip().upper()
    if saisi != e.matricule:
        m = normaliser_matricule(saisi)
        if db.scalars(select(Eleve.id).where(Eleve.matricule == m, Eleve.id != e.id)).first():
            raise HTTPException(status_code=409, detail="Ce matricule est déjà attribué.")
        e.matricule = m
    e.nom, e.classe = nom.strip(), c.nom
    db.commit()
    return eleve_out(e, c.id)
