# MedAI

## Sistema Inteligente para Gestão Clínica, Apoio à Decisão Médica, Ensino e Pesquisa

**Versão:** 0.1

**Status:** Em desenvolvimento

---

# Missão

Desenvolver uma plataforma integrada capaz de auxiliar médicos, residentes e professores durante toda a rotina hospitalar, utilizando Inteligência Artificial Local, preservando a confidencialidade dos pacientes e reduzindo o tempo gasto com tarefas administrativas.

O MedAI não substitui a decisão médica.

O MedAI organiza informações, identifica riscos, auxilia na documentação clínica e fornece apoio científico para tomada de decisão.

---

# Objetivos

O sistema deverá:

* organizar informações clínicas;
* produzir documentos médicos padronizados;
* armazenar conhecimento clínico;
* apoiar ensino;
* apoiar pesquisa científica;
* preservar histórico dos pacientes;
* funcionar localmente;
* permitir funcionamento offline;
* possuir backup automático.

---

# Filosofia do Sistema

O paciente é o centro do sistema.

Toda informação gerada será vinculada ao paciente.

Os módulos de Inteligência Artificial apenas processam essas informações.

---

# Arquitetura Geral

Frontend

↓

Backend

↓

Banco de Dados Clínico

↓

Banco Vetorial

↓

Modelos de IA

↓

Whisper

↓

TTS

↓

Biblioteca Científica

---

# Tecnologias previstas

Frontend

React

Progressive Web App (PWA)

Backend

Python

FastAPI

Banco relacional

PostgreSQL

Banco vetorial

ChromaDB

Modelos locais

Ollama

Reconhecimento de voz

Whisper.cpp

Síntese de voz

TTS Local

Servidor

Ubuntu

Docker

Tailscale

---

# Princípios

Todo processamento clínico deverá ocorrer localmente.

Nenhuma informação de paciente será enviada para serviços externos sem autorização explícita.

Todos os módulos deverão ser independentes.

Todo texto produzido pela IA deverá ser revisado por um médico antes de ser considerado definitivo.

Todo conteúdo deverá possuir histórico de versões.

Nenhuma informação será apagada.

---

# Estrutura Geral

Dashboard

Pacientes

CTI

Sala Vermelha

Emergência

Round

Evoluções

Passagem de Plantão

Biblioteca

Discussão da Semana

Pesquisa

Configurações

Administrador

---

# Conceito Principal

Cada paciente possuirá um "Estado Clínico".

Esse Estado Clínico será atualizado continuamente conforme novos dados forem inseridos.

Toda IA utilizará o Estado Clínico como contexto.

Nunca apenas o último áudio.

---

# Identificação do Paciente

Nome

Prontuário

Leito

Setor

Idade

Sexo

Diagnóstico principal

Diagnósticos secundários

Data da internação

Equipe responsável

Situação atual

---

# Privacidade

Na interface clínica:

Nome → apenas iniciais.

Exemplo

J.S.

M.A.C.

A.B.

Número do prontuário permanece disponível.

Nenhum documento civil será exibido.

---

# Primeiro Módulo

Painel Geral de Leitos

Cada setor possuirá um painel próprio.

CTI

Sala Vermelha

Emergência

Cada leito apresentará:

Número

Iniciais do paciente

Idade

Diagnóstico principal

Gravidade

Ventilação

Droga vasoativa

Isolamento

Responsável

Pendências

---

# Segundo Módulo

Página Individual do Paciente

Histórico

Diagnósticos

Problemas ativos

Ventilação

Hemodinâmica

Culturas

Antibióticos

Exames

Imagens

Procedimentos

Prescrições

Evoluções

Rounds

Áudios

Arquivos

Timeline

---

# Inteligência Artificial

A IA será dividida em Especialistas.

Cada Especialista possuirá um Prompt próprio.

Os Prompts ficarão separados do código.

Todos editáveis.

---

# Especialistas previstos

Especialista em Evolução Clínica

Especialista em Round

Especialista em Passagem de Plantão

Especialista em Resumo Clínico

Especialista em Alta

Especialista em Parecer

Especialista em Auditoria Clínica

Especialista em Ensino

Especialista em Pesquisa

Especialista em Biblioteca

Especialista em Podcast

---

# Organização do Projeto

Este documento deverá ser atualizado antes de qualquer grande modificação estrutural.

Ele representa a arquitetura oficial do MedAI.
