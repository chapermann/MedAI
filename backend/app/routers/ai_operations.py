"""
MedAI — Router: AI Clinical Operations
Versão: 0.2

Todos os endpoints de IA:
  - Recebem contexto clínico do banco
  - Chamam AIEngine (nunca o provider diretamente)
  - Gravam resultado bruto + aprovado no banco
  - Gravam LogEnvioExterno para auditoria
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.clinical_models import (
    DiaAssistencial,
    PassagemPlantao,
    PassagemPlantaoHistorico,
    LogEnvioExterno,
    OrigemRegistro,
)
from app.core.ai_engine import ai_engine
from app.config import settings

router = APIRouter(prefix="/api/v1/ai", tags=["AI — Operações Clínicas"])


# ---------------------------------------------------------------------------
# HELPER: monta snapshot a partir do DiaAssistencial (equivalente à vw_estado_clinico)
# ---------------------------------------------------------------------------

def _montar_snapshot(dia: DiaAssistencial) -> dict:
    """
    Extrai apenas os campos necessários para a IA — sem nome_completo, sem CPF.
    Alinhado à vw_estado_clinico do DATABASE_SCHEMA.md.
    """
    paciente   = dia.internacao.paciente
    checklist  = dia.checklist
    pendencias = [p.descricao for p in dia.pendencias if p.status.value != "concluida"]

    # Calcular faixa etária em vez de data de nascimento exata
    hoje = datetime.utcnow()
    idade = hoje.year - paciente.data_nascimento.year
    faixa_etaria = f"{(idade // 5) * 5}–{(idade // 5) * 5 + 4} anos"

    return {
        "paciente_iniciais":      paciente.iniciais,
        "prontuario":             paciente.prontuario,
        "faixa_etaria":           faixa_etaria,
        "sexo":                   paciente.sexo,
        "leito":                  dia.internacao.leito_atual,
        "setor":                  dia.internacao.setor.value if dia.internacao.setor else None,
        "diagnostico_principal":  dia.internacao.diagnostico_principal,
        "diagnosticos_secundarios": dia.internacao.diagnosticos_secundarios,
        "gravidade":              dia.gravidade.value if dia.gravidade else None,
        "ventilacao_mecanica":    dia.ventilacao,
        "droga_vasoativa":        dia.droga_vasoativa,
        "isolamento":             dia.isolamento,
        "antibioticos":           checklist.antibioticos_ativos if checklist else None,
        "dispositivos_invasivos": checklist.dispositivos_invasivos if checklist else None,
        "pendencias_abertas":     pendencias if pendencias else "Nenhuma pendência registrada.",
        "data_referencia":        dia.data_referencia.strftime("%d/%m/%Y"),
    }


# ---------------------------------------------------------------------------
# POST /ai/gerar-passagem/{dia_assistencial_id}
# Fase 1 do projeto: validar qualidade do resumo gerado
# ---------------------------------------------------------------------------

@router.post("/gerar-passagem/{dia_assistencial_id}", status_code=status.HTTP_201_CREATED)
def gerar_passagem_plantao(
    dia_assistencial_id: str,
    db: Session = Depends(get_db),
):
    """
    Gera a Passagem de Plantão via AI Engine.

    Fluxo:
    1. Busca DiaAssistencial no banco
    2. Monta snapshot anonimizado
    3. Chama AIEngine → NvidiaProvider (ou fallback)
    4. Salva resumo_bruto_ia + registra LogEnvioExterno
    5. Retorna para o médico revisar antes de qualquer gravação definitiva

    O médico DEVE aprovar via PATCH /ai/aprovar-passagem/{id} antes
    de o conteúdo virar passagem oficial.
    """
    # 1. Busca
    dia = db.query(DiaAssistencial).filter(
        DiaAssistencial.id == dia_assistencial_id
    ).first()
    if not dia:
        raise HTTPException(status_code=404, detail="Dia Assistencial não encontrado.")

    # 2. Snapshot anonimizado
    snapshot = _montar_snapshot(dia)

    # 3. AI Engine (Sanitizer + Provider + Validator internos)
    resultado = ai_engine.gerar_produto_clinico(
        especialista="passagem.md",
        snapshot_clinico=snapshot,
    )

    # 4a. Grava log de envio externo (auditoria obrigatória — SECURITY.md 4.4)
    # Nota: usuario_id aqui seria o do JWT — simplificado na v0.2
    # TODO: extrair usuario_id do token JWT quando auth estiver implementada
    log = LogEnvioExterno(
        especialista="passagem_plantao",
        payload_enviado=resultado["payload_sanitizado"],
        provider=resultado["provider"],
        modelo=resultado["modelo"],
        tokens_entrada=resultado["tokens_entrada"],
        tokens_saida=resultado["tokens_saida"],
        latencia_ms=resultado["latencia_ms"],
        usuario_id="00000000-0000-0000-0000-000000000001",  # placeholder até auth
    )
    db.add(log)

    # 4b. Salva passagem com status "aguardando revisão médica"
    # resumo_estruturado começa igual ao bruto — médico edita antes de aprovar
    nova_passagem = PassagemPlantao(
        dia_assistencial_id=dia_assistencial_id,
        resumo_bruto_ia=resultado["conteudo"],
        resumo_estruturado=resultado["conteudo"],  # médico editará via PATCH
        origem=OrigemRegistro.manual,
        criado_por="00000000-0000-0000-0000-000000000001",  # placeholder até auth
    )
    db.add(nova_passagem)

    try:
        db.commit()
        db.refresh(nova_passagem)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao persistir: {str(e)}")

    return {
        "passagem_id":      nova_passagem.id,
        "dia_assistencial": dia_assistencial_id,
        "paciente":         snapshot["paciente_iniciais"],
        "provider":         resultado["provider"],
        "modelo":           resultado["modelo"],
        "latencia_ms":      resultado["latencia_ms"],
        "aviso":            resultado["erro"],         # None se não houver problema
        "status":           "aguardando_revisao_medica",
        "resumo_gerado":    resultado["conteudo"],
        "instrucao":        (
            "Revise o conteúdo acima e aprove via "
            f"PATCH /api/v1/ai/aprovar-passagem/{nova_passagem.id}"
        ),
    }


# ---------------------------------------------------------------------------
# PATCH /ai/aprovar-passagem/{passagem_id}
# Médico revisa e aprova — só então vira passagem oficial
# ---------------------------------------------------------------------------

from pydantic import BaseModel

class AprovarPassagemPayload(BaseModel):
    resumo_revisado: str      # texto após edição médica
    medico_id: str            # TODO: virá do JWT na v0.3


@router.patch("/aprovar-passagem/{passagem_id}")
def aprovar_passagem(
    passagem_id: str,
    payload: AprovarPassagemPayload,
    db: Session = Depends(get_db),
):
    """
    Médico aprova (e opcionalmente edita) a passagem gerada pela IA.
    Versiona automaticamente: versão anterior → _historico, nova versão no registro principal.
    AI_RULES Regra 8: toda alteração exige confirmação humana.
    """
    passagem = db.query(PassagemPlantao).filter(
        PassagemPlantao.id == passagem_id
    ).first()
    if not passagem:
        raise HTTPException(status_code=404, detail="Passagem não encontrada.")

    # Arquiva versão atual antes de sobrescrever (AI_RULES Regra 9)
    historico = PassagemPlantaoHistorico(
        passagem_id=passagem.id,
        resumo_estruturado=passagem.resumo_estruturado,
        versao=passagem.versao,
        criado_por=passagem.criado_por,
    )
    db.add(historico)

    # Atualiza com o texto revisado pelo médico
    passagem.resumo_estruturado = payload.resumo_revisado
    passagem.revisado_por       = payload.medico_id
    passagem.revisado_em        = datetime.utcnow()
    passagem.versao             += 1

    try:
        db.commit()
        db.refresh(passagem)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao aprovar passagem: {str(e)}")

    return {
        "passagem_id": passagem.id,
        "versao":      passagem.versao,
        "status":      "aprovada",
        "revisado_em": passagem.revisado_em.isoformat(),
    }


# ---------------------------------------------------------------------------
# POST /ai/gerar-round/{dia_assistencial_id}
# ---------------------------------------------------------------------------

@router.post("/gerar-round/{dia_assistencial_id}", status_code=status.HTTP_201_CREATED)
def gerar_round(
    dia_assistencial_id: str,
    db: Session = Depends(get_db),
):
    """
    Gera o resumo organizado do Round Médico.
    Mesmo fluxo da passagem — provider + sanitizer + log.
    """
    dia = db.query(DiaAssistencial).filter(
        DiaAssistencial.id == dia_assistencial_id
    ).first()
    if not dia:
        raise HTTPException(status_code=404, detail="Dia Assistencial não encontrado.")

    snapshot  = _montar_snapshot(dia)
    resultado = ai_engine.gerar_produto_clinico(
        especialista="round.md",
        snapshot_clinico=snapshot,
    )

    log = LogEnvioExterno(
        especialista="round",
        payload_enviado=resultado["payload_sanitizado"],
        provider=resultado["provider"],
        modelo=resultado["modelo"],
        tokens_entrada=resultado["tokens_entrada"],
        tokens_saida=resultado["tokens_saida"],
        latencia_ms=resultado["latencia_ms"],
        usuario_id="00000000-0000-0000-0000-000000000001",
    )
    db.add(log)
    db.commit()

    return {
        "dia_assistencial": dia_assistencial_id,
        "paciente":         snapshot["paciente_iniciais"],
        "especialista":     "round",
        "provider":         resultado["provider"],
        "aviso":            resultado["erro"],
        "status":           "aguardando_revisao_medica",
        "resumo_gerado":    resultado["conteudo"],
    }


# ---------------------------------------------------------------------------
# POST /ai/gerar-evolucao/{dia_assistencial_id}
# ---------------------------------------------------------------------------

@router.post("/gerar-evolucao/{dia_assistencial_id}", status_code=status.HTTP_201_CREATED)
def gerar_evolucao(
    dia_assistencial_id: str,
    db: Session = Depends(get_db),
):
    """
    Organiza a evolução médica do dia (texto livre → estrutura canônica).
    """
    dia = db.query(DiaAssistencial).filter(
        DiaAssistencial.id == dia_assistencial_id
    ).first()
    if not dia:
        raise HTTPException(status_code=404, detail="Dia Assistencial não encontrado.")

    snapshot  = _montar_snapshot(dia)
    resultado = ai_engine.gerar_produto_clinico(
        especialista="evolucao.md",
        snapshot_clinico=snapshot,
    )

    log = LogEnvioExterno(
        especialista="evolucao",
        payload_enviado=resultado["payload_sanitizado"],
        provider=resultado["provider"],
        modelo=resultado["modelo"],
        tokens_entrada=resultado["tokens_entrada"],
        tokens_saida=resultado["tokens_saida"],
        latencia_ms=resultado["latencia_ms"],
        usuario_id="00000000-0000-0000-0000-000000000001",
    )
    db.add(log)
    db.commit()

    return {
        "dia_assistencial": dia_assistencial_id,
        "paciente":         snapshot["paciente_iniciais"],
        "especialista":     "evolucao",
        "provider":         resultado["provider"],
        "aviso":            resultado["erro"],
        "status":           "aguardando_revisao_medica",
        "conteudo_gerado":  resultado["conteudo"],
    }


# ---------------------------------------------------------------------------
# GET /ai/status — diagnóstico do AI Engine
# ---------------------------------------------------------------------------

@router.get("/status", tags=["AI — Diagnóstico"])
def status_ai_engine():
    """Informa qual provider está ativo. Útil para debug no painel admin."""
    return {
        "provider_ativo": ai_engine.provider_ativo,
        "modelo":         settings.AI_PROVIDER,
        "temperatura":    settings.AI_TEMPERATURE,
    }
