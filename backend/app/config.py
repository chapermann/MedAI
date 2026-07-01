"""
MedAI — Configurações Centrais
Versão: 0.2
Todas as variáveis sensíveis vêm de .env — nunca hardcoded aqui.
"""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Geral ──────────────────────────────────────────────────────────────
    PROJECT_NAME: str = "MedAI Backend Engine"
    VERSION: str      = "0.2"
    API_V1_STR: str   = "/api/v1"

    # ── Banco de dados ──────────────────────────────────────────────────────
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/medai_db"
    )

    # ── JWT ────────────────────────────────────────────────────────────────
    SECRET_KEY: str         = os.getenv("SECRET_KEY", "TROQUE_EM_PRODUCAO_IMEDIATAMENTE")
    ALGORITHM: str          = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15       # access token curto
    REFRESH_TOKEN_EXPIRE_HOURS: int  = 12       # cobre 1 plantão completo

    # ── AI Provider ────────────────────────────────────────────────────────
    # Provider ativo: "nvidia" | "ollama" | "mock"
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "nvidia")

    # NVIDIA NIM via Cloudflare Worker (chave nunca exposta no código)
    NVIDIA_PROXY_URL: str  = os.getenv(
        "NVIDIA_PROXY_URL",
        "https://nvidia-api-proxy.chapermann.workers.dev/"
    )
    NVIDIA_MODEL: str      = os.getenv("NVIDIA_MODEL", "meta/llama-3.3-70b-instruct")

    # Ollama local (fallback / desenvolvimento)
    OLLAMA_URL: str   = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")

    # Temperatura baixa para minimizar alucinações clínicas
    AI_TEMPERATURE: float = 0.1
    AI_MAX_TOKENS: int    = 2048
    AI_TIMEOUT_SECONDS: int = 60

    class Config:
        case_sensitive = True


settings = Settings()
