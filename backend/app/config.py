import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Configurações Gerais da API
    PROJECT_NAME: str = "MedAI Backend Engine"
    VERSION: str = "0.1"
    API_V1_STR: str = "/api/v1"
    
    # Configurações de Banco de Dados (Padrão local para desenvolvimento)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/medai_db"
    )
    
    # Configurações do AI Engine Local (Ollama)
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")

    class Config:
        case_sensitive = True

settings = Settings()
