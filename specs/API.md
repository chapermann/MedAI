# MedAI — API Specification

Versão: 1.0

Status: Arquitetura Oficial

Responsável: Arquitetura MedAI

---

# Objetivo

A API do MedAI é a única porta de entrada para todas as operações do sistema.

Nenhum componente poderá acessar diretamente o banco de dados.

Todo acesso deverá ocorrer através da API.

Isso garante:

- Integridade
- Segurança
- Auditoria
- Versionamento
- Rastreabilidade
- Controle de permissões

---

# Filosofia

A API do MedAI foi construída sobre cinco princípios.

## 1. API-First

Toda funcionalidade do sistema deverá existir primeiro na API.

O Frontend é apenas um consumidor da API.

No futuro:

- Aplicativo Android
- Aplicativo iOS
- Dashboard Web
- Integração Hospitalar
- Ferramentas de Pesquisa

todos utilizarão exatamente a mesma API.

---

## 2. Stateless

Toda requisição deve conter todas as informações necessárias.

A API nunca dependerá de estado armazenado entre requisições.

---

## 3. RESTful

Sempre que possível seguir convenções REST.

GET

POST

PUT

PATCH

DELETE

---

## 4. Segurança

Toda requisição exige autenticação.

Toda resposta é auditável.

Todo acesso é registrado.

---

## 5. IA nunca grava diretamente

Nenhum endpoint permitirá que modelos de IA alterem documentos clínicos.

Toda sugestão deverá ser aprovada por um profissional.

---

# Base URL

/api/v1

Toda alteração incompatível criará:

/api/v2

---

# Formato

JSON UTF-8

---

# Autenticação

JWT

Access Token

Refresh Token

Bearer Authentication

Authorization:

Bearer <token>

---

# Estrutura padrão das respostas

Sucesso

{
    "success": true,
    "data": {},
    "message": "",
    "timestamp": ""
}

Erro

{
    "success": false,
    "error": "",
    "details": "",
    "timestamp": ""
}

---

# Organização

/api/v1

/auth

/users

/shifts

/dashboard

/patients

/evolutions

/checklists

/rounds

/handover

/timeline

/exams

/cultures

/antibiotics

/consults

/tasks

/messages

/reports

/audio

/ai

/library

/admin

---

# AUTH

POST

/auth/login

Login.

POST

/auth/logout

Logout.

POST

/auth/refresh

Renova JWT.

GET

/auth/me

Retorna usuário autenticado.

---

# USERS

GET

/users

Lista usuários.

GET

/users/{id}

Informações do usuário.

POST

/users

Criar usuário.

PATCH

/users/{id}

Atualizar.

DELETE

/users/{id}

Desativar.

Nunca excluir permanentemente.

---

# SHIFTS

Escala Assistencial.

GET

/shifts/today

Minha escala.

POST

/shifts

Iniciar plantão.

PATCH

/shifts/{id}

Atualizar escala.

GET

/shifts/current

Plantão atual.

---

# DASHBOARD

GET

/dashboard

Painel principal.

Retorna:

Setor

Equipe

Pacientes

Pendências

Alertas

Mensagens

Checklist

Indicadores

---

# PATIENTS

GET

/patients

Lista.

GET

/patients/{id}

Resumo clínico.

POST

/patients

Novo paciente.

PATCH

/patients/{id}

Atualização administrativa.

DELETE

Nunca permitido.

Paciente apenas recebe alta.

---

# CLINICAL STATE

GET

/patients/{id}/state

Retorna o Estado Clínico Atual.

Este endpoint é o coração do MedAI.

Todas as telas derivam dele.

Retorna:

Resumo

Timeline

Checklist

Pendências

Exames

Culturas

Antibióticos

Dispositivos

Mensagens

Round

Passagem

---

# EVOLUTIONS

GET

/evolutions

Lista.

POST

/evolutions

Nova evolução.

PATCH

/evolutions/{id}

Nova versão.

Nunca sobrescrever.

GET

/evolutions/{id}/history

Histórico completo.

---

# CHECKLIST

GET

/checklists/{patient}

POST

/checklists

PATCH

/checklists/{id}

GET

/checklists/{id}/missing

Itens não encontrados.

---

# ROUND

POST

/rounds

Registrar discussão.

Aceita:

Texto

Áudio (futuro)

Observações

Participantes

Decisões

GET

/rounds/{id}

Resumo organizado.

---

# PASSAGEM DE PLANTÃO

POST

/handover

Gerar passagem.

GET

/handover/{id}

Visualizar.

POST

/handover/{id}/audio

Gerar TTS.

GET

/handover/today

Passagem do dia.

---

# TIMELINE

GET

/timeline/{patient}

Eventos cronológicos.

POST

/timeline

Adicionar evento.

Eventos automáticos também são registrados.

---

# EXAMES

GET

/exams/{patient}

POST

/exams

PATCH

/exams/{id}

---

# CULTURAS

GET

/cultures/{patient}

POST

/cultures

PATCH

/cultures/{id}

---

# ANTIBIÓTICOS

GET

/antibiotics/{patient}

POST

/antibiotics

PATCH

/antibiotics/{id}

Ao término do tratamento:

Evento automático:

"Ciclo encerrado"

---

# PENDÊNCIAS

GET

/tasks

POST

/tasks

PATCH

/tasks/{id}

DELETE

Nunca apagar.

Apenas:

Aberta

Em andamento

Concluída

Cancelada

---

# MENSAGENS

GET

/messages

POST

/messages

PATCH

/messages/{id}

Fluxo:

Rotina

↓

Equipe

↓

Confirmação

↓

Execução

↓

Auditoria

---

# IA

A IA nunca modifica diretamente documentos.

POST

/ai/organize

Organizar texto.

POST

/ai/summarize

Gerar resumo.

POST

/ai/check

Encontrar informações ausentes.

POST

/ai/quality

Avaliar qualidade da evolução.

POST

/ai/briefing

Briefing para Rotina.

POST

/ai/handover

Gerar passagem de plantão.

POST

/ai/weekly

Resumo semanal.

POST

/ai/discharge

Resumo para alta.

Todas as respostas são sugestões.

---

# ÁUDIO

POST

/audio/tts

Texto

↓

Áudio

GET

/audio/{id}

Download.

A transcrição por Whisper será um endpoint opcional e secundário.

POST

/audio/transcribe

Uso opcional.

---

# RELATÓRIOS

GET

/reports/occupancy

GET

/reports/length-of-stay

GET

/reports/infections

GET

/reports/antibiotics

GET

/reports/checklists

GET

/reports/team-performance

GET

/reports/discharges

Todos dependem das permissões do usuário.

---

# ADMIN

GET

/admin/audit

GET

/admin/logs

GET

/admin/system

POST

/admin/reindex

POST

/admin/backup

---

# HTTP Status

200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Validation Error

500 Internal Error

---

# Auditoria

Toda requisição registra:

Usuário

Data

Hora

IP

Setor

Plantão

Paciente

Operação

Resultado

Tempo de execução

---

# Versionamento

Nenhuma atualização sobrescreve documentos clínicos.

Toda alteração gera:

Nova versão

Novo hash

Novo registro de auditoria

---

# Filosofia Final

A API do MedAI não foi projetada apenas para conectar Frontend e Banco de Dados.

Ela representa o contrato oficial do sistema.

Toda informação clínica trafega exclusivamente pela API.

A API garante que os princípios fundamentais do MedAI sejam respeitados:

• A IA organiza, mas não cria.
• O médico permanece o responsável pelas decisões.
• Toda informação é rastreável.
• Nenhum dado clínico é perdido.
• Nenhuma informação é alterada sem versionamento.
• O Estado Clínico do paciente é a única fonte de verdade da aplicação.
