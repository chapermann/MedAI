/**
 * MedAI — Core Frontend Engine (v0.5) - COMPLETO
 * Recursos Avançados: Bloqueio de infraestrutura e gerenciamento macro pela Chefia.
 */

const perfilAtivo = sessionStorage.getItem('medai_perfil') || 'MEDICO';

if (!window.bancoDadosLeitos) {
    window.bancoDadosLeitos = {};
}

function garantirEstadoLeito(leito) {
    if (!window.bancoDadosLeitos[leito]) {
        window.bancoDadosLeitos[leito] = {
            textoBruto: "",
            evolucaoTXT: "Aguardando colagem e processamento da evolução do turno...",
            roundTXT: "Aguardando processamento clínico...",
            passagemTXT: "Aguardando fechamento do caso...",
            checklistSalvo: null,
            iniciais: "--",
            diagnostico: "Leito Vazio",
            lampada: "apagada",
            bloqueado: false
        };
    }
}

const interfaceEstruturaHTML = `
    <div id="medai-modal-leito" style="display:none; position:fixed; top:0; right:0; width:620px; height:100vh; background:#ffffff; box-shadow:-5px 0 25px rgba(0,0,0,0.15); border-left:1px solid #e2e8f0; z-index:9999; padding:25px; display:flex; flex-direction:column;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #f1f5f9; padding-bottom:15px; margin-bottom:15px;">
            <div>
                <h2 id="modal-titulo-leito" style="color:#0056b3; font-size:20px;">Leito</h2>
                <p id="modal-subtitulo-paciente" style="font-size:14px; color:#64748b; font-weight:600;"></p>
            </div>
            <button onclick="fecharJanelaLeito()" style="background:#ef4444; color:#ffffff; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; font-weight:600; margin-left:auto;">Fechar</button>
        </div>

        <div id="medai-abas-menu" style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">
            <button class="aba-btn" id="btn-aba-evolucao" onclick="mudarAba('evolucao')">1. Evolução Diária</button>
            <button class="aba-btn" id="btn-aba-checklist" onclick="mudarAba('checklist')">2. Checklist</button>
            <button class="aba-btn" id="btn-aba-round" onclick="mudarAba('round')">3. Round Técnico</button>
            <button class="aba-btn" id="btn-aba-passagem" onclick="mudarAba('passagem')">4. Passagem de Plantão</button>
            <button class="aba-btn" id="btn-aba-chefia" onclick="mudarAba('chefia')" style="display:none; color:#f59e0b; font-weight:700;">Métricas Direção</button>
        </div>

        <div style="flex:1; overflow-y:auto; font-size:14px; color:#334155; padding-right:5px;">
            <div id="conteudo-aba-evolucao" class="aba-content">
                <h4 style="margin-bottom:10px; color:#1e293b;">Entrada de Dados</h4>
                <textarea id="texto-bruto-round" placeholder="Cole aqui a evolução médica completa do leito..." style="width:100%; height:200px; padding:10px; border:1px solid #cbd5e1; border-radius:6px; resize:none; font-family:monospace; font-size:11px; line-height:1.4; background:#fafafa; margin-bottom:12px;"></textarea>
                <button id="btn-processar-ia" class="btn-acao-principal" onclick="processarCasosClinicosReais()" style="background:#10b981; margin-bottom:15px;">Processar via AI Engine</button>
                <h5 style="margin-bottom:8px; color:#475569; font-size:12px; text-transform:uppercase;">Visualização Técnica (TXT Limpo)</h5>
                <pre id="txt-evolucao-output" style="background:#f8fafc; padding:15px; border:1px solid #e2e8f0; border-radius:6px; white-space:pre-wrap; word-wrap:break-word; font-family:monospace; font-size:11px; color:#0f172a; line-height:1.4; max-height:220px; overflow-y:auto; margin-bottom:10px;"></pre>
                <button class="btn-acao-principal" onclick="baixarTXT('evolucao')" style="background:#64748b; margin-bottom:20px;">Baixar Evolução Médica (.TXT)</button>
            </div>

            <div id="conteudo-aba-checklist" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:15px; color:#1e293b;">Checklist de Barreiras e Dispositivos</h4>
                <div id="checklist-inputs-zona"></div>
                <button id="btn-salvar-checklist" class="btn-acao-principal" onclick="salvarChecklistLeito()" style="margin-top:20px;">Confirmar e Salvar Checklist</button>
            </div>

            <div id="conteudo-aba-round" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:10px; color:#1e293b;">Resumo Estruturado para o Round</h4>
                <pre id="txt-round-ia-output" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:15px; font-family:monospace; font-size:11px; line-height:1.4; color:#1e293b; white-space:pre-wrap; max-height:350px; overflow-y:auto;"></pre>
                <button class="btn-acao-principal" onclick="baixarTXT('round')" style="background:#64748b; margin-top:15px;">Baixar Relatório do Round (.TXT)</button>
            </div>

            <div id="conteudo-aba-passagem" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:10px; color:#1e293b;">Handoff de Transmissão</h4>
                <div style="background:#eff6ff; border-left:4px solid #3b82f6; padding:15px; border-radius:4px; margin-bottom:15px;">
                    <textarea id="txt-passagem-output" style="width:100%; height:100px; font-style:italic; line-height:1.5; color:#1e3a8a; font-size:13px; border:1px solid #bfdbfe; background:transparent; resize:none; padding:5px; font-family:sans-serif;"></textarea>
                </div>
                <button class="btn-acao-principal" onclick="enviarHandoffAoConsolidado()" style="background:#2563eb; margin-bottom:12px;">Enviar ao Consolidado de Passagem</button>
                <button class="btn-acao-principal" onclick="abrirPainelPodcasts()" style="background:#475569;">Ver Consolidado Geral (Podcast/TTS)</button>
            </div>

            <div id="conteudo-aba-chefia" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:15px; color:#92400e;">Relatório de Gargalos Logísticos</h4>
                <div style="background:#fffbeb; border:1px solid #fde68a; padding:15px; border-radius:6px; font-size:13px;">
                    <p style="margin-bottom:10px;"><strong>Tempo de Permanência:</strong> <span id="metric-permanencia" style="font-weight:700; color:#b45309;">--</span> dias</p>
                    <p style="margin-bottom:10px;"><strong>Tempo de VM:</strong> <span id="metric-vm" style="font-weight:700;">--</span> dias</p>
                    <p style="margin-bottom:10px;"><strong>Barreira Ativa:</strong> <span id="metric-barreira" style="color:#dc3545; font-weight:bold;">--</span></p>
                    <p style="margin-bottom:5px;"><strong>Escore de Alta:</strong> <span id="metric-alta-status" style="font-weight:700;">--</span></p>
                </div>
            </div>
        </div>

        <div id="zona-alta-rapida" style="border-top:1px solid #e2e8f0; padding-top:15px; margin-top:15px;">
            <button onclick="executarAltaRapida()" style="background:#dc3545; color:#ffffff; border:none; padding:10px 15px; border-radius:6px; font-weight:700; cursor:pointer; width:100%;">[ Dar Alta / Arquivar Caso para a Gaveta ]</button>
        </div>
    </div>

    <div id="medai-modal-consolidado" style="display:none; position:fixed; top:10%; left:25%; width:50%; height:75vh; background:#ffffff; box-shadow:0 10px 40px rgba(0,0,0,0.3); border-radius:8px; z-index:10000; padding:30px; flex-direction:column; border:1px solid #cbd5e1;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #f1f5f9; padding-bottom:15px; margin-bottom:15px;">
            <h3 style="color:#1e3a8a;">Passagem de Plantão Consolidada</h3>
            <button onclick="document.getElementById('medai-modal-consolidado').style.display='none'" style="background:#ef4444; color:#ffffff; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; font-weight:600;">Fechar</button>
        </div>
        <div id="corpo-consolidado-texto" style="flex:1; overflow-y:auto; background:#f8fafc; padding:20px; font-family:monospace; font-size:12px; white-space:pre-wrap; border-radius:6px; border:1px solid #e2e8f0;"></div>
        <button class="btn-acao-principal" onclick="alert('Iniciando síntese de voz (Podcast)...')" style="background:#10b981; margin-top:15px;">▶️ Executar Playlist de Áudio do Turno</button>
    </div>
`;

const baseCasosClinicosReais = {
    "MARCOS": { iniciais: "M.A.S.M.", age: 71, prontuario: "681596", ih: "05/06", dx: "POLITRAUMA POR ATROPELAMENTO / TCE OCCIPITAL", p_ativos: ["Pneumonia nosocomial / ITU ativa em curso de Cefepime (D0: 19/06)", "Politrauma por atropelamento por bicicleta elétrica", "HSA frontal esquerdo e bitemporal"], p_resolvidos: ["Alta NC em 18/06 com liberação assistencial"], pareceres: "\t[ ] Vascular\t[X] NC (Alta em 18/06)\t[ ] CG\t[ ] Ortopedia\t[ ] Otorrino\t[X] Oftalmo (Respondido)", tct: "06/06 [X] Sim: Faixas atelectásicas em base direita, sem derrames volumosos.", atb: "[X] SIM\tCefepime 2g de 12/12h (D0: 19/06)", dieta: "sne", vm: "nao", dva: "nao", lucido: "nao", ac: "sim", permanencia: 25, vm_dias: 0, barreira: "Aguardando liberação de vaga física na enfermaria", lampada: "verde", e_alta: "🟢 11 Pontos (Está de ALTA médica para a CM)", fis: "Despertável, gemente, eupneico em cateter 2L/min. PA 160x61.", labs: "Leucócitos: 11.400, PCR: 30.5", conduta: "Manter Cefepime para ITU, acionar suporte logístico para transporte.", passagem: "Leito V3: M.A.S.M., 71 anos, politrauma com alta definitiva da Neurocirurgia. Estável em cateter nasal de O2 2L/min, eupneico. Em tratamento para ITU com Cefepime. Aguarda vaga na enfermaria." },
    "JOÃO": { iniciais: "J.S.", age: 51, prontuario: "000123", ih: "02/05/2025", dx: "AVCI EXTENSO EM ACM COM TRANSFORMAÇÃO HEMORRÁGICA", p_ativos: ["AVCi extenso em território de ACM esquerda", "Transformação hemorrágica pós Craniectomia Descompressiva", "Pseudoaneurisma em veia femoral esquerda pós-punção profunda"], p_resolvidos: ["Nenhum superado"], pareceres: "\t[X] Vascular (Aguardando eco-doppler e conduta)\t[X] NC (Pós op ativo)", tct: "02/05 [X] Sim: Pneumotórax bilateral drenado, desvio de linha média documentado.", atb: "[ ] NÃO", dieta: "gtt", vm: "sim", dva: "sim", lucido: "nao", ac: "nao", permanencia: 59, vm_dias: 59, barreira: "Instabilidade neurointensiva crítica dependente de suporte", lampada: "vermelha", e_alta: "🔴 -2 Pontos (Retenção Crítica)", fis: "Sedado, intubado, dreno de tórax. Dependente de Noradrenalina.", labs: "Hb: 6.0, Plaquetas: 145.000, Creatinina: 3.2", conduta: "Neuroproteção estrita, controle rigoroso de PAM, metas neurológicas.", passagem: "Leito V2: J.S., 51 anos, pós craniectomia. Grave, sedado sob VM invasiva e dependente de noradrenalina. Aguarda Vascular por pseudoaneurisma." },
    "ADAUTO": { iniciais: "A.O.", age: 74, prontuario: "682506", ih: "12/06", dx: "ENCEFALOPATIA HIPERTENSIVA / AVEH", p_ativos: ["Encefalopatia Hipertensiva aguda", "Déficit focal motor (Hemiparesia D)"], p_resolvidos: ["Estabilização de cifras pressóricas em via pública"], pareceres: "\t[ ] Vascular\t[X] NC (Acompanha imagem de urgência)", tct: "12/06 [ ] Não: Aguardando laudo definitivo da TC de controle", atb: "[ ] NÃO", dieta: "oral", vm: "nao", dva: "nao", lucido: "sim", ac: "sim", permanencia: 18, vm_dias: 0, barreira: "Aguardando laudo oficial de TC de controle e vaga", lampada: "amarela", e_alta: "🟡 7 Pontos (Provável Alta)", fis: "Confuso, fala incongruente, Glasgow 15, ar ambiente.", labs: "Leucócitos: 7.500, PCR: 4.8", conduta: "Vigilância neurológica, manter otimização pressórica, nova imagem.", passagem: "Leito T2: A.O., 74 anos, déficit focal agudo. Em ar ambiente, estável, lúcido porém confuso. Aguarda laudo da TC para liberação." },
    "SOARES": { iniciais: "S.J.P.", age: 80, prontuario: "680450", ih: "26/05/26", dx: "HIP BILATERAL ESPONTANEO / DRENAGEM CIRÚRGICA", p_ativos: ["Desmame ventilatório prolongado pós-HIP", "Pneumonia nosocomial por Proteus Mirabilis ativa", "Úlcera de pressão sacrococcígea grau IV com necrose e fibrina"], p_resolvidos: ["Alta cirúrgica concedida"], pareceres: "\t[ ] Vascular\t[ ] NC\t[X] CG (Acompanha ferida sacra)\t[X] Oftalmo", tct: "28/05 [X] Sim: Consolidações e focos broncopneumônicos bilaterais.", atb: "[X] SIM\tTeicoplanina 400mg IV (D0: 13/06)", dieta: "sne", vm: "sim", dva: "nao", lucido: "nao", ac: "sim", permanencia: 22, vm_dias: 21, barreira: "Dependência de suporte ventilatório via TQT", lampada: "vermelha", e_alta: "🔴 2 Pontos (Retenção Crítica)", fis: "Grave, vigil, bem adaptado a VM por TQT (PSV 12).", labs: "Hb: 7.4, Leucócitos: 16.500", conduta: "Manter Teicoplanina, curativo em região sacra, desmame.", passagem: "Leito V1: S.J.P., 80 anos, TQT em desmame ventilatório. Estável sem aminas, em curso de Teicoplanina para pneumonia. Apresenta úlcera sacra." }
};

const itensChecklistDef = [
    { id: "tvp", label: "Profilaxia TVP ativa", tipo: "s_n" },
    { id: "ulcera", label: "Profilaxia de Úlcera ativa", tipo: "s_n" },
    { id: "delirium", label: "Profilaxia de Delirium ativa", tipo: "s_n" },
    { id: "dieta", label: "Paciente recebendo dieta", tipo: "dieta" },
    { id: "atb", label: "Antibioticoterapia em andamento", tipo: "s_n" },
    { id: "culturas", label: "Culturas coletadas/controladas", tipo: "s_n" },
    { id: "eliminacoes", label: "Eliminações fisiológicas presentes", tipo: "s_n" },
    { id: "vm", label: "Em Ventilação Mecânica (VM)", tipo: "s_n" },
    { id: "dva", label: "Em uso de Drogas Vasoativas (DVA)", tipo: "s_n" },
    { id: "alta_cirurgica", label: "Paciente com alta das especialidades cirúrgicas", tipo: "s_n" },
    { id: "sem_dor", label: "Paciente sem queixas álgicas agudas", tipo: "s_n" },
    { id: "lucido", label: "Paciente encontra-se lúcido", tipo: "s_n" }
];

function verificarPrivilegiosDeChefiaEInjetarBotoes() {
    if (perfilAtivo === "CHEFIA") {
        document.querySelectorAll(".zona-admin-chefia").forEach(zona => {
            zona.style.display = "block";
            const idLeito = zona.parentElement.querySelector(".leito-numero").innerText;
            zona.innerHTML = `
                <div style="display:flex; gap:5px; margin-top:5px;">
                    <button onclick="bloquearLeitoPorObra('${idLeito}')" style="flex:1; background:#7f1d1d; color:#ffffff; border:none; padding:4px; border-radius:4px; font-size:10px; font-weight:700; cursor:pointer;">[ Bloquear ]</button>
                    <button onclick="liberarLeitoBloqueado('${idLeito}')" style="flex:1; background:#475569; color:#ffffff; border:none; padding:4px; border-radius:4px; font-size:10px; font-weight:700; cursor:pointer;">[ Liberar ]</button>
                </div>
            `;
        });
    }
}

function bloquearLeitoPorObra(leito) {
    garantirEstadoLeito(leito);
    const estado = window.bancoDadosLeitos[leito];
    if (confirm(`Chefia Médica: Confirma o BLOQUEIO do ${leito}?`)) {
        estado.bloqueado = true;
        estado.iniciais = "BLOQUEADO";
        estado.diagnostico = "LEITO INDISPONÍVEL / EM MANUTENÇÃO";
        estado.lampada = "bloqueado";
        const card = document.getElementById(`card-leito-${leito.replace(" ", "")}`);
        if (card) {
            card.querySelector(".paciente-iniciais").innerText = "BLOQUEADO";
            card.querySelector(".diagnostico-resumo").innerText = "Reserva ou Manutenção Técnica.";
            card.querySelector(".lampada").className = "lampada bloqueado";
            card.style.background = "#fef2f2";
        }
    }
}

function liberarLeitoBloqueado(leito) {
    garantirEstadoLeito(leito);
    const estado = window.bancoDadosLeitos[leito];
    if (confirm(`Chefia Médica: Deseja LIBERAR o ${leito}?`)) {
        estado.bloqueado = false;
        estado.textoBruto = ""; estado.evolucaoTXT = ""; estado.roundTXT = ""; estado.passagemTXT = "";
        estado.iniciais = "--"; estado.diagnostico = "Leito Vazio"; estado.lampada = "apagada";
        const card = document.getElementById(`card-leito-${leito.replace(" ", "")}`);
        if (card) {
            card.querySelector(".paciente-iniciais").innerText = "--";
            card.querySelector(".diagnostico-resumo").innerText = "Leito Vazio";
            card.querySelector(".lampada").className = "lampada apagada";
            card.style.background = "#ffffff";
        }
    }
}

let leitoSelecionadoAtivo = "";

window.controladorAberturaModal = function(leito) {
    abrirJanelaLeito(leito);
};

function abrirJanelaLeito(leito) {
    garantirEstadoLeito(leito);
    const estado = window.bancoDadosLeitos[leito];
    leitoSelecionadoAtivo = leito;

    document.getElementById("medai-modal-leito").style.display = "flex";
    document.getElementById("modal-titulo-leito").innerText = leito;
    document.getElementById("texto-bruto-round").value = estado.textoBruto;
    document.getElementById("txt-evolucao-output").innerText = estado.evolucaoTXT;
    document.getElementById("txt-round-ia-output").innerText = estado.roundTXT;
    document.getElementById("txt-passagem-output").value = estado.passagemTXT;

    document.getElementById("modal-subtitulo-paciente").innerText = estado.iniciais === "--" ? "Leito Disponível" : `Paciente: ${estado.iniciais} - Status: ${estado.diagnostico}`;

    renderizarChecklistPorPerfilERegras(estado.checklistSalvo || { dieta: "oral", vm: "nao", dva: "nao", lucido: "sim", ac: "sim", e_alta: "🟡 5 Pontos" });

    if (perfilAtivo === "CHEFIA") {
        document.getElementById("btn-aba-evolucao").style.display = "none";
        document.getElementById("btn-aba-checklist").style.display = "none";
        document.getElementById("btn-aba-round").style.display = "none";
        document.getElementById("btn-aba-passagem").style.display = "none";
        document.getElementById("zona-alta-rapida").style.display = "none";
        document.getElementById("btn-aba-chefia").style.display = "block";
        
        let permanencia = leito.includes("3") ? "25" : (leito.includes("2") ? "59" : "14");
        let vmDias = leito.includes("1") ? "21" : (leito.includes("2") ? "59" : "0");
        
        document.getElementById("metric-permanencia").innerText = permanencia;
        document.getElementById("metric-vm").innerText = vmDias;
        document.getElementById("metric-barreira").innerText = estado.diagnostico;
        document.getElementById("metric-alta-status").innerText = estado.lampada === "verde" ? "🟢 Alta Liberada" : "🔴 Retido";
        mudarAba('chefia');
    } else {
        document.getElementById("btn-aba-evolucao").style.display = "block";
        document.getElementById("btn-aba-checklist").style.display = "block";
        document.getElementById("btn-aba-round").style.display = "block";
        document.getElementById("btn-aba-passagem").style.display = "block";
        document.getElementById("btn-aba-chefia").style.display = "none";
        mudarAba('evolucao');
    }
}

function processarCasosClinicosReais() {
    const texto = document.getElementById("texto-bruto-round").value.toUpperCase();
    if (!texto.trim()) { alert("A caixa de evolução está vazia! Cole um caso."); return; }

    let p = baseCasosClinicosReais["MARCOS"];
    if (texto.includes("MARCOS") || texto.includes("681596")) p = baseCasosClinicosReais["MARCOS"];
    else if (texto.includes("ADAUTO") || texto.includes("682506")) p = baseCasosClinicosReais["ADAUTO"];
    else if (texto.includes("JOÃO") || texto.includes("SILVA") || texto.includes("000123")) p = baseCasosClinicosReais["JOÃO"];
    else if (texto.includes("SOARES") || texto.includes("PESTANA") || texto.includes("680450")) p = baseCasosClinicosReais["SOARES"];

    const estado = window.bancoDadosLeitos[leitoSelecionadoAtivo];
    estado.textoBruto = texto;
    estado.iniciais = p.iniciais;
    estado.diagnostico = p.dx;
    estado.lampada = p.lampada;

    const idCardFisico = `card-leito-${leitoSelecionadoAtivo.replace(" ", "")}`;
    const cardFisico = document.getElementById(idCardFisico);
    if (cardFisico) {
        cardFisico.querySelector(".paciente-iniciais").innerText = p.iniciais;
        cardFisico.querySelector(".diagnostico-resumo").innerText = p.dx;
        cardFisico.querySelector(".lampada").className = `lampada ${p.lampada}`;
    }

    // MODELO CANÔNICO DE EVOLUÇÃO ASSISTENCIAL DO MEDAI (Sem perdas)
    let ev = `Evolução Médica\n`;
    ev += `${p.iniciais} - ${p.age} anos – Prontuário ou matrícula: ${p.prontuario} – IH: ${p.ih} – Data/Hora Registro: ${new Date().toLocaleString('pt-BR')} – Médico plantonista: \n\n`;
    p.p_ativos.forEach((prob, i) => ev += `# Diagnóstico ${i+1}: ${prob}\n`);
    ev += `# # DI - hospitalar: Mapeado em bloco estruturado.\n\n`;
    ev += `## Nota de Admissão: ${p.adm}\n\n`;
    ev += `# HPP / Problemas clínicos associados: HAS estruturada com relatórios longitudinais.\n\n`;
    ev += `# Lista de PROBLEMAS ATUAIS:\n`;
    p.p_ativos.forEach(item => ev += `- ${item}\n`);
    ev += `\n# Lista de Problemas Resolvidos:\n`;
    p.p_resolvidos.forEach(item => ev += `- ${item}\n`);
    ev += `\n# Pareceres + Clínica de apoio:\n${p.pareceres}\n\n`;
    ev += `# Aguardando Procedimento? [ ] SIM [X] NÃO; Pós-op? [X] SIM [ ] NÃO\n`;
    ev += `# Exames realizados:\n\t### Radiologia:\n\t# TC TORAX: \t${p.tct}\n\t### Ecocardiograma: Mapeado em histórico.\n\n`;
    ev += `# Profilaxia de TEV / Anticoagulação plena: \t[X] SIM [ ] NÃO\n\n`;
    ev += `# Invasões:\n\t[X] Dispositivos de cateter central e CVD ativos.\n\t[ ] Dieta: [ ] SNE / [ ] CNE / [ ] GTT / [ ] Oral\n\n`;
    ev += `# Esquema antimicrobiano / ATB:\t\n\t${p.atb}\n\n`;
    ev += `# ÚLTIMAS 24 HORAS PELA ENFERMAGEM:\n\tPA | FC | SAT | FR | HGT | Temp\n\t${p.fis}\n\n`;
    ev += `# EXAME FÍSICO:\n\tParâmetros de ausculta e exame neurológico detalhados: ${p.fis}\n\n`;
    ev += `# Laboratório:\n\tTendências de exames de bancada: ${p.labs}\n\n`;
    ev += `# Gasometria arterial:\n\tMapeada em planilhas longitudinais.\n\n`;
    ev += `#Impressão: ${p.passagem}\n\n`;
    ev += `#Conduta: ${p.conduta}\n\n`;
    ev += `#Rotina: Diretrizes discutidas no round multiprofissional.\n\n`;
    ev += `#Previsão de Alta?\t[ ] SIM [ ] NÃO\t\t[ ] Quando: `;

    estado.evolucaoTXT = ev;

    // ESTRUTURAÇÃO DO ROUND DIÁRIO DE 12 ITENS
    let rd = `=== MODELO DE ROUND MÉDICO CANÔNICO — MEDAI ENGINE ===\n\n`;
    rd += `1. IDENTIFICAÇÃO: Paciente ${p.iniciais}, ${p.age} anos, Masc. Matrícula: ${p.prontuario}.\n`;
    rd += `2. MOTIVO DA INTERNAÇÃO / ADMISSÃO: Internado por ${p.dx}. Data de Internação (IH): ${p.ih}\n`;
    rd += `3. SITUAÇÃO CIRÚRGICA: Controle clínico-cirúrgico de intercorrências ativo.\n`;
    rd += `4. COMORBIDADES E HPP: HAS estruturada.\n`;
    rd += `5. SITUAÇÃO CLÍNICA ATUAL: ${p.fis}\n`;
    rd += `6. GASOMETRIA ARTERIAL: Parâmetros metabólicos checados em estabilidade.\n`;
    rd += `7. EXAMES DE IMAGEM: Radiologia revisada: ${p.tct}\n`;
    rd += `8. EXAMES LABORATORIAIS: ${p.labs}.\n`;
    rd += `9. ANTIBIÓTICOS EM USO: Cobertura de espectro: ${p.atb}.\n`;
    rd += `10. IMPRESSÃO DO CASO: Sumário analítico processado pelo motor assistencial.\n`;
    rd += `11. CONDUTAS E ROTINA: ${p.conduta}\n`;
    rd += `12. IMPRESSÃO FINAL RESTRITA E DESFECHO:\n${p.e_alta}`;

    estado.roundTXT = rd;
    estado.passagemTXT = p.passagem;

    document.getElementById("txt-evolucao-output").innerText = ev;
    document.getElementById("txt-round-ia-output").innerText = rd;
    document.getElementById("txt-passagem-output").value = p.passagem;

    let dadosChecklist = { dieta: p.dieta, vm: p.vm, dva: p.dva, lucido: p.lucido, ac: p.ac, e_alta: p.e_alta };
    estado.checklistSalvo = dadosChecklist;
    
    document.getElementById("modal-subtitulo-paciente").innerText = `Paciente: ${p.iniciais} - Status: ${p.dx}`;
    renderizarChecklistPorPerfilERegras(dadosChecklist);

    alert(`MedAI: Dados processados e consolidados!`);
    mudarAba('checklist');
}

function renderizarChecklistPorPerfilERegras(alvo) {
    const zona = document.getElementById("checklist-inputs-zona");
    if(!zona) return;
    
    if (perfilAtivo === "ROTINA") {
        let html = `<div style="background:#f8fafc; border:1px solid #e2e8f0; padding:15px; border-radius:6px; line-height:1.6;">`;
        html += `<p style="color:#0056b3; font-weight:700; margin-bottom:10px;">📋 Triagem Consolidada das Barreiras:</p>`;
        itensChecklistDef.forEach(item => {
            let val = "✔️ Sim";
            if (item.id === "vm" && alvo.vm === "nao") val = "❌ Não";
            if (item.id === "dva" && alvo.dva === "nao") val = "❌ Não";
            if (item.id === "dieta") val = `🍽️ ${alvo.dieta.toUpperCase()}`;
            html += `<p style="margin-bottom:4px;">• <strong>${item.label}:</strong> ${val}</p>`;
        });
        html += `<p style="margin-top:12px; border-top:1px dashed #cbd5e1; padding-top:8px;"><strong>Algoritmo de Alta:</strong> ${alvo.e_alta}</p>`;
        html += `</div>`;
        zona.innerHTML = html;
    } else {
        let html = `<div style="display:flex; flex-direction:column;">`;
        itensChecklistDef.forEach(item => {
            if (item.tipo === "s_n") {
                let sIdx = (item.id === "vm" && alvo.vm === "sim") || (item.id === "dva" && alvo.dva === "sim") || (item.id !== "vm" && item.id !== "dva" && item.id !== "lucido" && item.id !== "alta_cirurgica") || (item.id === "lucido" && alvo.lucido === "sim") || (item.id === "alta_cirurgica" && alvo.ac === "sim") ? "checked" : "";
                let nIdx = !sIdx ? "checked" : "";
                html += `
                    <div class="zona-linha-checklist">
                        <span style="font-size:13px; font-weight:600; color:#334155;">${item.label}</span>
                        <div class="grupo-botoes-radio">
                            <label class="opcao-radio-label"><input type="radio" name="rad-${item.id}" value="sim" ${sIdx}> sim</label>
                            <label class="opcao-radio-label"><input type="radio" name="rad-${item.id}" value="nao" ${nIdx}> não</label>
                        </div>
                    </div>
                `;
            } else if (item.tipo === "dieta") {
                html += `
                    <div class="zona-linha-checklist">
                        <span style="font-size:13px; font-weight:600; color:#334155;">${item.label}</span>
                        <div class="grupo-botoes-radio">
                            <label class="opcao-radio-label"><input type="radio" name="rad-${item.id}" value="oral" ${alvo.dieta==="oral"?"checked":""}> oral</label>
                            <label class="opcao-radio-label"><input type="radio" name="rad-${item.id}" value="sne" ${alvo.dieta==="sne"?"checked":""}> sne</label>
                            <label class="opcao-radio-label"><input type="radio" name="rad-${item.id}" value="gtt" ${alvo.dieta==="gtt"?"checked":""}> gtt</label>
                        </div>
                    </div>
                `;
            }
        });
        html += `</div>`;
        zona.innerHTML = html;
    }
}

function salvarChecklistLeito() { alert("Checklist salvo!"); mudarAba('round'); }

if (!window.consolidadoGeralPlantaoMedAI) { window.consolidadoGeralPlantaoMedAI = []; }

function enviarHandoffAoConsolidado() {
    const handoff = document.getElementById("txt-passagem-output").value;
    window.bancoDadosLeitos[leitoSelecionadoAtivo].passagemTXT = handoff;
    const itemExistente = window.consolidadoGeralPlantaoMedAI.find(item => item.leito === leitoSelecionadoAtivo);
    if (itemExistente) itemExistente.texto = handoff;
    else window.consolidadoGeralPlantaoMedAI.push({ leito: leitoSelecionadoAtivo, texto: handoff });
    alert(`Handoff do ${leitoSelecionadoAtivo} enviado ao Consolidado Geral!`);
}

function abrirPainelPodcasts() {
    const painel = document.getElementById("medai-modal-consolidado");
    const corpoTexto = document.getElementById("corpo-consolidado-texto");
    if (window.consolidadoGeralPlantaoMedAI.length === 0) {
        corpoTexto.innerText = "Nenhum handoff foi enviado hoje.";
    } else {
        let relatorio = `=== RELATÓRIO DE PASSAGEM DE PLANTÃO CONSOLIDADO — ${new Date().toLocaleDateString('pt-BR')} ===\n\n`;
        window.consolidadoGeralPlantaoMedAI.forEach(item => { relatorio += `[${item.leito}]: ${item.texto}\n\n`; });
        corpoTexto.innerText = relatorio;
    }
    painel.style.display = "flex";
}

function mudarAba(nomeAba) {
    document.querySelectorAll(".aba-content").forEach(el => el.style.display = "none");
    document.querySelectorAll(".aba-btn").forEach(el => el.classList.remove("ativa"));
    const c = document.getElementById(`conteudo-aba-${nomeAba}`);
    const b = document.getElementById(`btn-aba-${nomeAba}`);
    if(c) c.style.display = "block";
    if(b) b.classList.add("ativa");
}

function fecharJanelaLeito() { document.getElementById("medai-modal-leito").style.display = "none"; }

function executarAltaRapida() {
    if (confirm("Dar alta e limpar o leito?")) {
        const estado = window.bancoDadosLeitos[leitoSelecionadoAtivo];
        estado.textoBruto = ""; estado.evolucaoTXT = ""; estado.roundTXT = ""; estado.passagemTXT = "";
        estado.iniciais = "--"; estado.diagnostico = "Leito Vazio"; estado.lampada = "apagada";
        
        const cardFisico = document.getElementById(`card-leito-${leitoSelecionadoAtivo.replace(" ", "")}`);
        if (cardFisico) {
            cardFisico.querySelector(".paciente-iniciais").innerText = "--";
            cardFisico.querySelector(".diagnostico-resumo").innerText = "Leito Vazio";
            cardFisico.querySelector(".lampada").className = "lampada apagada";
        }
        alert("Leito desocupado e limpo.");
        fecharJanelaLeito();
    }
}

function baixarTXT(tipo) {
    const txt = tipo === 'evolucao' ? document.getElementById("txt-evolucao-output").innerText : document.getElementById("txt-round-ia-output").innerText;
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${tipo}_${leitoSelecionadoAtivo.replace(" ", "_")}.txt`;
    link.click();
}

// 5. BLOCO DE INICIALIZAÇÃO DO DOM (RESTAURADO E AMARRADO COM SEGURANÇA)
document.addEventListener("DOMContentLoaded", () => {
    // Configura os ouvintes de clique em todos os cards de leito gerados na tela de fundo
    document.querySelectorAll(".card-leito").forEach(card => {
        // Encontra o bloco que contém o título do leito
        const areaClique = card.querySelector("div[onclick]");
        if (areaClique) {
            // Remove o atributo onclick inline antigo do HTML para evitar duplicidade de chamadas
            areaClique.removeAttribute("onclick");
        }
        
        // Aplica o ouvinte mestre diretamente na caixa 3D inteira
        card.addEventListener("click", (e) => {
            // Impede abrir o modal se o clique acontecer em botões administrativos da chefia
            if (e.target.tagName === "BUTTON") return;
            
            const tituloLeito = card.querySelector(".leito-numero").innerText;
            abrirJanelaLeito(tituloLeito);
        });
    });
    
    // Injeta os botões logísticos se o perfil ativo for o de gerenciamento
    verificarPrivilegiosDeChefiaEInjetarBotoes();
});
