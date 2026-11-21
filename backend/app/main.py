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
    """Base d'allergènes et d'ingrédients toujours présente (ajouts seulement)."""
    from .db import SessionLocal
    from .referentiel import charger_referentiel

    try:
        with SessionLocal() as db:
            charger_referentiel(db)
    except Exception as exc:  # base non migrée : l'API démarre quand même
        print(f"Référentiel non chargé : {exc}")
    yield


app = FastAPI(title="Cantine Vatel", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    # Réseau local (téléphone sur le même Wi-Fi que le PC de dev).
    allow_origin_regex=r"http://(192\.168|10|172\.(1[6-9]|2\d|3[01]))(\.\d{1,3}){2,3}(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
