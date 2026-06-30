# MedAI - System Architecture

Versão: 0.1

---

# Filosofia

O MedAI foi projetado para ser uma plataforma de gestão da informação clínica.

Não é um prontuário eletrônico.

Não é apenas um gerador de textos.

Seu objetivo é organizar, preservar, transformar e distribuir informação clínica para diferentes níveis assistenciais.

---

# Arquitetura Geral

                Usuários
                    │
        ┌───────────┴───────────┐
        │                       │
    Interface Web          Aplicativo Desktop
        │                       │
        └───────────┬───────────┘
                    │
              Backend API
                    │
    ┌───────────────┼────────────────┐
    │               │                │
 Banco SQL      IA Local         Storage
(PostgreSQL)   (Ollama)      Arquivos / Áudios
                    │
          Whisper + TTS
                    │
              Banco Vetorial
          (Qdrant / ChromaDB)

---

# Componentes

Frontend

- Dashboard
- Leitos
- Pacientes
- Checklist
- Evolução
- Round
- Passagem de Plantão
- Administração
- Pesquisa

Backend

Responsável por:

- autenticação
- regras de negócio
- auditoria
- APIs
- comunicação com IA

Banco SQL

Armazena:

- pacientes
- internações
- usuários
- evoluções
- checklists
- rounds
- exames
- pendências

Banco Vetorial

Armazena:

- PDFs
- artigos
- protocolos
- guidelines
- casos antigos

IA

Modelos locais utilizando Ollama.

Substituíveis futuramente.

Whisper

Transcrição de áudio.

TTS

Geração automática de áudios para passagem de plantão.

---

# Fluxo

Entrada

↓

Áudio

↓

Whisper

↓

Texto

↓

Prompt

↓

Ollama

↓

Resposta estruturada

↓

Validação médica

↓

Banco SQL

↓

Indicadores

↓

Pesquisa

↓

Ensino
