import threading
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from pathlib import Path

from fastapi.staticfiles import StaticFiles

from .routers import admin, agent, auth, cuisine, eleve, enseignant, parent
from .schemas.eleve import PublicKeyResponse
from .services.tickets import public_key_pem

@asynccontextmanager
async def lifespan(_app):
    """Base d'allergènes et d'ingrédients toujours présente (ajouts seulement).
    SEED_DEMO=true : données de démonstration si la base n'a encore aucun élève (jamais d'effacement d'une école en service)."""
    if settings.seed_demo:
        # En tâche de fond : le port s'ouvre tout de suite (Render abandonne un déploiement sans port ouvert).
        threading.Thread(target=_preparer_base, name="preparation-base", daemon=True).start()
    else:
        _preparer_base()
    yield


def _preparer_base() -> None:
    from .db import SessionLocal
    from .referentiel import charger_referentiel

    try:
        with SessionLocal() as db:
            if settings.seed_demo:
                from .seed import charger_demo_si_vide

                debut = time.monotonic()
                print("Démonstration : vérification de la base...", flush=True)
                if charger_demo_si_vide(db):
                    print(f"Démonstration chargée en {time.monotonic() - debut:.0f} s.", flush=True)
                else:
                    print("Démonstration non chargée : la base contient déjà des élèves.", flush=True)
            charger_referentiel(db)
    except Exception as exc:  # base non migrée : l'API démarre quand même
        print(f"Référentiel non chargé : {exc}", flush=True)


settings.verifier_production()

# En production : pas de documentation publique de l'API.
_docs = {"docs_url": None, "redoc_url": None, "openapi_url": None} if settings.production else {}
app = FastAPI(title="Cantine Vatel", lifespan=lifespan, **_docs)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    # Réseau local (téléphone sur le même Wi-Fi que le PC de dev) : jamais en production.
    allow_origin_regex=None if settings.production else r"http://(192\.168|10|172\.(1[6-9]|2\d|3[01]))(\.\d{1,3}){2,3}(:\d+)?",
    # Authentification par jeton Bearer, pas par cookie.
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def entetes_securite(request, call_next):
    reponse = await call_next(request)
    reponse.headers.setdefault("X-Content-Type-Options", "nosniff")
    reponse.headers.setdefault("Referrer-Policy", "no-referrer")
    if settings.production:
        reponse.headers.setdefault("Strict-Transport-Security", "max-age=31536000")
    return reponse

app.include_router(auth.router)
app.include_router(eleve.router)
app.include_router(agent.router)
app.include_router(parent.router)
app.include_router(cuisine.router)
app.include_router(admin.router)
app.include_router(enseignant.router)

_STATIC = Path(__file__).resolve().parents[1] / "static"
_STATIC.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=_STATIC), name="static")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/public-key", response_model=PublicKeyResponse)
def public_key():
    return PublicKeyResponse(algorithm="Ed25519", public_key_pem=public_key_pem())
