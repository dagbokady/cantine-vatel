import re

import pytest
from fastapi import HTTPException

from app.models import Reservation, ReservationElement
from app.services import comptoir
from app.services.codes import ALPHABET
from app.services.eleve import options_menu_du_jour
from app.services.reservations import annuler_reservation, choisir_vague, creer_reservation
from app.services.tickets import ticket_pour

from .conftest import AVANT_RECRE, JOUR, MIDI, entete


def commander(db, e, jeu, tiers=2, elements=None):
    return creer_reservation(db, e, menu_jour_id=jeu["menu"].id, tiers=tiers, now=AVANT_RECRE, elements=elements)


def composition(db, r):
    return [x.nom for x in db.query(ReservationElement).filter_by(reservation_id=r.id).order_by(ReservationElement.id)]


# ---------- Personnalisation des plats ----------


def test_composition_par_defaut_et_prix(db, jeu, eleve):
    r = commander(db, eleve(), jeu)
    assert composition(db, r) == ["Poisson braisé", "Piment"]
    assert r.prix == 1000  # prix 2/3 réglé par le chef, sans supplément


def test_supplement_et_stock_element(db, jeu, eleve):
    alloco = jeu["el"]["alloco"]
    e = eleve()
    r = commander(db, e, jeu, tiers=3, elements=[alloco.id])
    assert composition(db, r) == ["Poisson braisé", "Alloco"]  # piment retiré, poisson obligatoire
    assert r.prix == 1500 + 200
    assert alloco.stock_restant == 0
    with pytest.raises(HTTPException) as exc:
        commander(db, eleve(), jeu, elements=[alloco.id])
    assert "plus disponible" in exc.value.detail
    annuler_reservation(db, e, r.id, AVANT_RECRE)
    assert alloco.stock_restant == 1


def test_allergie_element_facultatif(db, jeu, eleve):
    e = eleve(["piment"])
    with pytest.raises(HTTPException) as exc:
        commander(db, e, jeu, elements=[jeu["el"]["piment"].id])
    assert "piment" in exc.value.detail
    r = commander(db, e, jeu)  # par défaut : piment retiré automatiquement
    assert "Piment" not in composition(db, r)
    compatibles, _ = options_menu_du_jour(db, ["piment"], JOUR)
    opt = next(o for o in compatibles if o["menu_jour_id"] == jeu["menu"].id)
    piment = next(x for x in opt["elements"] if x["nom"] == "Piment")
    assert piment["bloque"] and not piment["inclus_defaut"]


def test_allergie_element_obligatoire_rend_le_plat_incompatible(db, jeu, eleve):
    compatibles, incompatibles = options_menu_du_jour(db, ["poisson"], JOUR)
    assert jeu["menu"].id in {o["menu_jour_id"] for o in incompatibles}
    with pytest.raises(HTTPException):
        commander(db, eleve(["poisson"]), jeu)


def test_accompagnement_seul_refuse_et_masque(db, jeu, eleve):
    compatibles, incompatibles = options_menu_du_jour(db, [], JOUR)
    assert jeu["accomp"].id not in {o["menu_jour_id"] for o in compatibles + incompatibles}
    with pytest.raises(HTTPException):
        creer_reservation(db, eleve(), menu_jour_id=jeu["accomp"].id, tiers=3, now=AVANT_RECRE)


def test_element_inconnu_refuse(db, jeu, eleve):
    with pytest.raises(HTTPException):
        commander(db, eleve(), jeu, elements=[999999])


# ---------- Code de secours ----------


def _servable(db, jeu, e):
    r = commander(db, e, jeu)
    choisir_vague(db, e, r.id, jeu["creneau"].id, jeu["places"][0].id, MIDI.replace(hour=10, minute=30))
    return r


def test_code_genere_et_service_par_code(db, jeu, eleve, user):
    e = eleve()
    r = _servable(db, jeu, e)
    assert re.fullmatch(f"[{ALPHABET}]{{6}}", r.code)
    agent = user("agent")
    out = comptoir.servir_par_code(db, r.code.lower(), agent.id, MIDI)
    assert out["ok"], out
    assert out["composition"] == ["Poisson braisé", "Piment"]
    again = comptoir.servir_par_code(db, r.code, agent.id, MIDI)
    assert not again["ok"] and "Déjà servi" in again["raison"]
    # Le QR code reste valable et cohérent avec le code court.
    assert comptoir.servir(db, ticket_pour(r, e, JOUR), MIDI)["raison"].startswith("Déjà servi")


def test_code_annule_inconnu(db, jeu, eleve, user):
    e = eleve()
    r = commander(db, e, jeu)
    annuler_reservation(db, e, r.id, AVANT_RECRE)
    assert comptoir.servir_par_code(db, r.code, user("agent").id, MIDI)["raison"] == "Code inconnu ou commande annulée."


def test_code_limite_essais_et_roles(client, user, eleve):
    agent = user("agent")
    assert client.post("/agent/servir-code", json={"code": "AAAAAA"}, headers=entete(eleve())).status_code == 403
    for _ in range(comptoir.ESSAIS_MAX):
        assert client.post("/agent/servir-code", json={"code": "ZZZZZ2"}, headers=entete(agent)).json()["ok"] is False
    assert client.post("/agent/servir-code", json={"code": "ZZZZZ2"}, headers=entete(agent)).status_code == 429


# ---------- Prix des portions et chefs ----------


def test_prix_reserves_aux_chefs(client, db, jeu, user):
    plat = jeu["plat"]
    corps = {"prix": 1800, "prix_tiers1": 700, "prix_tiers2": 1200}
    assert client.put(f"/cuisine/plats/{plat.id}/prix", json=corps, headers=entete(user("admin"))).status_code == 403
    r = client.put(f"/cuisine/plats/{plat.id}/prix", json=corps, headers=entete(user("cuisine")))
    assert r.status_code == 200 and r.json()["prix_portions"] == {"1": 700, "2": 1200, "3": 1800}
    # Le menu déjà publié garde ses prix.
    assert (jeu["menu"].prix, jeu["menu"].prix_tiers2) == (1500, 1000)
    bad = client.put(f"/cuisine/plats/{plat.id}/prix", json={"prix": 1000, "prix_tiers1": 1200}, headers=entete(user("cuisine")))
    assert bad.status_code == 422


def test_changement_de_prix_non_retroactif(client, db, jeu, eleve, user):
    r = commander(db, eleve(), jeu)
    assert r.prix == 1000
    corps = {"prix": 3000, "prix_tiers1": 1000, "prix_tiers2": 2000}
    assert client.put(f"/cuisine/menus/{jeu['menu'].id}/prix", json=corps, headers=entete(user("cuisine"))).status_code == 200
    db.refresh(r)
    assert r.prix == 1000
    assert commander(db, eleve(), jeu).prix == 2000


def test_composition_configurable(client, db, jeu, user):
    plat = jeu["plat"]
    el = jeu["el"]
    corps = [
        {"id": el["poisson"].id, "nom": "Poisson braisé", "ingredient_id": el["poisson"].ingredient_id, "obligatoire": True},
        {"nom": "Oignons frits", "ingredient_id": el["alloco"].ingredient_id, "supplement": 100},
    ]
    r = client.put(f"/cuisine/plats/{plat.id}/elements", json=corps, headers=entete(user("cuisine")))
    assert r.status_code == 200, r.text
    assert [x["nom"] for x in r.json()["elements"]] == ["Poisson braisé", "Oignons frits"]
    assert "poisson" in r.json()["allergenes"]
    db.refresh(el["piment"])
    assert el["piment"].actif is False  # désactivé, pas supprimé


def test_gestion_des_chefs(client, db, user):
    admin = user("admin")
    from app.models import Niveau

    niveau = db.query(Niveau).first()
    corps = {"nom": "Chef Un", "identifiant": "Chef.Un.Test@demo.ci", "mot_de_passe": "provisoire1", "niveau_ids": [niveau.id]}
    a = client.post("/admin/chefs", json=corps, headers=entete(admin))
    assert a.status_code == 201, a.text
    b = client.post("/admin/chefs", json={**corps, "nom": "Chef Deux", "identifiant": "chef.deux.test@demo.ci"}, headers=entete(admin))
    assert b.status_code == 201
    assert client.post("/admin/chefs", json=corps, headers=entete(admin)).status_code == 409
    # Deux chefs partagent le même niveau.
    assert all(niveau.id in [n["id"] for n in x.json()["niveaux"]] for x in (a, b))
    assert client.post("/auth/user/login", json={"identifiant": "chef.un.test@demo.ci", "mot_de_passe": "provisoire1"}).status_code == 200
    # Désactivation : connexion et jeton refusés.
    chef_id = a.json()["id"]
    d = client.put(f"/admin/chefs/{chef_id}", json={**corps, "actif": False, "mot_de_passe": None}, headers=entete(admin))
    assert d.status_code == 200 and d.json()["actif"] is False
    assert client.post("/auth/user/login", json={"identifiant": "chef.un.test@demo.ci", "mot_de_passe": "provisoire1"}).status_code == 401
    from app.models import User

    assert client.get("/cuisine/plats", headers=entete(db.get(User, chef_id))).status_code == 401
    # Un chef n'administre pas les comptes.
    assert client.post("/admin/chefs", json=corps, headers=entete(user("cuisine"))).status_code == 403
