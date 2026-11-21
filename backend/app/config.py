from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://cantine:cantine@localhost:5432/cantine"
    jwt_secret: str = "change-me"
    cors_origins: str = "http://localhost:5173"
    ticket_signing_key: str = ""  # Ed25519 PEM privée (PKCS8 non chiffré)
    # Comptoir : refuser un ticket hors de son créneau (désactivable pour une démo).
    comptoir_controle_creneau: bool = True

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
