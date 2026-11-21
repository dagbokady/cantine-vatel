from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import auth, eleve
from .schemas.eleve import PublicKeyResponse
from .services.tickets import public_key_pem

app = FastAPI(title="Cantine Vatel")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(eleve.router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/public-key", response_model=PublicKeyResponse)
def public_key():
    return PublicKeyResponse(algorithm="Ed25519", public_key_pem=public_key_pem())
