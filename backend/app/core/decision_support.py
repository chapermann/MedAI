from typing import Dict, Any

def calcular_escore_alta_enfermaria(dados_checklist: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executa o algoritmo matemático dos Critérios de Internação em Enfermaria de Clínica Médica.
    Recebe um dicionário com os estados booleanos (True/False) coletados do Dia Assistencial.
    """
    pontuacao = 0
    
    # 1. Alta pelas especialidades cirúrgicas? (sim=1; nao=-1)
    if dados_checklist.get("alta_cirurgica") is True:
        pontuacao += 1
    else:
        pontuacao -= 1

    # 2. Sem condição cirúrgica ou potencialmente cirúrgica no momento? (sim=1; nao=-1)
    if dados_checklist.get("sem_condicao_cirurgica") is True:
        pontuacao += 1
    else:
        pontuacao -= 1

    # 3. Encontra-se em ar ambiente? (sim=1; nao=-1)
    if dados_checklist.get("ar_ambiente") is True:
        pontuacao += 1
    else:
        pontuacao -= 1

    # 4. Se precisa de O2, necessita de pouco fluxo (até 5L/min) ou pouca suplementação? (sim=1; nao=-1)
    if dados_checklist.get("o2_baixo_fluxo") is True:
        pontuacao += 1
    else:
        pontuacao -= 1

    # 5. Encontra-se lúcido? (sim=1; nao=-1)
    if dados_checklist.get("lucido") is True:
        pontuacao += 1
    else:
        pontuacao -= 1

    # 6. Se não lúcido, encontra-se hemodinamicamente estável? (sim=1; nao=-1)
    if dados_checklist.get("nao_lucido_porem_estavel") is True:
        pontuacao += 1
    else:
        pontuacao -= 1

    # 7. Encontra-se nesse momento sem queixas álgicas? (sim=1; nao=-1)
    if dados_checklist.get("sem_dor") is True:
        pontuacao += 1
    else:
        pontuacao -= 1

    # 8. Recebeu alta recentemente ou esteve internado na clínica médica (retornou por falta de estabilização)? (sim=-1; nao=1)
    if dados_checklist.get("retorno_recente_enfermaria") is True:
        pontuacao -= 1
    else:
        pontuacao += 1

    # 9. Tem doença clínica descompensada? (sim=1; nao=-1)
    if dados_checklist.get("doenca_descompensada") is True:
        pontuacao += 1
    else:
        pontuacao -= 1

    # 10. Tem doença clínica de especialidade que tenha no Hospital? (sim=1; nao=-1)
    if dados_checklist.get("especialidade_disponivel") is True:
        pontuacao += 1
    else:
        pontuacao -= 1

    # --- CLASSIFICAÇÃO DOS MARCOS AUXILIARES (STATUS DA LÂMPADA DA INTERFACE UX) ---
    if pontuacao < 5:
        status_alta = "Não está de alta para enfermaria de CM"
        cor_lampada = "🔴 VERMELHA"
    elif 5 <= pontuacao <= 8:
        status_alta = "Provavelmente está de alta para a enfermaria de CM, reavaliar cuidadosamente"
        cor_lampada = "🟡 AMARELA"
    else:  # Pontuação maior que 8 (cobrindo o critério > 10)
        status_alta = "Está de alta para enfermaria de CM"
        cor_lampada = "🟢 VERDE"

    return {
        "pontuacao_total": pontuacao,
        "status_clinico": status_alta,
        "indicador_visual": cor_lampada
    }
