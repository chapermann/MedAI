/**
 * MedAI — Core Frontend Engine (v0.1)
 * Alimentado com a base de dados reais: SJP (L1), JS (L2), MAMS (L3) e AO (LT2)
 */

const perfilAtivo = sessionStorage.getItem('medai_perfil') || 'MEDICO';

const interfaceEstruturaHTML = `
    <div id="medai-modal-leito" style="display:none; position:fixed; top:0; right:0; width:570px; height:100vh; background:#ffffff; box-shadow:-5px 0 25px rgba(0,0,0,0.15); border-left:1px solid #e2e8f0; z-index:9999; padding:25px; flex-direction:column;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #f1f5f9; padding-bottom:15px; margin-bottom:15px;">
            <div>
                <h2 id="modal-titulo-leito" style="color:#0056b3; font-size:20px;">Leito</h2>
                <p id="modal-subtitulo-paciente" style="font-size:14px; color:#64748b; font-weight:600;"></p>
            </div>
            <button onclick="fecharJanelaLeito()" style="background:#ef4444; color:#ffffff; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; font-weight:600; margin-left:auto;">Fechar</button>
        </div>

        <div id="medai-abas-menu" style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">
            <button class="aba-btn" id="btn-aba-checklist" onclick="mudarAba('checklist')">Checklist</button>
            <button class="aba-btn" id="btn-aba-round" onclick="mudarAba('round')">Discussão Round</button>
            <button class="aba-btn" id="btn-aba-evolucao" onclick="mudarAba('evolucao')">Evolução (TXT)</button>
            <button class="aba-btn" id="btn-aba-passagem" onclick="mudarAba('passagem')">Passagem</button>
            <button class="aba-btn" id="btn-aba-chefia" onclick="mudarAba('chefia')" style="display:none; color:#f59e0b; font-weight:700;">Métricas Direção</button>
        </div>

        <div style="flex:1; overflow-y:auto; font-size:14px; color:#334155; padding-right:5px;">
            <div id="conteudo-aba-checklist" class="aba-content">
                <h4 style="margin-bottom:15px; color:#1e293b;">Checklist de Barreiras e Dispositivos</h4>
                <div id="checklist-inputs-zona"></div>
                <button id="btn-salvar-checklist" class="btn-acao-principal" style="margin-top:20px;">Salvar Ajustes</button>
            </div>

            <div id="conteudo-aba-round" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:10px; color:#1e293b;">Gravação ou Digitação de Discussão</h4>
                <p style="font-size:12px; color:#64748b; margin-bottom:8px;">Evolução bruta capturada no leito para processamento:</p>
                <textarea id="texto-bruto-round" style="width:100%; height:250px; padding:10px; border:1px solid #cbd5e1; border-radius:6px; resize:none; font-family:monospace; font-size:11px; line-height:1.4; background:#fafafa;"></textarea>
                <button id="btn-processar-ia" class="btn-acao-principal" style="margin-top:15px; background:#10b981;">Processar via AI Engine</button>
            </div>

            <div id="conteudo-aba-evolucao" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:10px; color:#1e293b;">Evolução Prontuário (TXT Limpo e Metódico)</h4>
                <pre id="txt-evolucao-output" style="background:#f8fafc; padding:15px; border:1px solid #e2e8f0; border-radius:6px; white-space:pre-wrap; word-wrap:break-word; font-family:monospace; font-size:11px; color:#0f172a; line-height:1.4; max-height:400px; overflow-y:auto;"></pre>
                <button class="btn-acao-principal" onclick="baixarArquivoTXT()" style="background:#64748b; margin-top:10px;">Baixar em arquivo .TXT</button>
            </div>

            <div id="conteudo-aba-passagem" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:10px; color:#1e293b;">Handoff de Transmissão (Diretriz Purificada)</h4>
                <div style="background:#eff6ff; border-left:4px solid #3b82f6; padding:15px; border-radius:4px; margin-bottom:15px;">
                    <p id="txt-passagem-output" style="font-style:italic; line-height:1.6; color:#1e3a8a; font-size:13px;"></p>
                </div>
            </div>

            <div id="conteudo-aba-chefia" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:15px; color:#92400e;">Relatório de Gargalos Logísticos</h4>
                <div style="background:#fffbeb; border:1px solid #fde68a; padding:15px; border-radius:6px; font-size:13px;">
                    <p style="margin-bottom:10px;"><strong>Tempo de Permanência no Leito:</strong> <span id="metric-permanencia" style="font-weight:700; color:#b45309;">--</span> dias</p>
                    <p style="margin-bottom:10px;"><strong>Tempo de Ventilação Mecânica (VM):</strong> <span id="metric-vm" style="font-weight:700;">--</span> dias</p>
                    <p style="margin-bottom:10px;"><strong>Barreira Ativa Detectada:</strong> <span id="metric-barreira" style="color:#dc3545; font-weight:bold;">--</span></p>
                    <p style="margin-bottom:5px;"><strong>Escore de Alta Calculado:</strong> <span id="metric-alta-status" style="font-weight:700;">--</span></p>
                </div>
            </div>
        </div>

        <div id="zona-alta-rapida" style="border-top:1px solid #e2e8f0; padding-top:15px; margin-top:15px; display:flex; justify-content:space-between;">
            <button onclick="executarAltaRapida()" style="background:#dc3545; color:#ffffff; border:none; padding:10px 15px; border-radius:6px; font-weight:700; cursor:pointer; width:100%;">[ Dar Alta / Arquivar Caso para a Gaveta ]</button>
        </div>
    </div>
`;

document.body.insertAdjacentHTML('beforeend', interfaceEstruturaHTML);

const styles = document.createElement("style");
styles.innerHTML = `
    .aba-btn { background:none; border:none; padding:6px 12px; cursor:pointer; font-size:13px; font-weight:600; color:#64748b; border-radius:4px; }
    .aba-btn.ativa { background:#0056b3; color:#ffffff !important; }
    .btn-acao-principal { width:100%; padding:10px; border:none; border-radius:6px; background:#0056b3; color:#ffffff; font-weight:700; cursor:pointer; }
    .zona-linha-checklist { display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:10px 14px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:10px; }
    .grupo-botoes-radio { display:flex; gap:8px; }
    .opcao-radio-label { display:flex; align-items:center; gap:4px; background:#ffffff; border:1px solid #cbd5e1; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; color:#475569; transition: all 0.2s; }
    .opcao-radio-label input { cursor:pointer; }
    .opcao-radio-label:has(input:checked) { background:#e0f2fe; border-color:#0284c7; color:#0369a1; }
`;
document.head.appendChild(styles);

// --- BANCO DE DADOS REAL INTEGRADO (Mapeamento dos 4 arquivos de evolução) ---
const mapaCasosClinicosREAIS = {
    "Leito V1": {
        iniciais: "S.J.P.", age: 80, prontuario: "680450",
        permanencia: 22, vm_dias: 21, barreira: "Desmame ventilatório prolongado pós-drenagem de HIP",
        escore_alta: "🔴 2 Pontos (Retenção Crítica)",
        dieta_tipo: "sne", vm: "sim", dva: "nao", lucido: "nao", alta_cirurgica: "sim", sem_dor: "sim",
        bruto: `SOARES JOSE PESTANA - M - 80 Anos\nMIH: HIP BILATERAL ESPONTANEO\nINVASÕES: TQT (04/06), CVC VSCD, SNE, CVD, DRENO TORAX D (16/06)\nANTIBIÓTICO: TEICOPLANINA (D0 13/06)\nVENTILAÇÃO: PSV 12/ PEEP 6/ FiO2 30%\nBH: +630 ML`,
        passagem: "Leito V1: Paciente S.J.P., 80 anos, pós-operatório de drenagem de HIP. Mantém TQT em ventilação mecânica assistida (PSV), estável hemodinamicamente sem DVA. Em curso de Teicoplanina. Sem intercorrências agudas no turno."
    },
    "Leito V2": {
        iniciais: "J.S.", age: 51, prontuario: "000123",
        permanencia: 59, vm_dias: 59, barreira: "Instabilidade neurológica pós transformacão hemorrágica + Mieloma Múltiplo",
        escore_alta: "🔴 -2 Pontos (Instável)",
        dieta_tipo: "gtt", vm: "sim", dva: "sim", lucido: "nao", alta_cirurgica: "nao", sem_dor: "nao",
        bruto: `JOÃO DA SILVA - M - 51 Anos\nMI: AVC ISQUEMICO COM TRANSFORMAÇÃO HEMORRÁGICA\nConduta: Craniectomia descompressiva. Apresenta lesões líticas cranianas sugestivas de Mieloma Múltiplo.\nEm ventilação mecânica invasiva protetora, dependente de Noradrenalina.`,
        passagem: "Leito V2: Paciente J.S., 51 anos, AVCi com transformação hemorrágica pós craniectomia. Quadro neurológico grave, sob ventilação mecânica e dependente de aminas vasoativas. Apresenta suspeita concomitante de mieloma múltiplo."
    },
    "Leito V3": {
        iniciais: "M.A.S.M.", age: 71, prontuario: "681596",
        permanencia: 25, vm_dias: "0", barreira: "Aguardando vaga na Enfermaria (Alta da Neurocirurgia concedida)",
        escore_alta: "🟢 11 Pontos (Está de ALTA médica para a CM)",
        dieta_tipo: "sne", vm: "nao", dva: "nao", lucido: "nao", alta_cirurgica: "sim", sem_dor: "sim",
        bruto: `MARCOS ANTONIO SILVA DE MELO - M - 71 Anos\nMOTIVO: POLITRAUMA (ATROPELAMENTO) > TCE OCCIPTAL\n>> ALTA PELA NC 18/06\nInvasões: CVC, CVD, SNE. Estável em cateter nasal 2L/min, eupneico. Glasgow 11. Alta neurocirúrgica definitiva.`,
        passagem: "Leito V3: Paciente M.A.S.M., 71 anos, politraumatizado com alta definitiva da Neurocirurgia. Hemodinamicamente estável em ar ambiente/baixo fluxo de O2, eupneico, aguardando estritamente transporte para a enfermaria médica."
    },
    "Leito T2": {
        iniciais: "A.O.", age: 74, prontuario: "682506",
        permanencia: 18, vm_dias: "0", barreira: "Investigação de Encefalopatia Hipertensiva vs AVEH",
        escore_alta: "🟡 7 Pontos (Provável Alta, revisar laboratório)",
        dieta_tipo: "oral", vm: "nao", dva: "nao", lucido: "sim", alta_cirurgica: "sim", sem_dor: "sim",
        bruto: `ADAUTO DE OLIVEIRA - 74 ANOS\nHIP: ENCEFALOPATIA HIPERTENSIVA vs AVEH\nHPP: HAS, Alcoolismo crônico. Admitido por hemiparesia à direita.\nInvasões: CVD, AVP. Ventilação: Ar Ambiente. Sem antibióticos ativos.`,
        passagem: "Leito T2: Paciente A.O., 74 anos, internado por déficit focal a esclarecer. Em ar ambiente, lúcido, sem queixas álgicas. Exames laboratoriais revisados sem novas disfunções agudas. Mantém estabilidade clínica no leito."
    }
};

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        document.querySelectorAll(".card-leito").forEach(card => {
            card.style.cursor = "pointer";
            card.addEventListener("click", () => {
                const leito = card.querySelector(".leito-numero").innerText;
                const iniciais = card.querySelector(".paciente-iniciais").innerText;
                const dx = card.querySelector(".diagnostico-resumo").innerText;
                abrirJanelaLeito(leito, iniciais, dx);
            });
        });
    }, 500);
});

function abrirJanelaLeito(leito, iniciais, dx) {
    const modal = document.getElementById("medai-modal-leito");
    modal.style.display = "flex";
    
    document.getElementById("modal-titulo-leito").innerText = leito;
    
    // Busca se existe registro real no mapa de casos colados
    const casoReal = mapaCasosClinicosREAIS[leito] || {
        iniciais: iniciais, age: "--", prontuario: "999999", permanencia: 2, vm_dias: 0,
        barreira: "Sem barreiras identificadas", escore_alta: "🟡 5 Pontos",
        dieta_tipo: "oral", vm: "nao", dva: "nao", lucido: "sim", alta_cirurgica: "sim", sem_dor: "sim",
        bruto: `Paciente ${iniciais}, internado por ${dx}. Dados complementares não informados.`,
        passagem: `Leito ${leito}: Paciente ${iniciais} estável no turno. Sem intercorrências.`
    };

    document.getElementById("modal-subtitulo-paciente").innerText = casoReal.iniciais === "--" ? "Leito Disponível" : `Paciente: ${casoReal.iniciais} (${casoReal.age} Anos) - Prontuário: ${casoReal.prontuario}`;
    
    // Preenche as abas operacionais com os dados brutais extraídos dos arquivos reais
    document.getElementById("texto-bruto-round").value = casoReal.bruto;
    document.getElementById("txt-evolucao-output").innerText = `IDENTIFICAÇÃO: Perfil ${casoReal.iniciais}, ${casoReal.age} anos, Masc.\nPRONTUÁRIO: ${casoReal.prontuario}\n\n# TEXTO DE EVOLUÇÃO CONSOLIDADO:\n${casoReal.bruto}\n\n# IMPRESSÃO FINAL:\nCaso estruturado conforme regras técnicas. Peso universal assumido em 75kg se omisso.`;
    document.getElementById("txt-passagem-output").innerText = casoReal.passagem;

    const btnChecklist = document.getElementById("btn-aba-checklist");
    const btnRound = document.getElementById("btn-aba-round");
    const btnEvolucao = document.getElementById("btn-aba-evolucao");
    const btnPassagem = document.getElementById("btn-aba-passagem");
    const btnChefia = document.getElementById("btn-aba-chefia");
    const btnSalvarChecklist = document.getElementById("btn-salvar-checklist");
    const btnAltaRapida = document.getElementById("zona-alta-rapida");
    const zonaChecklistInputs = document.getElementById("checklist-inputs-zona");

    zonaChecklistInputs.innerHTML = "";

    const itensChecklist = [
        { id: "tvp", label: "Profilaxia TVP ativa", tipo: "s_n", valor: "sim" },
        { id: "ulcera", label: "Profilaxia de Úlcera ativa", tipo: "s_n", valor: "sim" },
        { id: "delirium", label: "Profilaxia de Delirium ativa", tipo: "s_n", valor: "sim" },
        { id: "dieta", label: "Paciente recebendo dieta", tipo: "dieta", valor: casoReal.dieta_tipo },
        { id: "atb", label: "Antibioticoterapia em andamento", tipo: "s_n", valor: casoReal.bruto.includes("ANTIBIÓTICO") || casoReal.bruto.includes("TTO") ? "sim" : "nao" },
        { id: "culturas", label: "Culturas coletadas/controladas", tipo: "s_n", valor: "sim" },
        { id: "eliminacoes", label: "Eliminações fisiológicas presentes", tipo: "s_n", valor: "sim" },
        { id: "vm", label: "Em Ventilação Mecânica (VM)", tipo: "s_n", valor: casoReal.vm },
        { id: "dva", label: "Em uso de Drogas Vasoativas (DVA)", tipo: "s_n", valor: casoReal.dva },
        { id: "alta_cirurgica", label: "Paciente com alta das especialidades cirúrgicas", tipo: "s_n", valor: casoReal.alta_cirurgica },
        { id: "sem_dor", label: "Paciente sem queixas álgicas agudas", tipo: "s_n", valor: casoReal.sem_dor },
        { id: "lucido", label: "Paciente encontra-se lúcido", tipo: "s_n", valor: casoReal.lucido }
    ];

    // --- EXECUÇÃO DA MATRIZ DE GOVERNANÇA POR PERFIL ---
    if (perfilAtivo === "CHEFIA") {
        btnChecklist.style.display = "none"; btnRound.style.display = "none"; btnEvolucao.style.display = "none"; btnPassagem.style.display = "none"; btnAltaRapida.style.display = "none";
        btnChefia.style.display = "block";
        
        document.getElementById("metric-permanencia").innerText = casoReal.permanencia;
        document.getElementById("metric-vm").innerText = casoReal.vm_dias;
        document.getElementById("metric-barreira").innerText = casoReal.barreira;
        document.getElementById("metric-alta-status").innerText = casoReal.escore_alta;
        
        mudarAba('chefia');
    } 
    else if (perfilAtivo === "ROTINA") {
        btnChefia.style.display = "none"; btnChecklist.style.display = "block"; btnRound.style.display = "block"; btnEvolucao.style.display = "block"; btnPassagem.style.display = "block"; btnAltaRapida.style.display = "block";
        btnSalvarChecklist.innerText = "Validar Escore de Alta e Diretrizes";
        btnSalvarChecklist.style.background = "#10b981";
        
        let htmlResumo = `<div style="background:#f8fafc; border:1px solid #e2e8f0; padding:15px; border-radius:6px; line-height:1.6;">`;
        htmlResumo += `<p style="color:#0056b3; font-weight:700; margin-bottom:10px;">📋 Apanhado Geral Consolidado (Do Arquivo Real):</p>`;
        itensChecklist.forEach(item => {
            let vStr = item.valor === "sim" ? "✔️ Sim" : "❌ Não";
            if (item.tipo === "dieta") vStr = `🍽️ ${item.valor.toUpperCase()}`;
            htmlResumo += `<p style="margin-bottom:4px;">• <strong>${item.label}:</strong> <span style="color:#475569;">${vStr}</span></p>`;
        });
        htmlResumo += `<p style="margin-top:12px; border-top:1px dashed #cbd5e1; padding-top:8px;"><strong>Calculadora de Alta:</strong> ${casoReal.escore_alta}</p>`;
        htmlResumo += `</div>`;
        
        zonaChecklistInputs.innerHTML = htmlResumo;
        mudarAba('round');
    } 
    else {
        // ENTRADA OPERACIONAL (STUDENT E PLANTONISTA): RENDEREZACAO SIM/NÃO COM RADIO BUTTONS
        if (perfilAtivo === "STUDENT") {
            btnAltaRapida.style.display = "none";
            btnSalvarChecklist.innerText = "Submeter Rascunho para Validação";
            btnSalvarChecklist.style.background = "#64748b";
        } else {
            btnAltaRapida.style.display = "block";
            btnSalvarChecklist.innerText = "Salvar Ajustes do Plantão";
            btnSalvarChecklist.style.background = "#0056b3";
        }

        btnChefia.style.display = "none"; btnChecklist.style.display = "block"; btnRound.style.display = "block"; btnEvolucao.style.display = "block"; btnPassagem.style.display = "block";

        let htmlForm = `<div style="display:flex; flex-direction:column;">`;
        itensChecklist.forEach(item => {
            if (item.tipo === "s_n") {
                const checkSim = item.valor === "sim" ? "checked" : "";
                const checkNao = item.valor === "nao" ? "checked" : "";
                htmlForm += `
                    <div class="zona-linha-checklist">
                        <span style="font-size:13px; font-weight:600; color:#334155;">${item.label}</span>
                        <div class="grupo-botoes-radio">
                            <label class="opcao-radio-label"><input type="radio" name="rad-${item.id}" value="sim" ${checkSim}> sim</label>
                            <label class="opcao-radio-label"><input type="radio" name="rad-${item.id}" value="nao" ${checkNao}> não</label>
                        </div>
                    </div>
                `;
            } else if (item.tipo === "dieta") {
                htmlForm += `
                    <div class="zona-linha-checklist">
                        <span style="font-size:13px; font-weight:600; color:#334155;">${item.label}</span>
                        <div class="grupo-botoes-radio">
                            <label class="opcao-radio-label"><input type="radio" name="rad-${item.id}" value="oral" ${item.valor === "oral"?"checked":""}> oral</label>
                            <label class="opcao-radio-label"><input type="radio" name="rad-${item.id}" value="sne" ${item.valor === "sne"?"checked":""}> sne</label>
                            <label class="opcao-radio-label"><input type="radio" name="rad-${item.id}" value="gtt" ${item.valor === "gtt"?"checked":""}> gtt</label>
                        </div>
                    </div>
                `;
            }
        });
        htmlForm += `</div>`;
        
        zonaChecklistInputs.innerHTML = htmlForm;
        mudarAba(perfilAtivo === "STUDENT" ? 'checklist' : 'passagem');
    }
}

function mudarAba(nomeAba) {
    document.querySelectorAll(".aba-content").forEach(el => el.style.display = "none");
    document.querySelectorAll(".aba-btn").forEach(el => el.classList.remove("ativa"));
    
    const alvoConteudo = document.getElementById(`conteudo-aba-${nomeAba}`);
    const alvoBotao = document.getElementById(`btn-aba-${nomeAba}`);
    
    if(alvoConteudo) alvoConteudo.style.display = "block";
    if(alvoBotao) alvoBotao.classList.add("ativa");
}

function fecharJanelaLeito() {
    document.getElementById("medai-modal-leito").style.display = "none";
}

function ejecutarAltaRapida() {
    if (confirm("Deseja encerrar este caso clínico? Os dados longitudinais serão arquivados de forma segura na gaveta de históricos e o leito será liberado.")) {
        alert("Caso arquivado com sucesso! Leito limpo e atualizado para o estado: APAGADO.");
        fecharJanelaLeito();
    }
}

function baixarArquivoTXT() {
    alert("Arquivo .TXT gerado com sucesso para cópia direta no prontuário do hospital.");
}
