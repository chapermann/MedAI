"""
OllamaProvider — provider local para desenvolvimento e fallback.
Não envia dados para fora da rede local.
"""
import time
import requests
from .base import AIProvider, AIResponse
from app.config import settings


class OllamaProvider(AIProvider):

    @property
    def nome(self) -> str:
        return "ollama"

    @property
    def modelo_atual(self) -> str:
        return settings.OLLAMA_MODEL

    def generate(self, system_prompt: str, user_prompt: str) -> AIResponse:
        inicio = time.monotonic()
        try:
            # Ollama /api/generate recebe um único campo `prompt`
            prompt_completo = f"{system_prompt}\n\n{user_prompt}"

            resp = requests.post(
                settings.OLLAMA_URL,
                json={
                    "model":  settings.OLLAMA_MODEL,
                    "prompt": prompt_completo,
                    "stream": False,
                    "options": {"temperature": settings.AI_TEMPERATURE},
                },
                timeout=settings.AI_TIMEOUT_SECONDS,
            )
            latencia = int((time.monotonic() - inicio) * 1000)

            if resp.status_code != 200:
                return AIResponse(
                    conteudo="", provider=self.nome, modelo=self.modelo_atual,
                    latencia_ms=latencia,
                    erro=f"Ollama HTTP {resp.status_code}: {resp.text[:300]}",
                )

            conteudo = resp.json().get("response", "").strip()
            return AIResponse(
                conteudo=conteudo,
                provider=self.nome,
                modelo=self.modelo_atual,
                latencia_ms=latencia,
            )

        except requests.Timeout:
            return AIResponse(
                conteudo="", provider=self.nome, modelo=self.modelo_atual,
                erro="Timeout — Ollama local não respondeu.",
            )
        except Exception as e:
            return AIResponse(
                conteudo="", provider=self.nome, modelo=self.modelo_atual,
                erro=str(e),
            )
