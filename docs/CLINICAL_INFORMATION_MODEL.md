# MedAI
# Clinical Information Model

Versão 0.1

---

# Filosofia

O foco do MedAI não é o paciente.

Também não é a evolução médica.

O foco do MedAI é preservar, organizar e transformar informação clínica.

Toda informação inserida no sistema deve possuir finalidade assistencial.

Nenhuma informação relevante deve ser perdida.

Nenhuma informação deve ser registrada duas vezes.

Toda informação deve poder ser reutilizada.

---

# Conceito Fundamental

A menor unidade do MedAI não é o paciente.

É o Dia Assistencial.

Todo dia assistencial representa um ciclo completo de cuidado.

Paciente

↓

Internação

↓

Dia Assistencial

↓

Informações

↓

Produtos Clínicos

---

# Estrutura

Cada Dia Assistencial possui:

## Identificação

Data

Horário

Equipe

Responsável

Leito

Especialidade

---

## Informações Assistenciais

Sinais Vitais

Balanço Hídrico

Diurese

Evacuação

Dor

Nutrição

Ventilação

Sedação

Dispositivos

Curativos

Lesões

Culturas

Antibioticoterapia

Exames laboratoriais

Exames de imagem

Pareceres

Interconsultas

Eventos

---

## Discussão Clínica

Resumo do Round

Hipóteses Diagnósticas

Problemas Ativos

Problemas Resolvidos

Pendências

Plano Terapêutico

Critérios para Alta

Critérios de Gravidade

---

## Produtos Gerados

Checklist

Evolução

Passagem de Plantão

Resumo Clínico

Indicadores

Podcast

Discussão Científica

---

# Origem das Informações

Toda informação possui origem.

Exemplo

Enfermagem

Médico

Fisioterapia

Nutrição

Laboratório

Radiologia

Família

Paciente

IA

Sistema

Nunca existirão informações sem origem identificada.

---

# Classificação das Informações

Toda informação recebe uma classificação.

## Crítica

Pode alterar imediatamente uma decisão clínica.

Exemplo

Hipotensão

Hipercalemia

Nova hemorragia

Parada Cardiorrespiratória

---

## Importante

Impacta o tratamento.

Exemplo

Resultado de cultura

Parecer

Novo exame

Mudança da antibioticoterapia

---

## Complementar

Agrega contexto.

Exemplo

Histórico remoto

Antecedentes

Aspectos sociais

---

# Temporalidade

Toda informação possui:

Data

Hora

Autor

Origem

Versão

Nunca poderá ser sobrescrita.

Sempre será preservada.

---

# Estado das Informações

Cada informação pode estar:

Nova

Confirmada

Atualizada

Corrigida

Encerrada

Arquivada

---

# Pendências

Toda pendência possui:

Descrição

Responsável

Prioridade

Prazo

Situação

Motivo

Data de resolução

---

# Informação Não Encontrada

Caso a IA não consiga localizar um dado obrigatório deverá responder:

"Não foi possível localizar esta informação na documentação disponível."

Jamais deverá assumir ausência de registro.

Jamais deverá inferir culpa.

---

# Princípio da Informação Única

Uma informação é registrada apenas uma vez.

Depois poderá ser utilizada por diversos módulos.

Exemplo

Pressão Arterial

↓

Checklist

↓

Evolução

↓

Round

↓

Indicadores

↓

Pesquisa

↓

Dashboard

Sem duplicação.

---

# Produtos Clínicos

A partir da mesma base de dados o sistema poderá gerar:

Evolução Clínica

Passagem de Plantão

Resumo Diário

Relatório para Chefia

Indicadores

Discussão Científica

Ensino

Podcast

Artigos

Pesquisas

Todos derivados da mesma informação.

---

# Inteligência Clínica

A IA não substitui o médico.

Seu papel é:

Organizar

Resumir

Comparar

Detectar inconsistências

Apontar pendências

Sugerir melhorias

Calcular indicadores

Jamais decidir.

---
# Informação Temporal

A informação clínica possui dimensão temporal. Um dado isolado raramente possui significado completo. Seu valor aumenta quando analisado em sequência cronológica. O MedAI deverá preservar toda a linha temporal do paciente, permitindo reconstruir sua trajetória clínica desde a admissão até a alta. A evolução médica não é uma coleção de documentos independentes, mas uma narrativa contínua do processo de cuidado. O sistema deverá destacar tendências, velocidades de mudança, eventos marcantes e pontos de inflexão, transformando registros estáticos em uma representação dinâmica da história clínica do paciente.
---

# Objetivo Final

Transformar informação clínica dispersa em conhecimento estruturado.

Garantir continuidade do cuidado.

Reduzir perda de informação.

Melhorar a comunicação entre equipes.

Apoiar decisões clínicas.

Acelerar altas.

Reduzir tempo de permanência.

Fortalecer ensino, pesquisa e gestão hospitalar.
