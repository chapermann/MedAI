from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.database import get_db
from app.models.clinical_models import DiaAssistencial, ChecklistClinico
from app.core.decision_support import calcular_escore_alta_enfermaria

router = APIRouter(prefix="/api/v1/dia-assistencial", tags=["Dia Assistencial & Checklist"])

# --- SCHEMA PYDANTIC (Validação do Questionário de Entrada) ---
class QuestionarioAltaIn(BaseModel):
    internacao_id: int
    usuario_responsavel_id: int
    
    # Os 10 Critérios Clínicos Obrigatórios da Calculadora
    alta_cirurgica: bool
    sem_condicao_cirurgica: bool
    ar_ambiente: bool
    o2_baixo_fluxo: bool
    lucido: bool
    nao_lucido_porem_estavel: bool
    sem_dor: bool
    retorno_recente_enfermaria: bool
    doenca_descompensada: bool
    especialidade_disponivel: bool

    # Dados complementares opcionais para o snapshot do checklist
    ventilacao_mecanica: bool = False
    droga_vasoativa: bool = False
    sedacao: bool = False
    dispositivos_invasivos: Optional[Dict[str, Any]] = None
    antibioticos_ativos: Optional[Dict[str, Any]] = None


@router.post("/processar-checklist", status_code=status.HTTP_201_CREATED)
def processar_e_salvar_checklist(payload: QuestionarioAltaIn, db: Session = Depends(get_db)):
    """
    Recebe o questionário do leito, executa a lógica matemática de suporte à decisão 
    para definir a lâmpada assistencial e salva o snapshot diário no banco SQL.
    """
    # 1. Executa a função pura em Python para garantir 100% de precisão no cálculo do escore
    dados_calculadora = {
        "alta_cirurgica": payload.alta_cirurgica,
        "sem_condicao_cirurgica": payload.sem_condicao_cirurgica,
        "ar_ambiente": payload.ar_ambiente,
        "o2_baixo_fluxo": payload.o2_baixo_fluxo,
        "lucido": payload.lucido,
        "nao_lucido_porem_estavel": payload.nao_lucido_porem_estavel,
        "sem_dor": payload.sem_dor,
        "retorno_recente_enfermaria": payload.retorno_recente_enfermaria,
        "doenca_descompensada": payload.doenca_descompensada,
        "especialidade_disponivel": payload.especialidade_disponivel
    }
    
    resultado_escore = calcular_escore_alta_enfermaria(dados_calculadora)

    # 2. Cria a entidade mestre do Dia Assistencial (Flipbook Snapshot)
    novo_dia = DiaAssistencial(
        internacao_id=payload.internacao_id,
        usuario_responsavel_id=payload.usuario_responsavel_id,
        resumo_ia_diario=f"Escore de Alta: {resultado_escore['pontuacao_total']} | Status: {resultado_escore['status_clinico']} | Lâmpada: {resultado_escore['indicador_visual']}"
    )
    db.add(novo_dia)
    db.flush()  # Captura o ID gerado para injetar no relacionamento do checklist

    # 3. Cria a entidade do Checklist Clínico com os parâmetros estruturados e o dump da calculadora
    novo_checklist = ChecklistClinico(
        dia_assistencial_id=novo_dia.id,
        ventilacao_mecanica=payload.ventilacao_mecanica,
        droga_vasoativa=payload.droga_vasoativa,
        sedacao=payload.sedacao,
        dispositivos_invasivos=payload.dispositivos_invasivos,
        antibioticos_ativos=payload.antibioticos_ativos
    )
    db.add(novo_checklist)
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail= f"Erro crítico ao persistir snapshot no Clinical State Engine: {str(e)}"
        )

    # 4. Retorna a resposta unificada estruturada ideal para o Frontend processar os cartões visuais
    return {
        "dia_assistencial_id": novo_dia.id,
        "internacao_id": payload.internacao_id,
        "calculo_alta": {
            "pontuacao_obtida": resultado_escore["pontuacao_total"],
            "diagnostico_alta": resultado_escore["status_clinico"],
            "lampada_status": resultado_escore["indicador_visual"]
        },
        "mensagem": "Ciclo diário da informação clínica registrado com sucesso."
    }
