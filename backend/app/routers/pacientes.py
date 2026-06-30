from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, BaseModel as PydanticBase
from datetime import datetime
from app.database import get_db
from app.models.clinical_models import Paciente, Internacao

router = APIRouter(prefix="/api/v1/pacientes", tags=["Gestão de Pacientes e Leitos"])

# --- SCHEMAS PYDANTIC (Validação de Entrada/Saída) ---
class PacienteCreate(BaseModel):
    nome_completo: str
    prontuario: str
    sexo: str
    data_nascimento: str  # Formato: YYYY-MM-DD
    especialidade: str
    leito_inicial: str
    diagnostico_admissao: str

class PacienteResponseGeral(BaseModel):
    id: int
    iniciais: str  # Exibe apenas as iniciais na listagem geral (Regra de UX)
    prontuario: str
    sexo: str
    especialidade: str
    leito_atual: str

    class Config:
        from_attributes = True

# --- FUNÇÃO AUXILIAR PARA GERAR INICIAIS ---
def gerar_iniciais(nome: str) -> str:
    """Transforma 'Fernando Chapermann' em 'F.C.'"""
    partes = nome.strip().split()
    if not partes:
        return "N.P."
    iniciais = [partes[0][0].upper()]
    if len(partes) > 1:
        iniciais.append(partes[-1][0].upper())
    return ".".join(iniciais) + "."

# --- ROTAS API ---

@router.post("/", response_model=PacienteResponseGeral, status_code=status.HTTP_201_CREATED)
def cadastrar_paciente(payload: PacienteCreate, db: Session = Depends(get_db)):
    """
    Cadastra o paciente e gera automaticamente o ciclo inicial da internação.
    """
    # Verifica duplicidade de prontuário
    existe = db.query(Paciente).filter(Paciente.prontuario == payload.prontuario).first()
    if existe:
        raise HTTPException(status_code=400, detail="Número de prontuário já cadastrado.")

    # 1. Cria a entidade Paciente calculando as iniciais
    novas_iniciais = gerar_iniciais(payload.nome_completo)
    dt_nascimento = datetime.strptime(payload.data_nascimento, "%Y-%m-%d")
    
    novo_paciente = Paciente(
        nome_completo=payload.nome_completo,
        iniciais=novas_iniciais,
        prontuario=payload.prontuario,
        sexo=payload.sexo,
        data_nascimento=dt_nascimento,
        especialidade=payload.especialidade
    )
    db.add(novo_paciente)
    db.flush()  # Gera o ID do paciente sem commitar a transação inteira

    # 2. Abre a Internação vinculada e define o leito ativo
    nova_internacao = Internacao(
        paciente_id=novo_paciente.id,
        leito_atual=payload.leito_inicial,
        diagnostico_principal=payload.diagnostico_admissao
    )
    db.add(nova_internacao)
    db.commit()
    db.refresh(novo_paciente)

    # Retorna o objeto adaptado para a resposta estruturada
    return {
        "id": novo_paciente.id,
        "iniciais": novo_paciente.iniciais,
        "prontuario": novo_paciente.prontuario,
        "sexo": novo_paciente.sexo,
        "especialidade": novo_paciente.especialidade,
        "leito_atual": payload.leito_inicial
    }

@router.get("/", response_model=List[PacienteResponseGeral])
def listar_mapa_de_leitos(db: Session = Depends(get_db)):
    """
    Retorna o painel geral de leitos ativos (Dashboard). O nome completo fica ocultado.
    """
    # Busca apenas pacientes que possuem internações ativas (onde data_alta é nula)
    resultados = db.query(Paciente).join(Internacao).filter(Internacao.data_alta == None).all()
    
    resposta = []
    for p in resultados:
        # Busca a internação ativa correspondente
        internacao_ativa = next((i for i in p.internacoes if i.data_alta is None), None)
        if internacao_ativa:
            resposta.append({
                "id": p.id,
                "iniciais": p.iniciais,
                "prontuario": p.prontuario,
                "sexo": p.sexo,
                "especialidade": p.especialidade,
                "leito_atual": internacao_ativa.leito_atual
            })
    return resposta
