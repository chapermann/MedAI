"""
Interface base obrigatória para todos os AI Providers.
Qualquer provider que não implementar generate() não compila — por design.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class AIResponse:
    """Resposta padronizada de qualquer provider."""
    conteudo: str
    provider: str
    modelo: str
    tokens_entrada: Optional[int] = None
    tokens_saida: Optional[int]   = None
    latencia_ms: Optional[int]    = None
    erro: Optional[str]           = None

    @property
    def sucesso(self) -> bool:
        return self.erro is None


class AIProvider(ABC):
    """
    Contrato único que todos os providers devem implementar.
    O AI Engine só conversa com esta interface — nunca com providers diretamente.
    """

    @abstractmethod
    def generate(self, system_prompt: str, user_prompt: str) -> AIResponse:
        """
        Recebe system_prompt (diretrizes do especialista) e user_prompt
        (contexto clínico anonimizado) e retorna AIResponse padronizado.
        """
        ...

    @property
    @abstractmethod
    def nome(self) -> str:
        """Identificador do provider para logs e auditoria."""
        ...

    @property
    @abstractmethod
    def modelo_atual(self) -> str:
        """Modelo em uso para fins de auditoria e custo."""
        ...
