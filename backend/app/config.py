from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://cantine:cantine@localhost:5432/cantine"
    jwt_secret: str = "change-me"
    cors_origins: str = "http://localhost:5173"
    ticket_signing_key: str = ""  # Ed25519 PEM privée (PKCS8 non chiffré)
    # Comptoir : refuser un ticket hors de son créneau (désactivable pour une démo).
    comptoir_controle_creneau: bool = True
    # Fuseau de l'établissement (Côte d'Ivoire) : définit « aujourd'hui » côté serveur.
    fuseau_horaire: str = "Africa/Abidjan"
    # URL publique du frontend (liens dans les e-mails).
    frontend_url: str = "http://localhost:5173"
    # E-mails (réinitialisation du mot de passe). Sans SMTP_HOST, le lien est écrit dans les logs.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "Cantine Vatel <no-reply@cantine-vatel.ci>"
    smtp_ssl: bool = False  # True pour le port 465, sinon STARTTLS

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
