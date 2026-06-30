from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.clinical_models import DiaAssistencial
from app.core.ai_engine import AIEngine

router = APIRouter(prefix="/api/v1/ai", tags=["AI Clinical Operations"])
ai_engine = AIEngine()

@router.post("/gerar-passagem/{dia_assistencial_id}")
def endpoint_gerar_passagem(dia_assistencial_id: int, db: Session = Depends(get_db)):
    """
    Busca o Snapshot do Flipbook e processa a Passagem de Plantão (v0.1)
    """
    # 1. Recupera o snapshot real mapeado no banco relacional
    dia = db.query(DiaAssistencial).filter(DiaAssistencial.id == dia_assistencial_id).first()
    if not dia:
        raise HTTPException(status_code=404, detail="Dia Assistencial não encontrado.")
        
    # 2. Estrutura o payload de dados assistenciais respeitando as restrições de privacidade (Iniciais)
    paciente = dia.internacao.paciente
    checklist = dia.checklist
    
    snapshot_clinico = {
        "paciente_iniciais": paciente.iniciais,
        "leito": dia.internacao.leito_atual,
        "diagnostico": dia.internacao.diagnostico_principal,
        "dispositivos_ventilacao_mecanica": checklist.ventilacao_mecanica if checklist else "Não informado",
        "drogas_vasoativas_ativas": checklist.droga_vasoativa if checklist else "Não informado",
        "antibioticos_em_uso": checklist.antibioticos_ativos if checklist else {},
        "pendencias_do_dia": [p.descricao for p in dia.pendencias if not p.is_resolvida]
    }
    
    # 3. Dispara o processamento no Especialista correspondente
    texto_passagem = ai_engine.generate_clinical_product(
        prompt_type="passagem.md", 
        snapshot_data=snapshot_clinico
    )
    
    return {
        "dia_assistencial_id": dia_assistencial_id,
        "paciente": paciente.iniciais,
        "produto_gerado": "Passagem de Plantão",
        "conteudo": texto_passagem
    }
