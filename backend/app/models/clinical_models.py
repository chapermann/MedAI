"""
MedAI — Clinical Models
Versão: 0.2
Mudanças em relação à v0.1:
  - PKs migradas de Integer para UUID (evita colisão, habilita geração offline)
  - Tabelas de histórico (_historico) para versionamento imutável (AI_RULES Regra 9)
  - Campo `setor` adicionado a Internacao (necessário para RLS por setor)
  - `is_resolvida` em Pendencia virou enum StatusPendencia (aberta/em_andamento/concluida)
  - RegistroAuditoria adaptado para UUID
"""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Column, String, DateTime, ForeignKey,
    Text, Boolean, JSON, Integer, Enum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


def new_uuid() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# ENUMS
# ---------------------------------------------------------------------------

class PerfilUsuario(PyEnum):
    medico_residente    = "medico_residente"
    medico_assistente   = "medico_assistente"
    medico_chefe        = "medico_chefe"
    administrador       = "administrador"
    academico           = "academico"


class SetorHospitalar(PyEnum):
    cti         = "cti"
    sala_vermelha = "sala_vermelha"
    emergencia  = "emergencia"
    enfermaria  = "enfermaria"
    retaguarda  = "retaguarda"


class OrigemRegistro(PyEnum):
    manual      = "manual"
    voz         = "voz"
    importado   = "importado"


class GravidadeClinica(PyEnum):
    estavel     = "estavel"
    instavel    = "instavel"
    grave       = "grave"
    critico     = "critico"


class StatusPendencia(PyEnum):
    aberta          = "aberta"
    em_andamento    = "em_andamento"
    concluida       = "concluida"
    cancelada       = "cancelada"


class StatusExame(PyEnum):
    solicitado                  = "solicitado"
    realizado_aguardando_laudo  = "realizado_aguardando_laudo"
    laudo_disponivel            = "laudo_disponivel"

class ChecklistRotina(Base):
    __tablename__ = "checklists_rotina"

    id                  = Column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    dia_assistencial_id = Column(UUID(as_uuid=False), ForeignKey("dias_assistenciais.id"), nullable=False)
    preenchido_por      = Column(UUID(as_uuid=False), ForeignKey("usuarios.id"), nullable=False)
    preenchido_em       = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Suporte básico
    tem_dieta           = Column(Boolean, nullable=True)
    tem_analgesia       = Column(Boolean, nullable=True)
    tem_sedacao         = Column(Boolean, nullable=True)
    tem_aminas          = Column(Boolean, nullable=True)
    em_uso_atb          = Column(Boolean, nullable=True)
    glicemia_na_meta    = Column(Boolean, nullable=True)  # meta 80-180 mg/dL

    # Decisões de progressão
    previsao_transferencia_enfermaria = Column(Boolean, nullable=True)
    iniciar_desmame_ventilatório      = Column(Boolean, nullable=True)
    tentar_extubacao_tre              = Column(Boolean, nullable=True)
    diminuir_sedacao                  = Column(Boolean, nullable=True)
    diminuir_analgesia                = Column(Boolean, nullable=True)

    # Parâmetros ventilatórios (quando em VM)
    vm_volume_corrente_adequado = Column(Boolean, nullable=True)  # 6-8 ml/kg
    vm_pressao_plateau          = Column(String(20), nullable=True)
    vm_modo_ventilatório        = Column(String(50), nullable=True)

    # Profilaxias
    profilaxias_aplicadas = Column(Boolean, nullable=True)  # TVP, úlcera córnea, duodenal, LPP

    # Dispositivos
    dispositivo_remover = Column(Boolean, nullable=True)
    dispositivo_trocar  = Column(Boolean, nullable=True)

    # Cuidados de enfermagem / fisio (Rotina notifica)
    mobilizacao_ativa      = Column(Boolean, nullable=True)
    mobilizacao_passiva    = Column(Boolean, nullable=True)
    cuidados_pele_lpp      = Column(Boolean, nullable=True)
    acompanhou_banho       = Column(Boolean, nullable=True)
    mudanca_decubito       = Column(Boolean, nullable=True)
    cabeceira_elevada      = Column(Boolean, nullable=True)  # 30-45°

    # Pendências externas
    exames_pendentes       = Column(Boolean, nullable=True)
    pareceres_pendentes    = Column(Boolean, nullable=True)
    laudos_pendentes       = Column(Boolean, nullable=True)
    febre                  = Column(Boolean, nullable=True)

    # Equipe notificada
    notificou_enfermagem   = Column(Boolean, nullable=True)
    notificou_nutricao     = Column(Boolean, nullable=True)
    notificou_fisioterapia = Column(Boolean, nullable=True)
    notificou_fonoaudiologia = Column(Boolean, nullable=True)
    notificou_odontologia  = Column(Boolean, nullable=True)

    # Relação com familiares
    relacao_familiar = Column(String(20), nullable=True)  # saudavel / complicada / conturbada

    # Observações livres da rotina
    observacoes        = Column(Text, nullable=True)

    dia_assistencial = relationship("DiaAssistencial", back_populates="checklist_rotina")

# ---------------------------------------------------------------------------
# USUARIO
# ---------------------------------------------------------------------------

class Usuario(Base):
    __tablename__ = "usuarios"

    id          = Column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    nome        = Column(String(255), nullable=False)
    crm         = Column(String(30), unique=True, nullable=True)
    cargo       = Column(String(100))
    especialidade = Column(String(100))
    perfil      = Column(Enum(PerfilUsuario), nullable=False)
    senha_hash  = Column(String(255), nullable=False)
    ativo       = Column(Boolean, default=True, nullable=False)
    criado_em   = Column(DateTime, default=datetime.utcnow, nullable=False)


# ---------------------------------------------------------------------------
# PACIENTE
# ---------------------------------------------------------------------------

class Paciente(Base):
    __tablename__ = "pacientes"

    id              = Column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    # nome_completo nunca aparece na interface — só nas queries internas controladas
    nome_completo   = Column(String(255), nullable=False)
    iniciais        = Column(String(20), nullable=False)   # gerado automaticamente
    prontuario      = Column(String(50), unique=True, nullable=False, index=True)
    sexo            = Column(String(20), nullable=False)
    data_nascimento = Column(DateTime, nullable=False)
    especialidade   = Column(String(100))
    criado_em       = Column(DateTime, default=datetime.utcnow, nullable=False)

    internacoes = relationship("Internacao", back_populates="paciente")


# ---------------------------------------------------------------------------
# INTERNACAO
# ---------------------------------------------------------------------------

class Internacao(Base):
    __tablename__ = "internacoes"

    id                      = Column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    paciente_id             = Column(UUID(as_uuid=False), ForeignKey("pacientes.id"), nullable=False)
    leito_atual             = Column(String(30), nullable=False)
    setor                   = Column(Enum(SetorHospitalar), nullable=False)
    diagnostico_principal   = Column(Text, nullable=False)
    diagnosticos_secundarios = Column(JSON, nullable=True)  # lista de strings
    procedencia             = Column(String(100))
    data_admissao           = Column(DateTime, default=datetime.utcnow, nullable=False)
    data_alta               = Column(DateTime, nullable=True)
    is_obito                = Column(Boolean, default=False, nullable=False)
    ativa                   = Column(Boolean, default=True, nullable=False)

    paciente        = relationship("Paciente", back_populates="internacoes")
    dias_assistenciais = relationship("DiaAssistencial", back_populates="internacao")


# ---------------------------------------------------------------------------
# DIA ASSISTENCIAL  (unidade central — "flipbook snapshot")
# ---------------------------------------------------------------------------

class DiaAssistencial(Base):
    """
    Menor unidade do MedAI. Representa o ciclo completo diário de informação.
    Uma internação tem N dias assistenciais; cada dia tem 1 de cada entidade abaixo.
    """
    __tablename__ = "dias_assistenciais"

    id              = Column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    internacao_id   = Column(UUID(as_uuid=False), ForeignKey("internacoes.id"), nullable=False)
    data_referencia = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    usuario_responsavel_id = Column(UUID(as_uuid=False), ForeignKey("usuarios.id"), nullable=True)
    gravidade       = Column(Enum(GravidadeClinica), nullable=True)
    ventilacao      = Column(Boolean, default=False, nullable=False)
    droga_vasoativa = Column(Boolean, default=False, nullable=False)
    isolamento      = Column(String(100), nullable=True)
    resumo_ia_diario = Column(Text, nullable=True)

    internacao          = relationship("Internacao", back_populates="dias_assistenciais")
    evolucao_versoes    = relationship("EvolucaoClinica", back_populates="dia_assistencial")
    evolucao_historico  = relationship("EvolucaoHistorico", back_populates="dia_assistencial")
    checklist           = relationship("ChecklistClinico", uselist=False, back_populates="dia_assistencial")
    pendencias          = relationship("Pendencia", back_populates="dia_assistencial")
    passagem_plantao    = relationship("PassagemPlantao", back_populates="dia_assistencial")
    exames              = relationship("Exame", back_populates="dia_assistencial")


# ---------------------------------------------------------------------------
# EVOLUCAO CLINICA  (com histórico imutável — AI_RULES Regra 9)
# ---------------------------------------------------------------------------

class EvolucaoClinica(Base):
    """
    Versão vigente da evolução do dia.
    Cada UPDATE copia a versão anterior para EvolucaoHistorico antes de sobrescrever.
    Nunca usar DELETE nesta tabela.
    """
    __tablename__ = "evolucoes_clinicas"

    id                      = Column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    dia_assistencial_id     = Column(UUID(as_uuid=False), ForeignKey("dias_assistenciais.id"), nullable=False)
    versao                  = Column(Integer, default=1, nullable=False)
    texto_evolucao          = Column(Text, nullable=False)
    texto_evolucao_bruto_ia = Column(Text, nullable=True)  # saída original da IA antes de edição médica
    origem                  = Column(Enum(OrigemRegistro), default=OrigemRegistro.manual, nullable=False)
    autor_id                = Column(UUID(as_uuid=False), ForeignKey("usuarios.id"), nullable=False)
    validada_pelo_medico    = Column(Boolean, default=False, nullable=False)
    criado_em               = Column(DateTime, default=datetime.utcnow, nullable=False)
    atualizado_em           = Column(DateTime, default=datetime.utcnow, nullable=False)

    dia_assistencial = relationship("DiaAssistencial", back_populates="evolucao_versoes")


class EvolucaoHistorico(Base):
    """
    Arquivo imutável de todas as versões anteriores de uma evolução.
    Nenhum registro daqui é apagado jamais.
    """
    __tablename__ = "evolucoes_historico"

    id              = Column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    evolucao_id     = Column(UUID(as_uuid=False), ForeignKey("evolucoes_clinicas.id"), nullable=False)
    dia_assistencial_id = Column(UUID(as_uuid=False), ForeignKey("dias_assistenciais.id"), nullable=False)
    versao          = Column(Integer, nullable=False)
    texto_evolucao  = Column(Text, nullable=False)
    autor_id        = Column(UUID(as_uuid=False), ForeignKey("usuarios.id"), nullable=False)
    substituido_em  = Column(DateTime, default=datetime.utcnow, nullable=False)

    dia_assistencial = relationship("DiaAssistencial", back_populates="evolucao_historico")


# ---------------------------------------------------------------------------
# CHECKLIST CLINICO
# ---------------------------------------------------------------------------

class ChecklistClinico(Base):
    __tablename__ = "checklists_clinicos"

    id                  = Column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    dia_assistencial_id = Column(UUID(as_uuid=False), ForeignKey("dias_assistenciais.id"), nullable=False)

    # Parâmetros estruturados (alinhados ao prompts/checklist.txt)
    profilaxia_tev          = Column(Boolean, nullable=True)
    profilaxia_ulcera       = Column(Boolean, nullable=True)
    profilaxia_delirium     = Column(Boolean, nullable=True)
    recebendo_dieta         = Column(Boolean, nullable=True)
    antibioticoterapia      = Column(Boolean, nullable=True)
    culturas_coletadas      = Column(Boolean, nullable=True)
    eliminacoes_fisiologicas = Column(Boolean, nullable=True)
    monitorizacao_completa  = Column(Boolean, nullable=True)
    ventilacao_mecanica     = Column(Boolean, default=False, nullable=False)
    parametros_ventilatórios_anotados = Column(Boolean, nullable=True)
    fisioterapia            = Column(Boolean, nullable=True)
    fonoaudiologia          = Column(Boolean, nullable=True)
    mobilizacao             = Column(Boolean, nullable=True)
    previsao_alta           = Column(Boolean, nullable=True)

    # Dados estruturados em JSON para flexibilidade
    droga_vasoativa         = Column(Boolean, default=False, nullable=False)
    sedacao                 = Column(Boolean, default=False, nullable=False)
    dispositivos_invasivos  = Column(JSON, nullable=True)   # [{tipo, data_insercao, local}]
    antibioticos_ativos     = Column(JSON, nullable=True)   # [{nome, dose, inicio, fim_previsto}]

    # Escore de alta para enfermaria (calculadora clínica)
    escore_alta_enfermaria  = Column(Integer, nullable=True)
    status_alta_enfermaria  = Column(String(200), nullable=True)
    indicador_visual_alta   = Column(String(20), nullable=True)  # VERDE / AMARELA / VERMELHA

    criado_em   = Column(DateTime, default=datetime.utcnow, nullable=False)
    atualizado_em = Column(DateTime, default=datetime.utcnow, nullable=False)

    dia_assistencial = relationship("DiaAssistencial", back_populates="checklist")


# ---------------------------------------------------------------------------
# PENDENCIA
# ---------------------------------------------------------------------------

class Pendencia(Base):
    __tablename__ = "pendencias"

    id                  = Column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    dia_assistencial_id = Column(UUID(as_uuid=False), ForeignKey("dias_assistenciais.id"), nullable=False)
    descricao           = Column(Text, nullable=False)
    responsavel_funcao  = Column(String(100), nullable=True)
    responsavel_id      = Column(UUID(as_uuid=False), ForeignKey("usuarios.id"), nullable=True)
    status              = Column(Enum(StatusPendencia), default=StatusPendencia.aberta, nullable=False)
    prazo_limite        = Column(DateTime, nullable=True)
    concluido_em        = Column(DateTime, nullable=True)
    criado_por          = Column(UUID(as_uuid=False), ForeignKey("usuarios.id"), nullable=False)
    criado_em           = Column(DateTime, default=datetime.utcnow, nullable=False)

    dia_assistencial = relationship("DiaAssistencial", back_populates="pendencias")


# ---------------------------------------------------------------------------
# EXAME
# ---------------------------------------------------------------------------

class Exame(Base):
    """
    Regra 15 de AI_RULES: lembrar de registrar exames, cobrar laudos, digitalizar ECG.
    """
    __tablename__ = "exames"

    id                  = Column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    dia_assistencial_id = Column(UUID(as_uuid=False), ForeignKey("dias_assistenciais.id"), nullable=False)
    tipo_exame          = Column(String(150), nullable=False)   # ex: "TC Tórax", "ECG"
    status              = Column(Enum(StatusExame), default=StatusExame.solicitado, nullable=False)
    data_solicitacao    = Column(DateTime, default=datetime.utcnow, nullable=False)
    data_realizacao     = Column(DateTime, nullable=True)
    data_laudo          = Column(DateTime, nullable=True)
    arquivo_url         = Column(Text, nullable=True)           # para ECG digitalizado
    criado_por          = Column(UUID(as_uuid=False), ForeignKey("usuarios.id"), nullable=False)

    dia_assistencial = relationship("DiaAssistencial", back_populates="exames")


# ---------------------------------------------------------------------------
# PASSAGEM DE PLANTAO  (entidade prioritária — Fase 1)
# ---------------------------------------------------------------------------

class PassagemPlantao(Base):
    __tablename__ = "passagens_plantao"

    id                      = Column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    dia_assistencial_id     = Column(UUID(as_uuid=False), ForeignKey("dias_assistenciais.id"), nullable=False)
    resumo_bruto_ia         = Column(Text, nullable=True)   # saída original da IA, antes de qualquer edição
    resumo_estruturado      = Column(Text, nullable=False)  # versão aprovada/revisada pelo médico
    revisado_por            = Column(UUID(as_uuid=False), ForeignKey("usuarios.id"), nullable=True)
    revisado_em             = Column(DateTime, nullable=True)
    audio_url               = Column(Text, nullable=True)   # TTS — Fase 2
    origem                  = Column(Enum(OrigemRegistro), default=OrigemRegistro.voz, nullable=False)
    criado_por              = Column(UUID(as_uuid=False), ForeignKey("usuarios.id"), nullable=False)
    criado_em               = Column(DateTime, default=datetime.utcnow, nullable=False)
    versao                  = Column(Integer, default=1, nullable=False)

    dia_assistencial = relationship("DiaAssistencial", back_populates="passagem_plantao")


class PassagemPlantaoHistorico(Base):
    """Versionamento imutável da PassagemPlantao — AI_RULES Regra 9."""
    __tablename__ = "passagens_plantao_historico"

    id                      = Column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    passagem_id             = Column(UUID(as_uuid=False), ForeignKey("passagens_plantao.id"), nullable=False)
    resumo_estruturado      = Column(Text, nullable=False)
    versao                  = Column(Integer, nullable=False)
    criado_por              = Column(UUID(as_uuid=False), ForeignKey("usuarios.id"), nullable=False)
    substituido_em          = Column(DateTime, default=datetime.utcnow, nullable=False)


# ---------------------------------------------------------------------------
# REGISTRO DE AUDITORIA
# ---------------------------------------------------------------------------

class RegistroAuditoria(Base):
    """
    Histórico implacável de toda operação que altera dados clínicos.
    Nunca apagar registros desta tabela.
    """
    __tablename__ = "registros_auditoria"

    id              = Column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    usuario_id      = Column(UUID(as_uuid=False), ForeignKey("usuarios.id"), nullable=False)
    tabela_alterada = Column(String(80), nullable=False)
    registro_id     = Column(String(40), nullable=False)   # UUID como string
    campo_alterado  = Column(String(80), nullable=False)
    valor_antigo    = Column(Text, nullable=True)
    valor_novo      = Column(Text, nullable=True)
    operacao        = Column(String(10), nullable=False)   # INSERT / UPDATE
    data_hora       = Column(DateTime, default=datetime.utcnow, nullable=False)
    motivo          = Column(Text, nullable=True)
    ip_origem       = Column(String(50), nullable=True)


# ---------------------------------------------------------------------------
# LOG DE ENVIO EXTERNO (gate de anonimização — SECURITY.md Seção 4.4)
# ---------------------------------------------------------------------------

class LogEnvioExterno(Base):
    """
    Registra EXATAMENTE o que saiu do hospital para o NIM após anonimização.
    Permite auditoria manual periódica para verificar se nenhum nome escapou.
    """
    __tablename__ = "logs_envio_externo"

    id              = Column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    especialista    = Column(String(80), nullable=False)   # ex: 'passagem_plantao'
    payload_enviado = Column(Text, nullable=False)
    provider        = Column(String(50), nullable=False)   # ex: 'nvidia', 'ollama'
    modelo          = Column(String(100), nullable=True)
    tokens_entrada  = Column(Integer, nullable=True)
    tokens_saida    = Column(Integer, nullable=True)
    latencia_ms     = Column(Integer, nullable=True)
    enviado_em      = Column(DateTime, default=datetime.utcnow, nullable=False)
    usuario_id      = Column(UUID(as_uuid=False), ForeignKey("usuarios.id"), nullable=False)
