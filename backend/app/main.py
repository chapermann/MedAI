"""
MedAI — FastAPI Application Entry Point
Versão: 0.2

Correções em relação à v0.1:
  - Routers duplicados removidos (pacientes e ai_operations eram registrados 2x cada)
  - CORS restrito para desenvolvimento local + Tailscale (não mais allow_origins=["*"])
  - Importação de database separada do models
  - Lifespan event para criação de tabelas (substitui o create_all no módulo raiz)
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.models.clinical_models import Base
from app.routers import ai_operations, pacientes, dia_assistencial


# ---------------------------------------------------------------------------
# LIFESPAN — executa na subida e descida do servidor
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Cria tabelas que ainda não existem no banco (idempotente)
    # Em produção, preferir Alembic migrations em vez deste create_all
    Base.metadata.create_all(bind=engine)
    yield
    # Teardown (se necessário no futuro): fechar pools, etc.


# ---------------------------------------------------------------------------
# APLICAÇÃO
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "MedAI — Clinical State Engine. "
        "Organização inteligente da informação clínica assistencial."
    ),
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
# Em desenvolvimento local + Tailscale: permitir localhost e a rede Tailscale
# Em produção: restringir para o IP/domínio Tailscale real do hospital
ALLOWED_ORIGINS = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ---------------------------------------------------------------------------
# ROUTERS — cada prefixo registrado exatamente UMA vez
# ---------------------------------------------------------------------------

app.include_router(pacientes.router)
app.include_router(dia_assistencial.router)
app.include_router(ai_operations.router)

# ---------------------------------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health Check"])
def health_check():
    return {
        "status":    "online",
        "sistema":   settings.PROJECT_NAME,
        "versao":    settings.VERSION,
        "provider":  settings.AI_PROVIDER,
        "mensagem":  "Clinical State Engine operacional.",
    }
