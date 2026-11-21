from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Production : pas de documentation, pas d'accès réseau local, secrets obligatoires.
    production: bool = False

    database_url: str = "postgresql+psycopg://cantine:cantine@localhost:5432/cantine"
    jwt_secret: str = "change-me"
    cors_origins: str = "http://localhost:5173"
    # Clé Ed25519 : PEM PKCS8 non chiffré, ou n'importe quelle valeur aléatoire longue
    # (la clé en est dérivée, pratique pour une valeur générée par l'hébergeur).
    ticket_signing_key: str = ""
    # Comptoir : refuser un ticket hors de son créneau (désactivable pour une démo).
    comptoir_controle_creneau: bool = True
    # Fuseau de l'établissement (Côte d'Ivoire) : définit « aujourd'hui » côté serveur.
    fuseau_horaire: str = "Africa/Abidjan"
    # URL publique du frontend (liens dans les e-mails). Vide : première origine de CORS_ORIGINS.
    frontend_url: str = ""
    # E-mails (réinitialisation du mot de passe). Sans SMTP_HOST, le lien est écrit dans les logs.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "Cantine Vatel <no-reply@cantine-vatel.ci>"
    smtp_ssl: bool = False  # True pour le port 465, sinon STARTTLS

    @field_validator("database_url")
    @classmethod
    def _pilote_psycopg(cls, v: str) -> str:
        # Les hébergeurs fournissent postgres:// ou postgresql:// ; SQLAlchemy veut le pilote psycopg 3.
        for prefixe in ("postgres://", "postgresql://"):
            if v.startswith(prefixe):
                return "postgresql+psycopg://" + v[len(prefixe):]
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def url_publique(self) -> str:
        return (self.frontend_url or next(iter(self.cors_origins_list), "http://localhost:5173")).rstrip("/")

    def verifier_production(self) -> None:
        if not self.production:
            return
        erreurs = []
        if not self.database_url.strip() or "@localhost" in self.database_url or "@127.0.0.1" in self.database_url:
            erreurs.append(
                "DATABASE_URL n'est pas définie : sur Render, colle l'Internal Database URL de ta base "
                "dans Environment > DATABASE_URL."
            )
        if len(self.jwt_secret) < 32 or self.jwt_secret == "change-me":
            erreurs.append("JWT_SECRET doit être une valeur aléatoire d'au moins 32 caractères.")
        if not self.ticket_signing_key.strip():
            erreurs.append("TICKET_SIGNING_KEY est obligatoire (sinon les tickets changent à chaque redémarrage).")
        if erreurs:
            raise RuntimeError("Configuration de production invalide : " + " ".join(erreurs))


settings = Settings()
