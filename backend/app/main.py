from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.models import clinical_models
from app.routers import ai_operations

# 1. Garante a criação automatizada das tabelas estruturais no PostgreSQL (v0.1)
# O Clinical State Engine precisa dessa fundação relacional pronta ao subir o app.
clinical_models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Engine de orquestração clínica longitudinal e inteligência local do MedAI."
)

# 2. Configuração de CORS (Cross-Origin Resource Sharing)
# Permite que seu frontend em desenvolvimento ou via Tailscale consuma a API com segurança
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção/v1, restringir para os IPs específicos/Tailscale
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Registro das Rotas Assistenciais da API
app.include_router(ai_operations.router, prefix=settings.API_V1_STR)

# 4. Rota básica de Health Check para testar a saúde do Backend
@app.get("/", tags=["Health Check"])
def read_root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "message": "Clinical State Engine pronto para gerenciar o Dia Assistencial."
    }
