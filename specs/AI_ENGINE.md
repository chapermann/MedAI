# MedAI — AI Engine Specification

Versão: 1.0

Status: Arquitetura Oficial

Responsável: Arquitetura MedAI

---

# Objetivo

O AI Engine é o módulo responsável por organizar, estruturar, resumir e recuperar a informação clínica existente no sistema.

O AI Engine nunca cria fatos clínicos.

Nunca toma decisões médicas.

Nunca substitui o julgamento profissional.

Sua função é exclusivamente auxiliar a equipe médica na organização da informação.

---

# O Princípio Pepper Potts

A Inteligência Artificial do MedAI deve comportar-se como uma secretária executiva de altíssimo nível.

Sua função é:

• organizar documentos

• localizar informações

• resumir discussões

• preparar reuniões

• lembrar pendências

• organizar cronologias

• estruturar textos

• preparar briefings

• produzir documentos auxiliares

Ela nunca:

• inventa informações

• cria fatos

• modifica documentos sozinha

• toma decisões

• define tratamentos

• assume autoria médica

A responsabilidade clínica permanece sempre com o profissional assistente.

---

# Filosofia

O MedAI não é um sistema de Inteligência Artificial.

O MedAI é um sistema de organização da informação clínica.

A Inteligência Artificial é apenas uma ferramenta especializada dentro dessa arquitetura.

---

# Clinical State First

Toda informação produzida pela IA deriva do Estado Clínico.

Nunca do áudio.

Nunca de um texto isolado.

Nunca de memória.

Fluxo:

Paciente

↓

Estado Clínico Atual

↓

AI Engine

↓

Produtos

---

# Produtos produzidos pela IA

A IA pode organizar:

• Evolução médica

• Round

• Passagem de plantão

• Checklist

• Briefing da rotina

• Resumo semanal

• Resumo da internação

• Critérios pendentes para alta

• Linha temporal

• Resumo para discussão

• Organização de exames

• Organização de culturas

• Organização de pareceres

Todos são derivados do Estado Clínico.

---

# O que a IA nunca faz

A IA nunca:

diagnostica

prescreve

altera documentos

define alta

define antibiótico

decide tratamentos

assina documentos

assume responsabilidade clínica

---

# Arquitetura Geral

Clinical State Engine

↓

Prompt Engine

↓

Sanitizer

↓

Provider Layer

↓

Response Validator

↓

Output Formatter

↓

Usuário

---

# Prompt Engine

Responsável por construir os prompts.

Nenhum prompt é escrito diretamente pelo Backend.

Cada tarefa possui um Prompt próprio.

Exemplos

prompt_evolution.md

prompt_round.md

prompt_handover.md

prompt_checklist.md

prompt_quality.md

prompt_briefing.md

prompt_discharge.md

prompt_weekly_summary.md

Todos ficam versionados.

---

# Sanitizer

Executado antes de qualquer chamada ao modelo.

Remove automaticamente:

CPF

RG

CNH

Passaporte

Telefone

Celular

WhatsApp

Endereço

CEP

Email

Nome da mãe

Nome do pai

Dados administrativos

Nenhum Provider recebe essas informações.

---

# AI Provider Layer

O AI Engine nunca depende de um fornecedor específico.

Ele conversa apenas com Providers.

Interface:

AIProvider

↓

NvidiaProvider

OllamaProvider

OpenAIProvider

ClaudeProvider

GeminiProvider

MockProvider

Todos implementam exatamente a mesma interface.

---

# Provider NVIDIA

Implementação inicial.

Utiliza API compatível com OpenAI.

Exemplo

OpenAI SDK

↓

https://integrate.api.nvidia.com/v1

Modelo inicial

openai/gpt-oss-120b

A troca futura de Provider não exige alterações no restante do sistema.

---

# Provider Local

Quando disponível.

Ollama

↓

Llama

↓

Qwen

↓

Mistral

↓

DeepSeek

↓

Outros

Hospitais poderão utilizar modelos completamente locais.

---

# Prompt Builder

Responsável por montar o contexto.

Nunca envia:

todo o prontuário

todo o banco

todas as evoluções

Envia apenas:

Estado Clínico Atual

Linha Temporal

Checklist

Pendências

Objetivo da tarefa

Isso reduz custo e melhora qualidade.

---

# Response Validator

Toda resposta da IA é validada.

Verifica:

estrutura

campos obrigatórios

formatação

coerência

informações proibidas

alucinações evidentes

Se falhar:

nova tentativa

ou

intervenção humana.

---

# Output Formatter

Transforma a resposta em:

Texto

Markdown

JSON

Checklist

Timeline

Áudio (TTS)

PDF

Nunca altera o conteúdo.

Apenas adapta o formato.

---

# Níveis de Complexidade

Nem todas as tarefas exigem o mesmo modelo.

Exemplo

Correção de texto

↓

Modelo pequeno

Resumo

↓

Modelo médio

Briefing da rotina

↓

Modelo grande

Discussão clínica

↓

Modelo grande

O sistema poderá escolher automaticamente o Provider.

---

# Auditoria

Toda chamada registra:

Usuário

Data

Hora

Provider

Modelo

Prompt utilizado

Tempo de resposta

Quantidade de tokens

Resultado

Erro (se existir)

Nunca registrar dados pessoais removidos pela Sanitização.

---

# Custos

O AI Engine deverá registrar:

tokens

latência

modelo

custo estimado

permitindo auditoria financeira do sistema.

---

# Failover

Caso um Provider fique indisponível.

Exemplo

NVIDIA indisponível

↓

Ollama

↓

Claude

↓

OpenAI

↓

Mensagem ao usuário

O restante do sistema continua funcionando.

---

# Segurança

Nenhum Provider recebe:

CPF

Telefone

Endereço

Documentos

Dados administrativos

Todo envio passa obrigatoriamente pelo Sanitizer.

---

# Integração com o Backend

O Backend nunca conversa diretamente com a NVIDIA.

Fluxo:

Backend

↓

AI Engine

↓

Provider

↓

Modelo

↓

AI Engine

↓

Backend

---

# Integração com o Clinical State Engine

O AI Engine nunca consulta diretamente o banco.

Toda informação vem do Clinical State Engine.

Isso garante:

cronologia

integridade

versão única

rastreabilidade

---

# Regras Fundamentais

1. A IA nunca cria fatos clínicos.

2. A IA nunca modifica documentos automaticamente.

3. Toda resposta é considerada sugestão.

4. O profissional sempre aprova o resultado final.

5. A autoria clínica permanece humana.

6. Toda chamada é auditável.

7. O Provider pode ser substituído sem alterar o restante do sistema.

8. O Estado Clínico é a única fonte de verdade.

9. A IA organiza conhecimento; ela não produz conhecimento clínico novo.

10. Sempre que houver dúvida entre completar uma informação ou informar que ela não foi encontrada, prevalece a segunda opção.

---

# Filosofia Final

O AI Engine não foi desenvolvido para substituir médicos.

Foi desenvolvido para eliminar trabalho repetitivo.

Sua missão é reduzir o tempo gasto procurando informações, organizando documentos e preparando resumos.

A Inteligência Artificial do MedAI deverá comportar-se como uma secretária executiva extremamente competente.

Ela prepara o trabalho.

Organiza o conhecimento.

Encontra informações.

Resume discussões.

Estrutura documentos.

Lembra pendências.

Mas nunca toma decisões clínicas.

O médico permanece como único responsável pela assistência ao paciente.
