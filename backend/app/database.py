"""
MedAI — Database Session
Cria engine SQLAlchemy e expõe get_db() para injeção de dependência nos routers.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,   # verifica conexão antes de usar (resilência em notebook ligado por horas)
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency do FastAPI — abre sessão, injeta no router, fecha ao terminar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
