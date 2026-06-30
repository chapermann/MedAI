# MedAI Database

Versão 0.1

---

# Entidade Principal

Paciente

Cada paciente possui:

- uma ou mais internações

Cada internação possui:

- dias assistenciais

Cada dia assistencial possui:

- checklist
- evolução
- round
- exames
- pendências
- condutas

---

# Usuário

ID

Nome

Cargo

Especialidade

Nível

Senha

Permissões

---

Usuário

↓

Escala Assistencial

↓

Equipe

↓

Leitos

↓

Paciente

---

# Paciente

ID

Nome

Iniciais

Prontuário

Sexo

Nascimento

Especialidade

---

# Internação

ID

Paciente

Data admissão

Leito

Diagnóstico

Procedência

Destino

Alta

Óbito

---

# Dia Assistencial

Data

Responsável

Resumo

---

# Evolução

Versão

Texto

Autor

Data

Hora

Validação

Histórico

---

# Checklist

VM

DVA

Sedação

Diurese

Evacuação

Culturas

Antibiótico

Dispositivos

Exames

Pendências

Plano

---

# Round

Texto

Participantes

Áudio

Transcrição

Resumo IA

---

# Passagem

Texto

Áudio

Versão

---

# Exames

Laboratório

Imagem

Microbiologia

---

# Pendências

Descrição

Responsável

Prazo

Resolvida?

---

# Auditoria

Toda alteração gera registro contendo

Usuário

Data

Hora

Campo alterado

Valor antigo

Valor novo

Motivo
