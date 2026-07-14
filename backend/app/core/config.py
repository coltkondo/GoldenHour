from pydantic_settings import BaseSettings
from pydantic import field_validator, model_validator
from typing import Optional

_PLACEHOLDER_SECRETS = {
    "dev-secret-key-change-in-production",
    "change-me",
    "secret",
    "supersecret",
    "changeme",
    "your-secret-key",
    "your-secret-here",
    "replace-me",
}

# These are acceptable in local dev but must never reach production
_DEV_ONLY_SECRETS = {
    "123456789abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
}


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:8000"

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Golden Hour API"
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "console"  # "console" for dev, "json" for prod
    LOG_FILE: str | None = None  # File path or None for console only
    LOG_ROTATION: str = "500 MB"
    LOG_RETENTION: str = "10 days"

    # Timezone for business-hours comparisons (happy hour schedules stored in local time)
    APP_TIMEZONE: str = "America/New_York"

    # Feature flags
    # Set REWARDS_ENABLED=false in .env to disable all point awarding (Arts Fest beta mode)
    REWARDS_ENABLED: bool = True

    # Optional: Maps and external services
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    MAPBOX_TOKEN: Optional[str] = None

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if v in _PLACEHOLDER_SECRETS:
            raise ValueError(
                f"SECRET_KEY is set to a placeholder value. "
                f'Generate one: python3 -c "import secrets; print(secrets.token_hex(32))"'
            )
        if len(v) < 32:
            raise ValueError(
                f"SECRET_KEY must be at least 32 characters (got {len(v)}). "
                f'Generate one: python3 -c "import secrets; print(secrets.token_hex(32))"'
            )
        return v

    @model_validator(mode="after")
    def production_guards(self) -> "Settings":
        if self.ENVIRONMENT == "production":
            if self.DEBUG:
                raise ValueError(
                    "DEBUG=True is not allowed in production. "
                    "Set DEBUG=False or remove it from your environment variables."
                )
            if self.SECRET_KEY in _DEV_ONLY_SECRETS:
                raise ValueError(
                    "SECRET_KEY is set to the example/dev placeholder. "
                    'Generate a real one: python3 -c "import secrets; print(secrets.token_hex(32))"'
                )
            origins = [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]
            if "*" in origins:
                raise ValueError(
                    "ALLOWED_ORIGINS cannot contain '*' in production when allow_credentials is enabled."
                )
        return self

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
