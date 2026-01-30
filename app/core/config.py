from typing import List, Union
from pydantic import AnyHttpUrl,  PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "The Morphing Book"
    
    # Database (Supabase)
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    
    # AI Services
    GOOGLE_API_KEY: str
    LLAMA_CLOUD_API_KEY: str
    
    # Core
    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
