"""
NvidiaProvider — implementa AIProvider usando a API compatível com OpenAI
roteada via Cloudflare Worker (chave nunca exposta no cliente).
"""
import time
import requests
from .base import AIProvider, AIResponse
from app.config import settings


class NvidiaProvider(AIProvider):
    """
    Usa o endpoint NVIDIA NIM via proxy Cloudflare.
    A API é compatível com OpenAI SDK — só muda a URL base.
    """

    @property
    def nome(self) -> str:
        return "nvidia"

    @property
    def modelo_atual(self) -> str:
        return settings.NVIDIA_MODEL

    def generate(self, system_prompt: str, user_prompt: str) -> AIResponse:
        inicio = time.monotonic()
        try:
            payload = {
                "model": settings.NVIDIA_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_prompt},
                ],
                "temperature": settings.AI_TEMPERATURE,
                "max_tokens":  settings.AI_MAX_TOKENS,
                "stream": False,
            }

            resp = requests.post(
                # O Worker Cloudflare recebe a request e injeta a nvapi-key
                # antes de encaminhar para integrate.api.nvidia.com/v1/chat/completions
                f"{settings.NVIDIA_PROXY_URL.rstrip('/')}/v1/chat/completions",
                json=payload,
                timeout=settings.AI_TIMEOUT_SECONDS,
                headers={"Content-Type": "application/json"},
            )
            latencia = int((time.monotonic() - inicio) * 1000)

            if resp.status_code != 200:
                return AIResponse(
                    conteudo="",
                    provider=self.nome,
                    modelo=self.modelo_atual,
                    latencia_ms=latencia,
                    erro=f"HTTP {resp.status_code}: {resp.text[:300]}",
                )

            data    = resp.json()
            conteudo = data["choices"][0]["message"]["content"].strip()
            uso      = data.get("usage", {})

            return AIResponse(
                conteudo=conteudo,
                provider=self.nome,
                modelo=self.modelo_atual,
                tokens_entrada=uso.get("prompt_tokens"),
                tokens_saida=uso.get("completion_tokens"),
                latencia_ms=latencia,
            )

        except requests.Timeout:
            return AIResponse(
                conteudo="", provider=self.nome, modelo=self.modelo_atual,
                erro=f"Timeout após {settings.AI_TIMEOUT_SECONDS}s",
            )
        except Exception as e:
            return AIResponse(
                conteudo="", provider=self.nome, modelo=self.modelo_atual,
                erro=str(e),
            )
