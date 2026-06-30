from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Paciente(Base):
    __tablename__ = 'pacientes'

    id = Column(Integer, primary_key=True, index=True)
    nome_completo = Column(String(255), nullable=False) # Guardado de forma segura
    iniciais = Column(String(10), nullable=False)       # Exibido na interface de UX para privacidade
    prontuario = Column(String(50), unique=True, nullable=False, index=True)
    sexo = Column(String(20), nullable=False)
    data_nascimento = Column(DateTime, nullable=False)
    especialidade = Column(String(100))

    internacoes = relationship("Internacao", back_populates="paciente")


class Internacao(Base):
    __tablename__ = 'internacoes'

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey('pacientes.id'), nullable=False)
    data_admissao = Column(DateTime, default=datetime.utcnow, nullable=False)
    leito_atual = Column(String(20), nullable=False)
    diagnostico_principal = Column(Text, nullable=False)
    procedencia = Column(String(100))
    data_alta = Column(DateTime, nullable=True)
    is_obito = Column(Boolean, default=False)

    paciente = relationship("Paciente", back_populates="internacoes")
    dias_assistenciais = relationship("DiaAssistencial", back_populates="internacao")


class DiaAssistencial(Base):
    """
    A menor unidade do MedAI. Representa o ciclo completo diário da informação.
    Conceito de Flipbook: cada registro é um snapshot do estado temporal do paciente.
    """
    __tablename__ = 'dias_assistenciais'

    id = Column(Integer, primary_key=True, index=True)
    internacao_id = Column(Integer, ForeignKey('internacoes.id'), nullable=False)
    data_referencia = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    usuario_responsavel_id = Column(Integer, nullable=False) # ID do médico do dia
    resumo_ia_diario = Column(Text, nullable=True) # Resumo consolidado do dia assistencial

    internacao = relationship("Internacao", back_populates="dias_assistenciais")
    evolucao_versoes = relationship("EvolucaoClinica", back_populates="dia_assistencial")
    checklist = relationship("ChecklistClinico", uselist=False, back_populates="dia_assistencial")
    pendencias = relationship("Pendencia", back_populates="dia_assistencial")


class EvolucaoClinica(Base):
    """
    Armazena o texto da evolução de forma estritamente versionada. Nenhuma linha é apagada.
    """
    __tablename__ = 'evolucoes_clinicas'

    id = Column(Integer, primary_key=True, index=True)
    dia_assistencial_id = Column(Integer, ForeignKey('dias_assistenciais.id'), nullable=False)
    versao = Column(Integer, default=1, nullable=False)
    texto_evolucao = Column(Text, nullable=False)
    autor_id = Column(Integer, nullable=False)
    data_criacao = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_validada_pelo_medico = Column(Boolean, default=False, nullable=False)

    dia_assistencial = relationship("DiaAssistencial", back_populates="evolucao_versoes")


class ChecklistClinico(Base):
    """
    Armazena os estados dos dispositivos e metas mapeados no Dia Assistencial.
    """
    __tablename__ = 'checklists_clinicos'

    id = Column(Integer, primary_key=True, index=True)
    dia_assistencial_id = Column(Integer, ForeignKey('dias_assistenciais.id'), nullable=False)
    
    # Parâmetros Clínicos Estruturados
    ventilacao_mecanica = Column(Boolean, default=False)
    droga_vasoativa = Column(Boolean, default=False)
    sedacao = Column(Boolean, default=False)
    diurese_presente = Column(Boolean, default=True)
    evacuacao_presente = Column(Boolean, default=True)
    dispositivos_invasivos = Column(JSON, nullable=True) # Lista de cateteres, sondas, etc.
    antibioticos_ativos = Column(JSON, nullable=True)     # Dicionário contendo {nome, dia_do_ciclo}

    dia_assistencial = relationship("DiaAssistencial", back_populates="checklist")


class Pendencia(Base):
    """
    As tarefas e ordens geradas a partir do Round ou da discussão da Rotina.
    """
    __tablename__ = 'pendencias'

    id = Column(Integer, primary_key=True, index=True)
    dia_assistencial_id = Column(Integer, ForeignKey('dias_assistenciais.id'), nullable=False)
    descricao = Column(Text, nullable=False)
    responsavel_funcao = Column(String(50)) # ex: 'Plantonista', 'Enfermagem'
    prazo_limite = Column(DateTime, nullable=True)
    is_resolvida = Column(Boolean, default=False, nullable=False)

    dia_assistencial = relationship("DiaAssistencial", back_populates="pendencias")


class RegistroAuditoria(Base):
    """
    Guarda o histórico implacável determinado pela governança do MedAI.
    """
    __tablename__ = 'registros_auditoria'

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, nullable=False)
    tabela_alterada = Column(String(50), nullable=False)
    registro_id = Column(Integer, nullable=False)
    campo_alterado = Column(String(50), nullable=False)
    valor_antigo = Column(Text, nullable=True)
    valor_novo = Column(Text, nullable=True)
    data_hora = Column(DateTime, default=datetime.utcnow, nullable=False)
    motivo_alteracao = Column(Text, nullable=True)
