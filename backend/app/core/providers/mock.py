"""
MockProvider — usado em testes automatizados e CI.
Nunca faz chamada de rede. Retorna resposta controlada e previsível.
"""
from .base import AIProvider, AIResponse


class MockProvider(AIProvider):

    @property
    def nome(self) -> str:
        return "mock"

    @property
    def modelo_atual(self) -> str:
        return "mock-v1"

    def generate(self, system_prompt: str, user_prompt: str) -> AIResponse:
        # Resposta fixa para permitir testes determinísticos
        return AIResponse(
            conteudo=(
                "[MOCK] Paciente estável, sem intercorrências nas últimas 24h. "
                "Pendências: coleta de hemocultura e ajuste de sedação conforme RASS. "
                "Condutas da rotina: manter antibioticoterapia atual."
            ),
            provider=self.nome,
            modelo=self.modelo_atual,
            tokens_entrada=42,
            tokens_saida=38,
            latencia_ms=5,
        )
