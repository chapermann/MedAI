# MedAI — Backend Specification

Versão: 1.0

Status: Arquitetura Oficial

Responsável: Arquitetura MedAI

---

# Objetivo

O Backend do MedAI representa o núcleo operacional do sistema.

Sua responsabilidade é:

- garantir integridade dos dados;
- controlar regras de negócio;
- gerenciar autenticação e autorização;
- coordenar os módulos de Inteligência Artificial;
- preservar a rastreabilidade completa da informação clínica.

O Backend nunca toma decisões médicas.

O Backend organiza informações.

A decisão clínica pertence exclusivamente ao profissional assistente.

---

# Filosofia

O Backend foi desenvolvido segundo cinco princípios fundamentais.

## 1. O Banco de Dados é a Fonte Única da Verdade

Nenhum componente poderá manter versões independentes de dados clínicos.

Toda informação deverá ser persistida no PostgreSQL.

---

## 2. IA nunca modifica diretamente o banco

Fluxo obrigatório:

Usuário

↓

Solicita ação

↓

IA gera sugestão

↓

Usuário aprova

↓

Backend valida

↓

Banco recebe alteração

Nunca haverá escrita automática realizada pela IA.

---

## 3. Toda operação é auditável

Toda ação gera log.

Quem

Quando

Onde

O quê

Resultado

---

## 4. Versionamento obrigatório

Nenhum documento clínico poderá ser sobrescrito.

Toda alteração gera uma nova versão.

---

## 5. Segurança antes da velocidade

Sempre que houver conflito entre desempenho e segurança, prevalece a segurança.

---

# Stack Tecnológica

Python 3.12

FastAPI

Uvicorn

PostgreSQL 15+

SQLAlchemy 2

Alembic

Redis

Celery

Whisper.cpp

Ollama

NVIDIA NIM (futuro)

Qdrant

Docker

Docker Compose

---

# Arquitetura

```
Frontend

↓

FastAPI

↓

Camada de Serviços

↓

Camada de Regras Clínicas

↓

Camada IA

↓

Camada Banco

↓

PostgreSQL
```

Nenhum módulo acessa diretamente o banco.

Toda operação passa pela camada de serviços.

---

# Organização do Projeto

backend/

```
app/

api/

routers/

services/

models/

schemas/

repositories/

middlewares/

security/

ai/

tts/

whisper/

tasks/

database/

utils/

config/
```

---

# Fluxo Geral

Login

↓

JWT

↓

Permissões

↓

Serviço

↓

Validação

↓

Banco

↓

Resposta

---

# Camadas

## API Layer

Recebe requisições HTTP.

Nunca possui regra clínica.

Responsável apenas por:

- autenticação
- serialização
- respostas
- códigos HTTP

---

## Service Layer

Representa o coração do sistema.

Toda regra clínica fica aqui.

Exemplos

Gerar Evolução

Atualizar Checklist

Criar Pendência

Enviar Mensagem

Gerar Round

Gerar Passagem

Resumo Semanal

Resumo da Internação

---

## Repository Layer

Responsável exclusivamente pelo acesso ao banco.

Nenhuma regra clínica.

Nenhuma IA.

Apenas SQLAlchemy.

---

## AI Layer

Nunca escreve diretamente no banco.

Funções:

Organizar texto

Resumir

Estruturar

Encontrar inconsistências

Identificar informações ausentes

Gerar checklist

Gerar briefing

Gerar passagem

Gerar resumo semanal

Responder perguntas clínicas baseadas apenas nos dados existentes.

---

# Pipeline de IA

Texto

↓

Sanitização

↓

Prompt

↓

Modelo

↓

Resposta

↓

Validação

↓

Usuário

↓

Banco

---

# Sanitização

Sempre ocorre antes da IA.

Remove automaticamente:

CPF

RG

Telefone

Endereço

Emails

Documentos

Nome da mãe

Nome do pai

Dados administrativos

O Backend nunca envia essas informações aos modelos.

---

# Whisper

Responsável por:

Transcrição

↓

Texto bruto

↓

Sanitização

↓

Organização

↓

Usuário

↓

Banco

O áudio original poderá ser descartado conforme política institucional.

---

# TTS

Entrada

Resumo da Passagem

↓

IA

↓

Texto Final

↓

TTS

↓

Áudio

↓

WhatsApp (futuro)

---

# Banco Vetorial

Documentos

↓

Chunk

↓

Embedding

↓

Indexação

↓

Busca Semântica

Nunca armazenar documentos administrativos.

---

# Scheduler

Executa tarefas automáticas.

Exemplos

Resumo semanal

Resumo diário

Auditoria

Backup

Indexação Vetorial

Limpeza de cache

---

# Cache

Redis

Utilizado apenas para:

Sessões

Permissões

Consultas frequentes

Jamais armazenar documentos clínicos completos.

---

# Logs

Registrar

Login

Logout

Consultas

Criação

Alteração

Exportação

Uso da IA

Uso do Whisper

Uso do TTS

Erros

Tempo de resposta

---

# Segurança

JWT

RBAC

TLS

Rate Limiting

Row Level Security

Sanitização

Auditoria

Versionamento

Criptografia

---

# Escala Assistencial

Ao iniciar o plantão

Usuário

↓

Seleciona

Setor

Turno

Equipe

Leitos

↓

Backend cria

Escala Assistencial

↓

Dashboard personalizado

Essa escala vale apenas para aquele plantão.

---

# Comunicação

A Rotina envia mensagens.

↓

Backend registra.

↓

Equipe recebe.

↓

Confirma execução.

↓

Auditoria registra toda a conversa.

Nenhuma mensagem é apagada.

---

# Linha Temporal

Todo evento relevante gera automaticamente um TimelineEvent.

Exemplos

Internação

PCR

Traqueostomia

Cirurgia

Meropenem iniciado

Meropenem encerrado

Alta

Óbito

Esses eventos alimentam automaticamente:

Resumo Semanal

Resumo Mensal

Resumo da Internação

Flipbook Clínico

---

# Integrações Futuras

FHIR

HL7

OpenEHR

LIS

RIS

PACS

CNES

TISS

WhatsApp Business

---

# Performance

Login

< 500 ms

Dashboard

< 1 segundo

Pesquisa

< 300 ms

Atualização de evolução

< 2 segundos

Resumo IA

< 10 segundos

Transcrição Whisper

Dependente do tamanho do áudio.

---

# Filosofia Final

O Backend do MedAI não é um simples servidor de API.

Ele representa o motor clínico do sistema.

Sua missão é garantir que toda informação seja íntegra, rastreável, cronológica, segura e útil para a assistência ao paciente.

Nenhuma decisão médica será automatizada.

Toda Inteligência Artificial atua apenas como ferramenta de organização, recuperação, estruturação e apoio à informação clínica.

O Backend deverá sempre preservar a autoria humana, a responsabilidade profissional e a confidencialidade dos dados assistenciais.
