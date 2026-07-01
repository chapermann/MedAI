"""
MedAI — AI Engine
Versão: 0.2

Orquestra o fluxo completo:
  Contexto Clínico → Sanitizer → Prompt Builder → Provider → Response Validator → Output

O Backend NUNCA chama um provider diretamente.
Toda chamada passa obrigatoriamente por este módulo.
"""
import os
import re
import time
from typing import Any, Dict, Optional

from app.config import settings
from app.core.providers.base import AIProvider, AIResponse
from app.core.providers.nvidia import NvidiaProvider
from app.core.providers.ollama import OllamaProvider
from app.core.providers.mock import MockProvider


# ---------------------------------------------------------------------------
# FACTORY — decide qual provider usar com base em settings.AI_PROVIDER
# ---------------------------------------------------------------------------

def _criar_provider() -> AIProvider:
    mapa = {
        "nvidia": NvidiaProvider,
        "ollama": OllamaProvider,
        "mock":   MockProvider,
    }
    cls = mapa.get(settings.AI_PROVIDER)
    if cls is None:
        raise ValueError(
            f"AI_PROVIDER inválido: '{settings.AI_PROVIDER}'. "
            f"Valores aceitos: {list(mapa.keys())}"
        )
    return cls()


# ---------------------------------------------------------------------------
# SANITIZER — gate obrigatório antes de qualquer envio externo
# ---------------------------------------------------------------------------

# Padrões de dados sensíveis que NUNCA devem sair do hospital
_PADROES_SENSIVEIS = [
    (re.compile(r"\b\d{3}[\.\-]?\d{3}[\.\-]?\d{3}[\-]?\d{2}\b"), "[CPF]"),
    (re.compile(r"\b\d{1,2}\.\d{3}\.\d{3}[\-/]?\d{1}[\-/]?\d{2}\b"), "[RG]"),
    (re.compile(r"\b\d{11}\b"), "[TELEFONE]"),          # celular sem formatação
    (re.compile(r"\(\d{2}\)\s?\d{4,5}[\-\s]\d{4}"), "[TELEFONE]"),
    (re.compile(r"[\w\.-]+@[\w\.-]+\.\w{2,4}"), "[EMAIL]"),
    (re.compile(r"\bCEP[\s:]*\d{5}[\-]?\d{3}\b", re.IGNORECASE), "[CEP]"),
]


def sanitizar(texto: str) -> str:
    """
    Remove identificadores pessoais do texto antes de qualquer envio externo.
    Retorna o texto limpo. Nunca lança exceção — se falhar, retorna o original
    com marcador de erro para revisão manual.
    """
    if not texto:
        return texto
    try:
        resultado = texto
        for padrao, substituto in _PADROES_SENSIVEIS:
            resultado = padrao.sub(substituto, resultado)
        return resultado
    except Exception:
        # Nunca bloquear o fluxo clínico por falha na sanitização —
        # mas marcar para auditoria obrigatória
        return f"[SANITIZAÇÃO FALHOU — REVISAR MANUALMENTE]\n{texto}"


# ---------------------------------------------------------------------------
# PROMPT BUILDER — carrega templates versionados em disco
# ---------------------------------------------------------------------------

_PROMPTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts")


def _carregar_template(nome_arquivo: str) -> str:
    """
    Carrega o arquivo .md do Especialista correspondente.
    Templates ficam em backend/app/prompts/ — versionados junto com o código.
    """
    caminho = os.path.join(_PROMPTS_DIR, nome_arquivo)
    if not os.path.exists(caminho):
        raise FileNotFoundError(
            f"Template de prompt não encontrado: {caminho}\n"
            f"Arquivos disponíveis: {os.listdir(_PROMPTS_DIR)}"
        )
    with open(caminho, "r", encoding="utf-8") as f:
        return f.read()


def _montar_system_prompt(template_especialista: str) -> str:
    """
    Combina as Leis de Ferro universais com as diretrizes do Especialista específico.
    """
    leis_de_ferro = (
        "Você é o MedAI, uma Secretária Executiva de Alta Especialidade Médica.\n"
        "Sua função exclusiva é ORGANIZAR e ESTRUTURAR informação clínica já existente.\n\n"
        "LEIS DE FERRO — nunca violar:\n"
        "1. NUNCA invente, deduza ou complete lacunas com imaginação (Navalha de Occam).\n"
        "2. Se um dado clínico não estiver disponível na entrada, escreva exatamente:\n"
        "   'Não foi possível localizar esta informação na documentação disponível.'\n"
        "3. NUNCA modifique dados clínicos — apenas organize e estruture o que recebeu.\n"
        "4. NUNCA assuma diagnósticos, prescrições ou condutas não documentadas.\n"
        "5. Seja objetivo, gentil e profissional. Não elogie a equipe. Não seja prolixo.\n"
        "6. Evite emojis, abreviações informais, gírias ou maneirismos.\n"
        "7. O médico é sempre o responsável final. Você apenas prepara o material.\n\n"
        "─────────────────────────────────────────────────\n"
        "DIRETRIZES DO ESPECIALISTA:\n"
        f"{template_especialista}"
    )
    return leis_de_ferro


def _montar_user_prompt(snapshot: Dict[str, Any]) -> str:
    """
    Formata o snapshot clínico como texto estruturado para o modelo.
    O snapshot já deve ter passado pelo sanitizer antes de chegar aqui.
    """
    linhas = ["### SNAPSHOT CLÍNICO DO DIA ASSISTENCIAL:\n"]
    for chave, valor in snapshot.items():
        if valor is not None:
            linhas.append(f"- {chave.replace('_', ' ').title()}: {valor}")
    return "\n".join(linhas)


# ---------------------------------------------------------------------------
# RESPONSE VALIDATOR — verifica se a resposta é utilizável
# ---------------------------------------------------------------------------

_MARCADORES_FALHA = [
    "não foi possível processar",
    "ocorreu um erro",
    "i cannot",
    "i'm sorry",
    "as an ai",
    "como ia,",
]


def _validar_resposta(resposta: AIResponse) -> AIResponse:
    """
    Verifica se a resposta do modelo é clinicamente utilizável.
    Não altera o conteúdo — apenas detecta falhas óbvias.
    """
    if not resposta.sucesso:
        return resposta

    conteudo_lower = resposta.conteudo.lower()
    for marcador in _MARCADORES_FALHA:
        if marcador in conteudo_lower:
            resposta.erro = (
                f"Resposta suspeita detectada (contém '{marcador}'). "
                "Requer revisão médica obrigatória antes de uso."
            )
            break

    if len(resposta.conteudo.strip()) < 20:
        resposta.erro = "Resposta muito curta — possível falha de geração."

    return resposta


# ---------------------------------------------------------------------------
# AI ENGINE — ponto único de orquestração
# ---------------------------------------------------------------------------

class AIEngine:
    """
    Único ponto de entrada para todas as operações de IA do MedAI.
    O Backend chama APENAS este módulo — nunca providers diretamente.
    """

    def __init__(self, provider: Optional[AIProvider] = None):
        self._provider = provider or _criar_provider()

    @property
    def provider_ativo(self) -> str:
        return self._provider.nome

    def gerar_produto_clinico(
        self,
        especialista: str,
        snapshot_clinico: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Fluxo principal:
        1. Carrega template do Especialista
        2. Sanitiza o snapshot (remove CPF, telefone etc.)
        3. Monta prompts (system + user)
        4. Chama o provider ativo
        5. Valida a resposta
        6. Retorna resultado estruturado para o router salvar no banco

        Args:
            especialista: nome do arquivo .md em backend/app/prompts/
                          ex: "passagem.md", "round.md", "evolucao.md"
            snapshot_clinico: dict com dados do DiaAssistencial
                              (vem da vw_estado_clinico equivalente em Python)
        Returns:
            dict com conteudo, provider, modelo, tokens, latencia, erro, payload_sanitizado
        """
        inicio = time.monotonic()

        # 1. Carrega diretrizes do Especialista
        template = _carregar_template(especialista)

        # 2. Sanitiza ANTES de montar o prompt
        snapshot_sanitizado = {
            k: sanitizar(str(v)) if isinstance(v, str) else v
            for k, v in snapshot_clinico.items()
        }

        # 3. Monta prompts
        system_prompt = _montar_system_prompt(template)
        user_prompt   = _montar_user_prompt(snapshot_sanitizado)

        # 4. Chama o provider
        resposta = self._provider.generate(system_prompt, user_prompt)

        # 5. Valida
        resposta = _validar_resposta(resposta)

        return {
            "conteudo":            resposta.conteudo,
            "provider":            resposta.provider,
            "modelo":              resposta.modelo,
            "tokens_entrada":      resposta.tokens_entrada,
            "tokens_saida":        resposta.tokens_saida,
            "latencia_ms":         resposta.latencia_ms,
            "erro":                resposta.erro,
            "sucesso":             resposta.sucesso,
            # Payload sanitizado preservado para gravar em LogEnvioExterno
            "payload_sanitizado":  f"{system_prompt}\n\n{user_prompt}",
        }

    def trocar_provider(self, novo_provider: AIProvider) -> None:
        """
        Substitui o provider em runtime sem reiniciar o servidor.
        Implementa AI_RULES Regra 14 (toda IA substituível).
        """
        self._provider = novo_provider


# Instância singleton reutilizada pelos routers
ai_engine = AIEngine()
