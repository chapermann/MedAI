# MedAI — Database Schema

Versão: 0.1
Status: Formalizado a partir de docs/DATABASE.md
Banco: PostgreSQL 15+
Autor: Arquitetura MedAI

---

# 1. Princípios de Design (vinculados às Regras de IA)

Este schema implementa diretamente três regras de docs/AI_RULES.md:

- **Regra 9** (nunca apagar versões anteriores) → toda entidade clínica mutável possui uma tabela `_historico` paralela, populada antes de cada UPDATE.
- **Regra 6** (toda resposta deve ser rastreável) → toda tabela clínica carrega `criado_por`, `criado_em`, `origem` (manual, voz, importado).
- **Regra 13** (respeitar níveis de acesso) → `usuario.perfil` define o escopo de leitura via RBAC na camada de API, refletido aqui como enum de papéis.

Convenção: chaves primárias são `UUID` (não serial incremental), para permitir geração offline no notebook sem risco de colisão caso o sistema seja distribuído no futuro.

---

# 2. Diagrama de Entidades (visão lógica)

```
Usuario
   │
   │ (responsável por)
   ▼
Paciente ──< Internacao ──< DiaAssistencial ──┬──< Evolucao
                                                ├──< Checklist
                                                ├──< Round
                                                ├──< Exame
                                                ├──< Pendencia
                                                └──< PassagemPlantao
```

Cada seta `──<` indica relação um-para-muitos. `DiaAssistencial` é o nó central — é o que o docs/DATABASE.md chama de granularidade mínima de acompanhamento, e é também a unidade de contexto que alimenta o "Estado Clínico" usado pelos Especialistas de IA.

---

# 3. DDL — Núcleo

```sql
-- ============================================================
-- EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE perfil_usuario AS ENUM (
    'medico_assistente',
    'medico_residente',
    'medico_chefe',
    'administrador'
);

CREATE TYPE setor_hospitalar AS ENUM (
    'cti',
    'sala_vermelha',
    'emergencia',
    'enfermaria'
);

CREATE TYPE origem_registro AS ENUM (
    'manual',
    'voz',
    'importado'
);

CREATE TYPE gravidade_clinica AS ENUM (
    'estavel',
    'instavel',
    'grave',
    'critico'
);

-- ============================================================
-- USUARIO
-- ============================================================
CREATE TABLE usuario (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome            TEXT NOT NULL,
    cargo           TEXT,
    especialidade   TEXT,
    perfil          perfil_usuario NOT NULL,
    senha_hash      TEXT NOT NULL,
    ativo           BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PACIENTE
-- ============================================================
CREATE TABLE paciente (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo       TEXT NOT NULL,         -- nunca exibido na interface clínica (apenas iniciais)
    iniciais            TEXT NOT NULL,         -- gerado automaticamente a partir de nome_completo
    prontuario          TEXT NOT NULL UNIQUE,  -- único identificador exibido em tela
    sexo                TEXT,
    data_nascimento     DATE,
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- nome_completo é o único campo sensível desta tabela inteira.
-- Nenhum outro campo do schema referencia nome_completo diretamente;
-- todas as demais tabelas referenciam paciente.id (UUID), nunca o nome.

-- ============================================================
-- INTERNACAO
-- ============================================================
CREATE TABLE internacao (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id             UUID NOT NULL REFERENCES paciente(id),
    leito                   TEXT NOT NULL,
    setor                   setor_hospitalar NOT NULL,
    diagnostico_principal   TEXT NOT NULL,
    diagnosticos_secundarios TEXT[],
    equipe_responsavel      UUID REFERENCES usuario(id),
    data_internacao         TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_alta               TIMESTAMPTZ,        -- NULL = internação ativa
    ativa                   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_internacao_ativa ON internacao(setor) WHERE ativa = TRUE;
-- índice parcial: o Painel Geral de Leitos consulta isso constantemente,
-- e só precisa das internações ativas por setor.

-- ============================================================
-- DIA ASSISTENCIAL (nó central do modelo)
-- ============================================================
CREATE TABLE dia_assistencial (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internacao_id   UUID NOT NULL REFERENCES internacao(id),
    data_referencia DATE NOT NULL,
    gravidade       gravidade_clinica,
    ventilacao      BOOLEAN NOT NULL DEFAULT FALSE,
    droga_vasoativa BOOLEAN NOT NULL DEFAULT FALSE,
    isolamento      TEXT,                       -- NULL = sem isolamento
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (internacao_id, data_referencia)
);
```

---

# 4. DDL — Entidades Clínicas (com versionamento)

Padrão aplicado a Evolução, Checklist, Round, Exame, Pendência e Passagem de Plantão: cada tabela principal guarda **apenas a versão vigente**; cada UPDATE dispara cópia automática do estado anterior para a tabela `_historico` correspondente, via trigger. Nada é apagado — `DELETE` é proibido por design nestas tabelas (sem política de RLS para DELETE).

```sql
-- ============================================================
-- EVOLUCAO
-- ============================================================
CREATE TABLE evolucao (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dia_assistencial_id UUID NOT NULL REFERENCES dia_assistencial(id),
    conteudo            TEXT NOT NULL,
    origem              origem_registro NOT NULL DEFAULT 'manual',
    criado_por          UUID NOT NULL REFERENCES usuario(id),
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
    versao              INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE evolucao_historico (
    id_historico    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evolucao_id     UUID NOT NULL REFERENCES evolucao(id),
    conteudo        TEXT NOT NULL,
    versao          INTEGER NOT NULL,
    criado_por      UUID NOT NULL REFERENCES usuario(id),
    substituido_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION fn_versionar_evolucao()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO evolucao_historico (evolucao_id, conteudo, versao, criado_por)
    VALUES (OLD.id, OLD.conteudo, OLD.versao, OLD.criado_por);
    NEW.versao := OLD.versao + 1;
    NEW.atualizado_em := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_versionar_evolucao
BEFORE UPDATE ON evolucao
FOR EACH ROW
WHEN (OLD.conteudo IS DISTINCT FROM NEW.conteudo)
EXECUTE FUNCTION fn_versionar_evolucao();

-- O mesmo par (tabela principal + _historico + trigger) deve ser
-- replicado identicamente para: checklist, round, pendencia,
-- passagem_plantao. Exame normalmente não é versionado por conteúdo
-- (laudo é imutável por natureza), mas registra status (ver seção 5).
```

```sql
-- ============================================================
-- EXAME (sem versionamento de conteúdo — laudo é fato imutável;
-- o que muda é o STATUS, que por si só já é um histórico de eventos)
-- ============================================================
CREATE TYPE status_exame AS ENUM (
    'solicitado',
    'realizado_aguardando_laudo',
    'laudo_disponivel'
);

CREATE TABLE exame (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dia_assistencial_id UUID NOT NULL REFERENCES dia_assistencial(id),
    tipo_exame          TEXT NOT NULL,          -- ex: 'Eletrocardiograma'
    status               status_exame NOT NULL DEFAULT 'solicitado',
    data_solicitacao     TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_realizacao      TIMESTAMPTZ,
    data_laudo           TIMESTAMPTZ,
    arquivo_digitalizado_url TEXT,               -- aplica-se a ECG, conforme Regra 15 de AI_RULES.md
    criado_por           UUID NOT NULL REFERENCES usuario(id)
);
```

---

# 5. Pendência (estrutura de acompanhamento, AI_RULES Regra 16)

```sql
CREATE TYPE status_pendencia AS ENUM (
    'aberta',
    'em_andamento',
    'concluida'
);

CREATE TABLE pendencia (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dia_assistencial_id UUID NOT NULL REFERENCES dia_assistencial(id),
    descricao           TEXT NOT NULL,
    responsavel_id       UUID REFERENCES usuario(id),
    status               status_pendencia NOT NULL DEFAULT 'aberta',
    criado_por           UUID NOT NULL REFERENCES usuario(id),
    criado_em            TIMESTAMPTZ NOT NULL DEFAULT now(),
    concluido_em         TIMESTAMPTZ
);
```

---

# 6. Passagem de Plantão (entidade prioritária — Fase 1 do projeto)

Dado que a prioridade atual é validar a qualidade do resumo gerado (texto), não o áudio, esta tabela separa explicitamente as duas responsabilidades: o **texto estruturado** (gerado pelo Especialista em Passagem de Plantão, validável e revisável por médico) e o **áudio** (TTS, opcional, gerado depois, em campo nulo até a Fase 2).

```sql
CREATE TABLE passagem_plantao (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internacao_id           UUID NOT NULL REFERENCES internacao(id),
    resumo_estruturado      TEXT NOT NULL,       -- saída validada do Especialista
    resumo_bruto_ia         TEXT,                -- saída original da IA, antes de qualquer edição médica (rastreabilidade)
    revisado_por            UUID REFERENCES usuario(id),
    revisado_em             TIMESTAMPTZ,
    audio_url               TEXT,                -- NULL até a Fase 2 (TTS)
    origem                  origem_registro NOT NULL DEFAULT 'voz',
    criado_por               UUID NOT NULL REFERENCES usuario(id),
    criado_em                TIMESTAMPTZ NOT NULL DEFAULT now(),
    versao                   INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE passagem_plantao_historico (
    id_historico        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passagem_plantao_id  UUID NOT NULL REFERENCES passagem_plantao(id),
    resumo_estruturado   TEXT NOT NULL,
    versao               INTEGER NOT NULL,
    criado_por            UUID NOT NULL REFERENCES usuario(id),
    substituido_em        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger análogo ao de evolucao (fn_versionar_evolucao), aplicado
-- ao campo resumo_estruturado. Omitido aqui por repetição —
-- ver Seção 4 para o padrão exato.
```

**Por que `resumo_bruto_ia` separado de `resumo_estruturado`:** isso implementa diretamente a Regra 6 (rastreabilidade) na prática mais crítica do sistema. Se um médico editar o resumo gerado pela IA antes de usar em uma passagem real, o sistema preserva o que a IA originalmente produziu — essencial tanto para auditoria de qualidade do Especialista quanto para você, como desenvolvedor, medir o quão perto a IA chega do output final aceito sem edição.

---

# 7. View materializada — "Estado Clínico" (contexto para a IA)

O PROJECT.md define que "Toda IA utilizará o Estado Clínico como contexto. Nunca apenas o último áudio." Isso precisa ser uma consulta única e reutilizável, não lógica espalhada em cada Especialista.

```sql
CREATE VIEW vw_estado_clinico AS
SELECT
    i.id AS internacao_id,
    p.iniciais,
    p.prontuario,
    i.leito,
    i.setor,
    i.diagnostico_principal,
    i.diagnosticos_secundarios,
    da.data_referencia AS ultimo_dia_assistencial,
    da.gravidade,
    da.ventilacao,
    da.droga_vasoativa,
    da.isolamento,
    (SELECT conteudo FROM evolucao e
        WHERE e.dia_assistencial_id = da.id
        ORDER BY e.criado_em DESC LIMIT 1) AS ultima_evolucao,
    (SELECT count(*) FROM pendencia pe
        WHERE pe.dia_assistencial_id = da.id
        AND pe.status != 'concluida') AS pendencias_abertas
FROM internacao i
JOIN paciente p ON p.id = i.paciente_id
JOIN dia_assistencial da ON da.internacao_id = i.id
WHERE i.ativa = TRUE
AND da.data_referencia = (
    SELECT max(data_referencia) FROM dia_assistencial
    WHERE internacao_id = i.id
);
```

Todo prompt enviado a um Especialista de IA deve consultar `vw_estado_clinico` para montar o contexto — nunca montar contexto manualmente a partir de tabelas individuais. Isso centraliza a lógica de "o que a IA enxerga" em um único ponto auditável.

---

# 8. Decisões em aberto (não fechadas neste documento)

- **Política de retenção de `_historico`**: crescimento ilimitado é aceitável a princípio (armazenamento é barato comparado a perder rastreabilidade clínica), mas merece revisão quando o volume de dados justificar partição por data.
- **RLS (Row-Level Security) por perfil de usuário**: este documento define o enum `perfil_usuario`, mas as políticas de RLS propriamente ditas pertencem a SECURITY.md, não aqui.
- **Particionamento de `dia_assistencial`** por internação ativa/inativa: avaliar apenas se o notebook Lubuntu mostrar degradação de performance real, não preventivamente.

---

# 9. Próximo arquivo da sequência

SECURITY.md (RLS por perfil + middleware de anonimização antes de chamadas ao NVIDIA NIM, conforme decidido na arquitetura de stack).
