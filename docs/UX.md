# MedAI — UX (User Experience)

Versão: 0.1
Autor: Equipe MedAI
Última atualização: Junho/2026

---

# Filosofia

O MedAI não é um prontuário eletrônico.

O MedAI é uma plataforma de organização da informação clínica.

O objetivo da interface não é impressionar visualmente.

O objetivo é permitir que o médico encontre rapidamente a informação necessária para tomar decisões clínicas.

A interface deve reduzir carga cognitiva.

Cada tela deve responder perguntas.

Nunca mostrar informações desnecessárias.

Nunca esconder informações críticas.

A informação correta deve chegar à pessoa correta, no momento correto.

---

# Princípios de UX

## 1. Um único banco de informação

Toda informação é registrada apenas uma vez.

Depois poderá ser reutilizada para:

- Evolução
- Round
- Passagem de plantão
- Alta
- Podcast
- Ensino
- Pesquisa
- Indicadores

---

## 2. Informação hierárquica

Cada usuário vê a mesma informação de forma diferente.

Não existem bancos diferentes.

Existe apenas uma única verdade clínica.

---

# Perfis

## Student

Pode visualizar.

Não pode alterar.

Sem informações administrativas.

Sem indicadores de desempenho.

---

## Médico

Pode:

Criar evolução

Editar sua própria evolução

Atualizar checklist

Registrar round

Registrar pendências

Consultar histórico

---

## Rotina

Pode:

Editar qualquer evolução

Gerenciar condutas

Gerenciar checklist

Definir critérios de alta

Visualizar pendências

Visualizar indicadores clínicos

---

## Chefia

Pode visualizar tudo.

Pode editar tudo.

Pode acessar indicadores assistenciais.

Pode acessar indicadores de qualidade.

Pode acessar auditoria.

Pode acessar métricas institucionais.

---

# Fluxo Principal

Login

↓

Painel Geral

↓

Escolher Leito

↓

Resumo Clínico

↓

Checklist

↓

Round

↓

Pendências

↓

Exames

↓

Evolução

↓

Salvar

---

# Dashboard

Ao entrar no sistema o usuário deve enxergar:

Mapa de leitos

Pacientes críticos

Alertas

Pendências

Altas previstas

Pacientes aguardando parecer

Pacientes aguardando exames

---

# Tela do Paciente

Cada paciente possui um painel único.

Informações fixas

•

Leito

•

Iniciais

•

Diagnóstico

•

Dias de internação

•

Especialidade

•

Responsável

---

Informações dinâmicas

Checklist

Round

Exames

Pendências

Condutas

Passagem

Evolução

Histórico

---

# Checklist

O Checklist é o coração do sistema.

Ele representa tudo que ainda precisa ser confirmado.

Caso uma informação não seja encontrada no prontuário:

A IA deverá informar:

"Não foi possível localizar esta informação na documentação disponível."

Jamais deverá afirmar:

"O médico esqueceu."

---

# Evolução

A evolução é sempre construída utilizando:

Checklist

Round

Exames

Discussão clínica

Pendências

Condutas

Histórico

A IA organiza.

O médico valida.

---

# Versionamento

Nenhuma evolução será apagada.

Toda alteração gera uma nova versão.

Exemplo

06/06/2026

Versão 1

↓

Atualização

↓

Versão 2

↓

Correção

↓

Versão 3

Todas permanecem armazenadas.

---

# Round

O áudio é gravado.

↓

Whisper

↓

Transcrição

↓

Resumo

↓

Condutas

↓

Checklist atualizado

↓

Evolução atualizada

---

# Passagem de Plantão

Gerada automaticamente.

Objetivo:

Áudio entre 50 e 80 palavras.

Tempo máximo:

2 minutos.

---

# Princípios da IA

Nunca inventar informações.

Nunca completar lacunas utilizando imaginação.

Sempre informar quando um dado não foi encontrado.

Destacar inconsistências.

Sugerir melhorias.

Nunca substituir a decisão médica.

---

# Informação antes da documentação

O foco do MedAI é preservar informação clínica.

A evolução é consequência.

Não objetivo.

---

# Filosofia do Projeto

O objetivo do MedAI é garantir que nenhuma informação clinicamente relevante seja perdida.

Eliminar redundâncias.

Organizar conhecimento.

Transformar dados em decisões clínicas.
