# MedAI — Frontend Specification

Versão: 1.0

Status: Arquitetura Oficial

Responsável: Arquitetura MedAI

---

# Objetivo

O Frontend do MedAI não é um prontuário eletrônico.

Também não é um editor de texto.

O Frontend é uma interface inteligente para organizar, visualizar e acompanhar a evolução clínica dos pacientes.

Toda informação deverá estar disponível com o menor número possível de cliques.

A interface deve reduzir carga cognitiva, facilitar decisões clínicas e diminuir o tempo gasto procurando informações.

---

# Filosofia

O usuário nunca deverá perguntar:

"Em qual tela está essa informação?"

O sistema deverá responder esta pergunta naturalmente.

Toda informação deverá possuir:

- contexto
- cronologia
- rastreabilidade
- origem
- última atualização

---

# Princípios de UX

O Frontend foi construído segundo seis princípios.

## 1. Informação antes da estética

A prioridade é a informação clínica.

Elementos decorativos nunca deverão competir com dados importantes.

---

## 2. Um clique a menos

Sempre que duas telas puderem ser fundidas sem perda de organização, elas deverão ser fundidas.

---

## 3. Uma informação, um local

Nunca existirão dois locais mostrando versões diferentes do mesmo dado.

Existe apenas uma fonte de verdade.

---

## 4. Navegação previsível

Todo usuário deverá saber onde encontrar qualquer informação.

Menus nunca deverão mudar de posição.

---

## 5. Baixa carga cognitiva

O médico deve gastar energia pensando no paciente.

Nunca tentando descobrir como o sistema funciona.

---

## 6. Organização Clínica

O Frontend representa o raciocínio médico.

Não representa tabelas do banco de dados.

---

# Tecnologias

Frontend Web

React

TypeScript

Vite

Material UI

React Router

TanStack Query

React Hook Form

Zod

---

# Organização do Projeto

frontend/

```
src/

components/

pages/

layouts/

hooks/

services/

contexts/

stores/

assets/

styles/

utils/

types/
```

---

# Fluxo Principal

```
Login

↓

Selecionar Plantão

↓

Dashboard

↓

Paciente

↓

Evolução

↓

Checklist

↓

Round

↓

Passagem de Plantão
```

---

# Primeira Tela

Login.

Campos:

CRM

Senha

Entrar

Esqueci minha senha

Modo Offline (futuro)

---

# Segunda Tela

Escala Assistencial.

O usuário informa apenas uma vez por plantão.

Campos

Data

Turno

Setor Assistencial

Função

Leitos sob responsabilidade

Equipe

Botão

Entrar no Plantão

Após confirmação:

O Dashboard é criado automaticamente.

---

# Dashboard

O Dashboard representa o centro operacional do plantão.

Ele deverá responder imediatamente:

Quem sou?

Onde estou?

Quais pacientes são meus?

Quais pendências existem?

Quais mensagens recebi?

Quais pacientes exigem atenção?

---

# Layout Geral

```
┌──────────────────────────────────────────────┐
│ Barra Superior                               │
├──────────────────────────────────────────────┤
│ Menu │ Dashboard Principal                   │
│      │                                      │
│      │ Lista de Pacientes                   │
│      │                                      │
│      │ Alertas                              │
│      │                                      │
│      │ Pendências                           │
│      │                                      │
│      │ Mensagens                            │
└──────────────────────────────────────────────┘
```

---

# Menu Lateral

Dashboard

Pacientes

Round

Passagem de Plantão

Checklist

Mensagens

Discussão da Semana

Biblioteca

Relatórios

Configurações

---

# Cartão do Paciente

Cada paciente deverá ser apresentado como um Card.

Exemplo

```
Leito 03

Paciente JAS

68 anos

Choque Séptico

VM

Noradrenalina

Meropenem D5

Pendências: 3

Checklist: 92%

Última atualização

08:35
```

Jamais mostrar:

CPF

Telefone

Endereço

Documentos

---

# Página do Paciente

Abas

Resumo Clínico

Linha do Tempo

Evoluções

Checklist

Round

Passagem

Exames

Culturas

Antibióticos

Pendências

Mensagens

Histórico

---

# Linha do Tempo

Representação cronológica.

Exemplo

```
08/06

Internação

↓

09/06

Intubação

↓

11/06

Choque Séptico

↓

13/06

Meropenem

↓

17/06

Traqueostomia

↓

22/06

Alta VM

↓

29/06

Alta CTI
```

A Linha Temporal é uma das principais formas de navegação.

---

# Evolução Médica

A evolução nunca será escrita diretamente.

O médico fornecerá informações.

A IA organizará essas informações.

O médico aprovará o texto final.

A IA nunca assina a evolução.

---

# Checklist

O Checklist será apresentado por domínios.

Respiratório

Hemodinâmico

Neurológico

Renal

Infeccioso

Nutricional

Metabólico

Pele

Dispositivos

Pendências

Itens não encontrados serão apresentados como:

"Não encontrei esta informação."

Nunca assumir dados ausentes.

---

# Round Médico

O Round poderá ser registrado de duas formas.

Modo Texto

Modo Áudio (futuro)

Após registro:

IA organiza

↓

Resumo

↓

Discussão

↓

Plano

↓

Condutas

---

# Passagem de Plantão

Objetivo

Produzir resumo entre 50 e 80 palavras.

Tempo estimado de leitura

2 minutos.

Também poderá gerar:

Áudio TTS

PDF

Texto

---

# Comunicação

A Rotina poderá enviar tarefas.

Exemplo

```
Solicitar nova TC

↓

Equipe Segunda

↓

Status

Pendente

↓

Concluído
```

Todo histórico permanece registrado.

---

# Notificações

Categorias

Informação

Pendência

Alerta

Urgente

Crítico

Notificações nunca deverão interromper a digitação.

---

# Pesquisa Global

Pesquisar

Paciente

Diagnóstico

Antibiótico

Exame

Parecer

Leito

Médico

Data

Evento

Utilizar busca semântica.

---

# Responsividade

Desktop

Prioridade máxima.

Notebook

Suporte completo.

Tablet

Suporte completo.

Celular

Consulta apenas.

Edição limitada.

---

# Tema

Modo Claro

Modo Escuro

Fonte ajustável

Modo Alto Contraste

---

# Performance

Primeira renderização

< 2 segundos

Mudança entre pacientes

< 300 ms

Pesquisa

< 500 ms

Dashboard

Atualização em tempo real.

---

# Segurança Visual

Jamais exibir

CPF

Telefone

Endereço

Documentos

Nome completo durante Round

Sempre utilizar

Iniciais

Leito

Idade

Sexo

---

# Filosofia Final

O Frontend do MedAI não foi desenvolvido para impressionar.

Foi desenvolvido para permitir que médicos encontrem rapidamente a informação correta, reduzam erros, melhorem a comunicação entre equipes e concentrem seu tempo na assistência ao paciente.

Toda decisão de interface deverá obedecer a este princípio.
