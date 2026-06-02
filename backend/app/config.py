from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://library_user:library_pass@localhost:5432/library"
    SECRET_KEY: str = "dev_secret_key"
    CORS_ORIGINS: str = '["http://localhost:3000"]'
    FINE_PER_DAY: float = 1.00   # $ per overdue day
    BORROW_LIMIT: int = 5        # max books a member may have out at once

    @property
    def cors_origins_list(self) -> List[str]:
        try:
            return json.loads(self.CORS_ORIGINS)
        except Exception:
            return ["http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
