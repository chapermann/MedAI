# MedAI — Security Specification

Versão: 0.1
Status: Formalizado a partir de docs/AI_RULES.md (Regras 1, 8, 13) e PROJECT.md (Princípios)
Autor: Arquitetura MedAI


---
# Princípio Fundamental

O MedAI é um sistema de organização da informação clínica.

Seu objetivo é disponibilizar a informação correta, para a pessoa correta, no momento correto, respeitando rigorosamente os princípios de confidencialidade, rastreabilidade e responsabilidade profissional.

Sempre que houver conflito entre usabilidade, desempenho ou conveniência e a confidencialidade clínica, prevalecerá a proteção da informação do paciente.

## Responsabilidade Clínica

Toda informação clínica registrada no MedAI é de responsabilidade exclusiva da equipe assistencial.

A Inteligência Artificial atua exclusivamente como ferramenta de organização, estruturação, sumarização e recuperação da informação.

A IA nunca cria fatos clínicos, nunca substitui o julgamento médico e nunca assume autoria de qualquer documento assistencial.

# Sanitização Obrigatória de Dados Pessoais
A sanitização é obrigatória e ocorre antes de qualquer etapa de processamento.
Nenhum componente do MedAI poderá acessar o texto original antes da sanitização.
Isso inclui:
• Banco de dados
• Whisper
• Modelos de IA
• Banco Vetorial
• TTS
• Logs
• Backups
• Cache

## Princípio
O MedAI não possui finalidade administrativa.
Sua finalidade é exclusivamente assistencial.
Portanto, dados pessoais que não agregam valor clínico não deverão ser armazenados.
A sanitização ocorre antes de qualquer processamento pelo sistema.
Nenhum componente interno ou externo poderá receber esses dados.

---

## Dados proibidos

Sempre remover:

- CPF
- RG
- CNH
- Passaporte
- Cartão SUS
- Título de eleitor
- PIS/PASEP
- Telefones
- Celulares
- WhatsApp
- E-mail
- CEP
- Endereço
- Número residencial
- Complemento
- Nome da mãe
- Nome do pai
- Nome de familiares
- Contatos de emergência

Esses dados jamais serão:

- armazenados
- indexados
- enviados para IA
- enviados ao banco vetorial
- utilizados pelo Whisper
- utilizados pelo TTS
- exibidos em telas
- exportados
---
## Política de Não Retenção

Após a sanitização, os dados removidos deixam de existir para o MedAI.

O sistema não mantém cópias temporárias, históricos, arquivos de recuperação ou registros contendo essas informações.

O MedAI registra apenas que ocorreu uma sanitização, sem armazenar o conteúdo removido.
---
## Princípio da Minimização

Todo módulo do MedAI deverá acessar apenas a menor quantidade de informação necessária para executar sua função.

Nenhum componente poderá solicitar, transmitir ou armazenar dados clínicos ou pessoais que não sejam estritamente necessários para a tarefa em execução.
---
### Princípio da Governança
"Sempre que o sistema identificar, com alta confiança, dados pessoais sem finalidade assistencial (como CPF, telefones, endereços, documentos civis e contatos pessoais), esses dados deverão ser removidos imediatamente antes de qualquer armazenamento, processamento, indexação ou transmissão. O conteúdo removido não será preservado em logs, backups, cache ou qualquer outro componente do sistema."
---
## Identificação Clínica

Sempre substituir por identificadores clínicos.

Exemplo:

João Carlos Pereira

↓

Paciente JCP

Telefone:

(21) 99888-7766

↓

[REMOVIDO]

CPF:

123.456.789-09

↓

[REMOVIDO]

Rua das Flores, 321

↓

[REMOVIDO]

---

## Detecção Automática

O sistema deverá detectar automaticamente padrões sugestivos de:

- CPF
- telefone
- celular
- e-mail
- endereço
- documentos oficiais

independentemente da forma como foram escritos.

Exemplos:

21998887766

21 99888 7766

(21)99888-7766

+55 21 99888-7766

CPF 12345678909

123.456.789-09

Todos deverão ser removidos automaticamente.

---
Sanitização obrigatória (mandatória) do Sistema
Sanitização executada

Itens removidos:

✓ 1 CPF

✓ 2 telefones

✓ 1 endereço

Horário:

08:32

Usuário:

Dr. XXXXX

---
## Dados proibidos

Os seguintes dados não possuem finalidade assistencial e serão removidos automaticamente sempre que identificados:

• CPF
• RG
• CNH
• Passaporte
• Cartão SUS
• Título de eleitor
• Telefones
• Celulares
• WhatsApp
• Endereços
• CEP
• E-mails pessoais
• Nome da mãe
• Nome do pai
• Contatos familiares
---

## Regra Absoluta

Caso exista dúvida se determinada informação representa um dado pessoal identificável, o MedAI deverá adotar a abordagem mais conservadora e removê-la antes de qualquer armazenamento ou processamento.

Nenhum dado identificado como potencialmente sensível poderá ser preservado por conveniência técnica.
---

# 1. Escopo

Este documento fecha três frentes que antes existiam apenas como princípio textual:

1. Autenticação e autorização (JWT + RBAC por perfil).
2. Row-Level Security no PostgreSQL, vinculada ao enum `perfil_usuario` definido em specs/DATABASE_SCHEMA.md.
3. Middleware de anonimização obrigatório antes de qualquer chamada externa ao NVIDIA NIM — este é o requisito não-negociável que destrava a arquitetura híbrida fechada anteriormente.

Princípio fundador, citado diretamente do PROJECT.md: "Nenhuma informação de paciente será enviada para serviços externos sem autorização explícita." Este documento é a implementação técnica dessa frase.

---

# 2. Autenticação — JWT

## 2.1 Estrutura de tokens

- **Access token**: JWT assinado (HS256, chave rotacionável), vida útil de **15 minutos**.
- **Refresh token**: opaco (não JWT), armazenado em **cookie httpOnly + Secure + SameSite=Strict**, vida útil de **12 horas** (cobre um plantão completo sem forçar relogin no meio de um round).
- **Nunca em localStorage**: tanto access quanto refresh token. Access token vive em memória no frontend (variável de estado React, perdida ao fechar a aba — aceitável, já que o refresh resolve isso silenciosamente).

## 2.2 Payload do access token

```json
{
  "sub": "usuario_id (UUID)",
  "perfil": "medico_residente",
  "iat": 1750000000,
  "exp": 1750000900
}
```

Nada além disso. Nome do usuário, especialidade e demais metadados são buscados no backend a partir de `sub` — o token em si carrega o mínimo necessário para autorização, reduzindo superfície de exposição caso o token vaze em log ou rede.

## 2.3 Fluxo de refresh

```
Frontend                    Backend (FastAPI)
   │                              │
   │── access token expirado ────►│
   │◄──────── 401 ────────────────│
   │── POST /auth/refresh ───────►│  (cookie httpOnly enviado automaticamente)
   │                              │── valida refresh token no banco
   │                              │── verifica se não foi revogado
   │◄──── novo access token ──────│
```

Refresh tokens são armazenados (hash, não texto plano) na tabela `sessao` para permitir revogação manual — por exemplo, se um residente sair da equipe no meio do plantão, o administrador revoga a sessão sem esperar expiração natural.

```sql
CREATE TABLE sessao (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id      UUID NOT NULL REFERENCES usuario(id),
    refresh_hash    TEXT NOT NULL,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
    expira_em       TIMESTAMPTZ NOT NULL,
    revogado        BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

# 3. Autorização — RBAC por perfil (Regra 13)

## 3.1 Matriz de permissões

| Ação | medico_residente | medico_assistente | medico_chefe | administrador |
|---|---|---|---|---|
| Ler paciente do próprio setor | sim | sim | sim | sim |
| Ler paciente de outro setor | não | não | sim | sim |
| Criar evolução | sim | sim | sim | não* |
| Editar evolução própria (versão) | sim | sim | sim | não* |
| Editar evolução de outro autor | não | não | sim | não* |
| Revisar/aprovar passagem de plantão | não | sim | sim | não* |
| Concluir pendência | sim | sim | sim | não* |
| Gerenciar usuários | não | não | não | sim |
| Ver indicadores agregados (auditoria) | não | não | sim | sim |
| Acessar Biblioteca Científica | sim | sim | sim | sim |

\* `administrador` é um perfil técnico-operacional (gestão de usuários, infraestrutura), não clínico — ele nunca escreve ou edita conteúdo assistencial, por desenho, mesmo que tecnicamente pudesse. Isso reforça a Regra 7 de AI_RULES.md ("o médico é sempre o responsável final") ao nível de banco de dados, não só de UI.

## 3.2 Onde a regra é aplicada — dupla camada

A autorização **não vive só no frontend nem só na API**. Aplicamos em duas camadas redundantes, de propósito:

1. **Camada de API (FastAPI dependency injection)**: cada endpoint declara o(s) perfil(is) permitido(s) via dependency, retornando 403 antes de tocar o banco.
2. **Camada de banco (RLS)**: mesmo que um bug na API deixasse passar uma query indevida, o PostgreSQL recusa a linha. Isso é deliberadamente redundante — para dados clínicos, "a API deveria ter barrado" não é uma defesa aceitável se o banco também pudesse ter barrado e não barrou.

## 3.3 Row-Level Security — exemplo aplicado

```sql
ALTER TABLE evolucao ENABLE ROW LEVEL SECURITY;

-- Sessão do PostgreSQL recebe o perfil e o setor do usuário autenticado
-- via SET LOCAL, definido pelo backend a cada conexão de request.

CREATE POLICY evolucao_leitura_por_setor ON evolucao
FOR SELECT
USING (
    current_setting('app.perfil_usuario') IN ('medico_chefe', 'administrador')
    OR EXISTS (
        SELECT 1 FROM dia_assistencial da
        JOIN internacao i ON i.id = da.internacao_id
        WHERE da.id = evolucao.dia_assistencial_id
        AND i.setor::text = current_setting('app.setor_usuario')
    )
);

CREATE POLICY evolucao_edicao_proprio_autor ON evolucao
FOR UPDATE
USING (
    criado_por = current_setting('app.usuario_id')::uuid
    OR current_setting('app.perfil_usuario') = 'medico_chefe'
);
```

O backend, em cada request autenticado, executa `SET LOCAL app.usuario_id = '...'`, `SET LOCAL app.perfil_usuario = '...'` e `SET LOCAL app.setor_usuario = '...'` dentro da transação — isso é o que conecta o JWT decodificado às políticas de RLS. `SET LOCAL` garante que o valor não vaza entre requests no mesmo pool de conexões.

---

# 4. Middleware de Anonimização — requisito crítico antes do NIM

Esta é a peça que você marcou como não-negociável, e por isso ela não é "boa prática" — é um **gate obrigatório** entre qualquer função de IA e a rede externa.

## 4.1 Princípio de design

Nenhum Especialista de IA chama o endpoint NIM diretamente. Toda chamada passa por uma função única, `anonimizar_e_enviar()`, que é o único ponto do código autorizado a abrir uma conexão de rede externa para fins de inferência. Isso não é apenas modularização — é uma garantia arquitetural: se você (ou qualquer programador futuro do projeto) tentar chamar o NIM de outro lugar, a ausência da função de anonimização no caminho deveria ser pega em code review, não em produção.

## 4.2 O que é substituído, e como

| Campo original | Tratamento antes do envio externo |
|---|---|
| `paciente.nome_completo` | Nunca lido para esse fluxo — a query que monta o payload usa `paciente.iniciais`, nunca `nome_completo` |
| `paciente.prontuario` | Mantido (não identifica o paciente fora do hospital, conforme já decidido) |
| `paciente.data_nascimento` | Convertida para faixa etária (`"65-70 anos"`), nunca data exata |
| Texto livre de evolução/round | Varrido por regex + lista de nomes próprios conhecidos do hospital (equipe + pacientes ativos) antes do envio, substituindo qualquer ocorrência por `[NOME]` |
| `usuario.nome` (autor do registro) | Nunca incluído no prompt — irrelevante para a tarefa de resumo clínico |

## 4.3 Pseudocódigo do gate

```python
async def anonimizar_e_enviar(prompt_especialista: str, contexto: EstadoClinico) -> str:
    """
    Único ponto de saída de rede para inferência externa.
    Nenhum Especialista deve chamar o cliente NIM diretamente.
    """
    contexto_seguro = ContextoAnonimizado(
        iniciais=contexto.iniciais,
        prontuario=contexto.prontuario,
        faixa_etaria=calcular_faixa_etaria(contexto.data_nascimento),
        diagnostico_principal=contexto.diagnostico_principal,
        texto_clinico=remover_nomes_proprios(
            contexto.ultima_evolucao,
            lista_nomes=await carregar_nomes_ativos_hospital()
        ),
    )

    payload = montar_prompt(prompt_especialista, contexto_seguro)

    # Auditoria obrigatória: o que efetivamente saiu do hospital
    # fica registrado, separado do que entrou — para revisão posterior.
    await registrar_log_envio_externo(payload, hash_apenas=False)

    resposta = await cliente_nim.gerar(payload)
    return resposta
```

## 4.4 Auditoria do que sai

```sql
CREATE TABLE log_envio_externo (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    especialista    TEXT NOT NULL,         -- ex: 'passagem_plantao'
    payload_enviado TEXT NOT NULL,         -- o texto exato pós-anonimização
    enviado_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
    usuario_id      UUID NOT NULL REFERENCES usuario(id)
);
```

Esta tabela existe para um propósito específico: permitir que você, periodicamente, audite manualmente se a anonimização está realmente funcionando — leia uma amostra de `payload_enviado` e confirme que nenhum nome real escapou. Isso não substitui testes automatizados da função `remover_nomes_proprios`, mas é a rede de segurança humana por trás dela.

## 4.5 Limitação honesta deste mecanismo

Regex e lista de nomes conhecidos **não são uma garantia formal de anonimização** — é mitigação razoável, não anonimização criptograficamente garantida. Há risco residual real: texto livre ditado por voz pode conter referências indiretas que identificam o paciente sem usar o nome (ex: "o paciente que trabalha na prefeitura", "irmão do Dr. Fulano"). Isso deve ser declarado explicitamente para a equipe médica como limitação conhecida, não escondido — alinhado à Regra 17 de AI_RULES.md ("não invente, se não está entendendo, informe").

---

# 5. Superfícies de ataque específicas do contexto (PWA + Tailscale + notebook fraco)

- **XSS robando access token**: mitigado por token em memória (não localStorage) e CSP restritiva no frontend.
- **Acesso físico ao notebook Lubuntu**: como é hardware compartilhado/modesto, recomenda-se disco com criptografia at-rest (LUKS) e bloqueio de tela automático curto — isso fica fora do escopo deste backend, mas deve constar em DEPLOYMENT.md como requisito de SO.
- **Rede Tailscale comprometida**: Tailscale já provê WireGuard ponta-a-ponta, mas a API ainda deve validar JWT normalmente — nunca confiar implicitamente em "está na rede Tailscale, logo é autorizado".
- **Logs vazando dados clínicos**: `log_envio_externo` guarda dados pós-anonimização por design; logs de aplicação genéricos (erros, requests) devem ser configurados para nunca serializar corpo de request/response contendo campos clínicos — isso vira um requisito explícito de configuração do logger no BACKEND.md.

---

# 6. Decisões em aberto

- **Rotação de chave JWT**: frequência ainda não definida — sugiro mensal como ponto de partida, revisável.
- **MFA para perfil `administrador`**: recomendado dado o acesso a gestão de usuários, mas não bloqueante para a Fase 1 (geração de resumo).
- **Lista de nomes ativos do hospital** (usada em `remover_nomes_proprios`): fonte de dados ainda a definir — provavelmente `usuario.nome` + `paciente.nome_completo` de internações ativas, recarregada periodicamente.

---

# 7. Próximo arquivo da sequência

BACKEND.md — onde o gate `anonimizar_e_enviar()`, o RBAC via dependency injection do FastAPI e o `SET LOCAL` de sessão por request ganham forma concreta de código/estrutura de pastas.
