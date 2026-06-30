/**
 * MedAI — Core Frontend Engine (v0.6) - SISTEMA OPERACIONAL ASSISTENCIAL
 * Fluxo de Trabalho, Assinatura Hierárquica e Controle de Leitos integrado.
 */

const perfilAtivo = sessionStorage.getItem('medai_perfil') || 'MEDICO';
const usuarioNome = sessionStorage.getItem('medai_usuario_nome') || 'Profissional';

// Quantidades iniciais de leitos padrão
let totalLeitosVermelha = 11;
let totalLeitosTrauma = 6;

if (!window.bancoDadosLeitos) {
    window.bancoDadosLeitos = {};
}

function garantirEstadoLeito(leito) {
    if (!window.bancoDadosLeitos[leito]) {
        window.bancoDadosLeitos[leito] = {
            textoBruto: "",
            evolucaoTXT: "Aguardando processamento assistencial do turno...",
            roundTXT: "Aguardando conferência de indicadores...",
            passagemTXT: "Aguardando consolidação do handoff de transmissão...",
            checklistSalvo: null,
            iniciais: "--",
            diagnostico: "Leito Vazio",
            lampada: "apagada",
            bloqueado: false,
            statusDocumento: "Vazio", // Vazio, Rascunho, Aprovado
            supervisorAprovador: ""
        };
    }
}

// Injeção dinâmica da estrutura HTML dos modais assistenciais no body da página
const interfaceEstruturaHTML = `
    <div id="medai-modal-leito" style="display:none; position:fixed; top:0; right:0; width:620px; height:100vh; background:#ffffff; box-shadow:-5px 0 25px rgba(0,0,0,0.15); border-left:1px solid #e2e8f0; z-index:9999; padding:25px; display:flex; flex-direction:column;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #f1f5f9; padding-bottom:15px; margin-bottom:15px;">
            <div>
                <h2 id="modal-titulo-leito" style="color:#0056b3; font-size:20px;">Leito</h2>
                <p id="modal-subtitulo-paciente" style="font-size:14px; color:#64748b; font-weight:600;"></p>
                <div id="status-documento-badge" style="margin-top:5px; font-size:11px; display:inline-block; padding:2px 6px; border-radius:4px; font-weight:bold;">Status: Vazio</div>
            </div>
            <button onclick="fecharJanelaLeito()" style="background:#64748b; color:#ffffff; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; font-weight:600; margin-left:auto;">Fechar</button>
        </div>

        <div id="medai-abas-menu" style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">
            <button class="aba-btn" id="btn-aba-evolucao" onclick="mudarAba('evolucao')">1. Entrada Clínico</button>
            <button class="aba-btn" id="btn-aba-checklist" onclick="mudarAba('checklist')">2. Checklist Diário</button>
            <button class="aba-btn" id="btn-aba-round" onclick="mudarAba('round')">3. Round/Discussão</button>
            <button class="aba-btn" id="btn-aba-passagem" onclick="mudarAba('passagem')">4. Passagem Turno</button>
            <button class="aba-btn" id="btn-aba-chefia" onclick="mudarAba('chefia')" style="display:none; color:#f59e0b; font-weight:700;">Direção Macro</button>
        </div>

        <div style="flex:1; overflow-y:auto; font-size:14px; color:#334155; padding-right:5px;">
            <div id="conteudo-aba-evolucao" class="aba-content">
                <h4 style="margin-bottom:10px; color:#1e293b;">Evolução / Entrada de Histórias Clínicas</h4>
                <textarea id="texto-bruto-round" placeholder="Cole ou digite aqui a evolução clínica bruta do leito..." style="width:100%; height:180px; padding:10px; border:1px solid #cbd5e1; border-radius:6px; resize:none; font-family:monospace; font-size:11px; line-height:1.4; background:#fafafa; margin-bottom:12px;"></textarea>
                
                <div style="display:flex; gap:10px; margin-bottom:15px;">
                    <button id="btn-processar-ia" class="btn-acao-principal" onclick="processarCasosClinicosReais()" style="flex:1; background:#10b981; color:white; border:none; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer;">⚡ Salvar e Reorganizar via AI</button>
                    <button onclick="alert('Microfone ativado! Capturando áudio ambiental do leito... (Simulação)')" style="background:#0056b3; color:white; border:none; padding:0 15px; border-radius:6px; cursor:pointer;">🎤</button>
                </div>

                <h5 style="margin-bottom:8px; color:#475569; font-size:11px; text-transform:uppercase;">Visualização Técnica (Estrutura Canônica)</h5>
                <pre id="txt-evolucao-output" style="background:#f8fafc; padding:12px; border:1px solid #e2e8f0; border-radius:6px; white-space:pre-wrap; word-wrap:break-word; font-family:monospace; font-size:11px; color:#0f172a; line-height:1.4; max-height:200px; overflow-y:auto; margin-bottom:10px;"></pre>
                <button class="btn-acao-principal" onclick="baixarTXT('evolucao')" style="background:#475569; color:white; border:none; padding:8px; border-radius:4px; font-size:12px; cursor:pointer;">Baixar Evolução (.TXT)</button>
            </div>

            <div id="conteudo-aba-checklist" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:15px; color:#1e293b;">Checklist de Barreiras Logísticas</h4>
                <div id="checklist-inputs-zona"></div>
                <button id="btn-salvar-checklist" class="btn-acao-principal" onclick="salvarChecklistLeito()" style="background:#0056b3; color:white; border:none; padding:10px; width:100%; border-radius:6px; font-weight:bold; margin-top:20px; cursor:pointer;">Confirmar Barreiras do Turno</button>
            </div>

            <div id="conteudo-aba-round" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:10px; color:#1e293b;">12 Itens do Round Multiprofissional</h4>
                <pre id="txt-round-ia-output" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:15px; font-family:monospace; font-size:11px; line-height:1.4; color:#1e293b; white-space:pre-wrap; max-height:320px; overflow-y:auto;"></pre>
                
                <div id="zona-assinatura-hierarquica" style="margin-top:15px; padding:15px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; display:none;">
                    <p style="font-size:12px; color:#166534; margin-bottom:8px;">⚠️ <strong>Validação Necessária:</strong> Documento gerado por Acadêmico precisa de liberação do Supervisor.</p>
                    <div style="display:flex; gap:10px;">
                        <input type="password" id="pin-supervisor" placeholder="Digite o PIN de Liberação (Ex: 1234)" style="padding:6px; border:1px solid #cbd5e1; border-radius:4px; flex:1;">
                        <button onclick="validarAssinaturaSupervisor()" style="background:#166534; color:white; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">Aprovar Caso</button>
                    </div>
                </div>
            </div>

            <div id="conteudo-aba-passagem" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:10px; color:#1e293b;">Handoff de Transmissão Técnico</h4>
                <textarea id="txt-passagem-output" style="width:100%; height:120px; font-style:italic; line-height:1.5; color:#1e3a8a; font-size:13px; border:1px solid #bfdbfe; background:#eff6ff; border-radius:6px; resize:none; padding:10px; font-family:sans-serif; margin-bottom:15px;"></textarea>
                <button class="btn-acao-principal" onclick="enviarHandoffAoConsolidado()" style="background:#2563eb; color:white; border:none; padding:10px; width:100%; border-radius:6px; font-weight:bold; cursor:pointer; margin-bottom:12px;">Enviar ao Consolidado de Passagem</button>
                <button class="btn-acao-principal" onclick="abrirPainelPodcasts()" style="background:#475569; color:white; border:none; padding:10px; width:100%; border-radius:6px; font-weight:bold; cursor:pointer;">Ver Consolidado Geral (Playlist de Áudio)</button>
            </div>

            <div id="conteudo-aba-chefia" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:15px; color:#92400e;">Métricas Macrologísticas do Leito</h4>
                <div style="background:#fffbeb; border:1px solid #fde68a; padding:15px; border-radius:6px; font-size:13px;">
                    <p style="margin-bottom:10px;"><strong>Gargalo Operacional:</strong> <span id="metric-barreira" style="color:#dc3545; font-weight:bold;">--</span></p>
                    <p style="margin-bottom:10px;"><strong>Tempo de Permanência Computado:</strong> <span id="metric-permanencia" style="font-weight:700; color:#b45309;">--</span> dias</p>
                    <p style="margin-bottom:10px;"><strong>Tempo total sob VM:</strong> <span id="metric-vm" style="font-weight:700;">--</span> dias</p>
                    <p style="margin-bottom:5px;"><strong>Escore Preditivo de Alta:</strong> <span id="metric-alta-status" style="font-weight:700;">--</span></p>
                </div>
            </div>
        </div>

        <div id="zona-alta-rapida" style="border-top:1px solid #e2e8f0; padding-top:15px; margin-top:15px;">
            <button onclick="executarAltaRapida()" style="background:#dc3545; color:#ffffff; border:none; padding:10px 15px; border-radius:6px; font-weight:700; cursor:pointer; width:100%;">[ Arquivar Prontuário / Liberar Alta ]</button>
        </div>
    </div>

    <div id="medai-modal-consolidado" style="display:none; position:fixed; top:10%; left:25%; width:50%; height:75vh; background:#ffffff; box-shadow:0 10px 40px rgba(0,0,0,0.3); border-radius:8px; z-index:10000; padding:30px; flex-direction:column; border:1px solid #cbd5e1;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #f1f5f9; padding-bottom:15px; margin-bottom:15px;">
            <h3 style="color:#1e3a8a;">Passagem de Plantão Consolidada</h3>
            <button onclick="document.getElementById('medai-modal-consolidado').style.display='none'" style="background:#ef4444; color:#ffffff; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; font-weight:600;">Fechar</button>
        </div>
        <div id="corpo-consolidado-texto" style="flex:1; overflow-y:auto; background:#f8fafc; padding:20px; font-family:monospace; font-size:12px; white-space:pre-wrap; border-radius:6px; border:1px solid #e2e8f0;"></div>
        <button class="btn-acao-principal" onclick="alert('Iniciando síntese de voz (TTS)... Gerando playlist compacta do turno.')" style="background:#10b981; color:white; border:none; padding:12px; border-radius:6px; font-weight:bold; margin-top:15px; cursor:pointer;">▶️ Executar Playlist de Áudio do Turno</button>
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
    { id: "alta_cirurgica", label: "Paciente com alta das especialidades cirúrgicas", tipo: "s_n" }
];

// REQUISITO DA CHEFIA: GERENCIAMENTO DINÂMICO DA QUANTIDADE DE LEITOS NA TELA
function renderizarMalhaLeitosGeral() {
    const containerVermelha = document.getElementById('grid-vermelha');
    const containerTrauma = document.getElementById('grid-trauma');
    
    if(!containerVermelha || !containerTrauma) return;

    containerVermelha.innerHTML = '';
    containerTrauma.innerHTML = '';

    // Renderiza Sala Vermelha
    for (let i = 1; i <= totalLeitosVermelha; i++) {
        const idLeito = `V${i}`;
        garantirEstadoLeito(idLeito);
        const estado = window.bancoDadosLeitos[idLeito];
        
        let backgroundCard = estado.bloqueado ? "#fef2f2" : "#ffffff";

        containerVermelha.innerHTML += `
            <div class="card-leito" id="card-leito-V${i}" style="background: ${backgroundCard};">
                <div class="lampada ${estado.lampada}"></div>
                <div style="cursor:pointer;" onclick="window.controladorAberturaModal('V${i}')">
                    <div class="leito-numero">Leito V${i}</div>
                    <div class="paciente-iniciais">${estado.iniciais}</div>
                    <div class="diagnostico-resumo">${estado.diagnostico}</div>
                </div>
                <div class="zona-admin-chefia" style="margin-top:5px; border-top:1px solid #f1f5f9; padding-top:5px; display: ${perfilAtivo === 'CHEFIA' ? 'block' : 'none'};">
                    <div style="display:flex; gap:5px;">
                        <button onclick="bloquearLeitoPorObra('V${i}')" style="flex:1; background:#7f1d1d; color:white; border:none; padding:4px; border-radius:4px; font-size:10px; font-weight:bold; cursor:pointer;">Bloquear</button>
                        <button onclick="liberarLeitoBloqueado('V${i}')" style="flex:1; background:#475569; color:white; border:none; padding:4px; border-radius:4px; font-size:10px; font-weight:bold; cursor:pointer;">Liberar</button>
                    </div>
                </div>
            </div>`;
    }

    // Renderiza Trauma
    for (let i = 1; i <= totalLeitosTrauma; i++) {
        const idLeito = `T${i}`;
        garantirEstadoLeito(idLeito);
        const estado = window.bancoDadosLeitos[idLeito];
        
        let backgroundCard = estado.bloqueado ? "#fef2f2" : "#ffffff";

        containerTrauma.innerHTML += `
            <div class="card-leito" id="card-leito-T${i}" style="background: ${backgroundCard};">
                <div class="lampada ${estado.lampada}"></div>
                <div style="cursor:pointer;" onclick="window.controladorAberturaModal('T${i}')">
                    <div class="leito-numero">Leito T${i}</div>
                    <div class="paciente-iniciais">${estado.iniciais}</div>
                    <div class="diagnostico-resumo">${estado.diagnostico}</div>
                </div>
                <div class="zona-admin-chefia" style="margin-top:5px; border-top:1px solid #f1f5f9; padding-top:5px; display: ${perfilAtivo === 'CHEFIA' ? 'block' : 'none'};">
                    <div style="display:flex; gap:5px;">
                        <button onclick="bloquearLeitoPorObra('T${i}')" style="flex:1; background:#7f1d1d; color:white; border:none; padding:4px; border-radius:4px; font-size:10px; font-weight:bold; cursor:pointer;">Bloquear</button>
                        <button onclick="liberarLeitoBloqueado('T${i}')" style="flex:1; background:#475569; color:white; border:none; padding:4px; border-radius:4px; font-size:10px; font-weight:bold; cursor:pointer;">Liberar</button>
                    </div>
                </div>
            </div>`;
    }
    
    atualizarContadoresMacro();
}

function adicionarLeitoDinamico(setor) {
    if (setor === 'V') totalLeitosVermelha++;
    else totalLeitosTrauma++;
    renderizarMalhaLeitosGeral();
}

function removerUltimoLeitoDinamico() {
    if (confirm("Deseja remover o último leito das listas estruturadas?")) {
        if (totalLeitosTrauma > 0) totalLeitosTrauma--;
        else if (totalLeitosVermelha > 0) totalLeitosVermelha--;
        renderizarMalhaLeitosGeral();
    }
}

function atualizarContadoresMacro() {
    let ocupados = 0;
    let bloqueados = 0;
    let vazios = 0;

    Object.keys(window.bancoDadosLeitos).forEach(k => {
        const o = window.bancoDadosLeitos[k];
        if (o.bloqueado) bloqueados++;
        else if (o.iniciais === "--") vazios++;
        else ocupados++;
    });

    const elem = document.getElementById("contadores-macro");
    if(elem) {
        elem.innerHTML = `Ocupados: <strong>${ocupados}</strong> | Livres: <strong>${vazios}</strong> | Interditados: <strong>${bloqueados}</strong>`;
    }
}

function bloquearLeitoPorObra(leito) {
    garantirEstadoLeito(leito);
    const estado = window.bancoDadosLeitos[leito];
    if (confirm(`Direção Médica: Confirma o BLOQUEIO do Leito ${leito}? (Manutenção, Infiltração ou Quebra de Ventilador)`)) {
        estado.bloqueado = true;
        estado.iniciais = "BLOQUEADO";
        estado.diagnostico = "LEITO INDISPONÍVEL / EM MANUTENÇÃO TECNICA";
        estado.lampada = "bloqueado";
        renderizarMalhaLeitosGeral();
    }
}

function liberarLeitoBloqueado(leito) {
    garantirEstadoLeito(leito);
    const estado = window.bancoDadosLeitos[leito];
    if (confirm(`Direção Médica: Deseja LIBERAR e desimpedir o Leito ${leito}?`)) {
        estado.bloqueado = false;
        estado.textoBruto = ""; estado.evolucaoTXT = ""; estado.roundTXT = ""; estado.passagemTXT = "";
        estado.iniciais = "--"; estado.diagnostico = "Leito Vazio"; estado.lampada = "apagada";
        estado.statusDocumento = "Vazio";
        renderizarMalhaLeitosGeral();
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
    document.getElementById("modal-titulo-leito").innerText = `Leito ${leito}`;
    document.getElementById("texto-bruto-round").value = estado.textoBruto;
    document.getElementById("txt-evolucao-output").innerText = estado.evolucaoTXT;
    document.getElementById("txt-round-ia-output").innerText = estado.roundTXT;
    document.getElementById("txt-passagem-output").value = estado.passagemTXT;

    // Atualiza a visualização do badge de status do documento clínico
    const badge = document.getElementById("status-documento-badge");
    badge.innerText = `Status: ${estado.statusDocumento.toUpperCase()}`;
    if(estado.statusDocumento === 'Aprovado') {
        badge.style.background = '#d1fae5'; badge.style.color = '#065f46';
    } else if(estado.statusDocumento === 'Rascunho') {
        badge.style.background = '#fef3c7'; badge.style.color = '#92400e';
    } else {
        badge.style.background = '#e2e8f0'; badge.style.color = '#475569';
    }

    document.getElementById("modal-subtitulo-paciente").innerText = estado.iniciais === "--" ? "Leito Disponível" : `Paciente: ${estado.iniciais} - Diagnóstico: ${estado.diagnostico}`;

    renderChecklistInputs(estado.checklistSalvo || { dieta: "oral", vm: "nao", dva: "nao", lucido: "sim", ac: "sim", e_alta: "🟡 Sem cálculo" });

    // HIERARQUIA DE VISÃO POR PERFIL ASSISTENCIAL
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
        document.getElementById("metric-alta-status").innerText = estado.lampada === "verde" ? "🟢 Alta Liberada" : "🔴 Retido Logístico";
        mudarAba('chefia');
    } else {
        document.getElementById("btn-aba-evolucao").style.display = "block";
        document.getElementById("btn-aba-checklist").style.display = "block";
        document.getElementById("btn-aba-round").style.display = "block";
        document.getElementById("btn-aba-passagem").style.display = "block";
        document.getElementById("btn-aba-chefia").style.display = "none";
        
        // Exibe zona de aprovação apenas se for rascunho de estudante sendo aberto por médico supervisor
        const zonaAssinatura = document.getElementById("zona-assinatura-hierarquica");
        if(estado.statusDocumento === "Rascunho" && (perfilAtivo === "MEDICO" || perfilAtivo === "ROTINA")) {
            zonaAssinatura.style.display = "block";
        } else {
            zonaAssinatura.style.display = "none";
        }
        
        mudarAba('evolucao');
    }
}

function processarCasosClinicosReais() {
    const texto = document.getElementById("texto-bruto-round").value.toUpperCase();
    if (!texto.trim()) { alert("Por favor, digite ou cole um resumo evolutivo médico!"); return; }

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

    // TRAVA DE SEGURANÇA PEDAGÓGICA E JURÍDICA
    if(perfilAtivo === "STUDENT") {
        estado.statusDocumento = "Rascunho";
    } else {
        estado.statusDocumento = "Aprovado";
    }

    // MONTAGEM CANÔNICA DA EVOLUÇÃO ASSISTENCIAL DO MEDAI (Sem perdas)
    let ev = `Evolução Médica Estruturada\n`;
    ev += `${p.iniciais} - ${p.age} anos – Matrícula: ${p.prontuario} – IH: ${p.ih} – Registro: ${new Date().toLocaleString('pt-BR')} \n\n`;
    p.p_ativos.forEach((prob, i) => ev += `# Diagnóstico ${i+1}: ${prob}\n`);
    ev += `\n# Pareceres Médicos de Apoio:\n${p.pareceres}\n\n`;
    ev += `# Exames Realizados:\n\t# TC TORAX/LAUDO: \t${p.tct}\n\n`;
    ev += `# Esquema de Antibioticoterapia (ATB):\t\n\t${p.atb}\n\n`;
    ev += `# Sinais Vitais (Últimas 24h):\n\t${p.fis}\n\n`;
    ev += `# Tendências de Laboratório:\n\t${p.labs}\n\n`;
    ev += `# Impressão Final do Turno: ${p.passagem}\n\n`;
    ev += `# Conduta Médica Proposta: ${p.conduta}\n`;

    estado.evolucaoTXT = ev;

    // ESTRUTURAÇÃO DO ROUND DIÁRIO CANÔNICO DE 12 ITENS
    let rd = `=== MODELO DE ROUND MÉDICO CANÔNICO — MEDAI ENGINE ===\n\n`;
    rd += `1. IDENTIFICAÇÃO: Paciente ${p.iniciais}, ${p.age} anos, Matrícula: ${p.prontuario}.\n`;
    rd += `2. MOTIVO DA INTERNAÇÃO: ${p.dx}.\n`;
    rd += `3. SITUAÇÃO CIRÚRGICA: Controle clínico-cirúrgico de intercorrências ativo.\n`;
    rd += `4. COMORBIDADES DO HISTÓRICO: HAS e comorbidades vasculares associadas.\n`;
    rd += `5. SITUAÇÃO CLÍNICA ATUAL: ${p.fis}\n`;
    rd += `6. GASOMETRIA ARTERIAL: Parâmetros metabólicos checados em estabilidade.\n`;
    rd += `7. EXAMES DE IMAGEM: Radiologia revisada: ${p.tct}\n`;
    rd += `8. EXAMES LABORATORIAIS: ${p.labs}.\n`;
    rd += `9. ANTIBIÓTICOS EM USO: Cobertura de espectro: ${p.atb}.\n`;
    rd += `10. IMPRESSÃO DO CASO: Processado assistencial Pepper Potts.\n`;
    rd += `11. CONDUTAS E ROTINA: ${p.conduta}\n`;
    rd += `12. IMPRESSÃO FINAL E DESFECHO: ${p.e_alta}`;

    estado.roundTXT = rd;
    estado.passagemTXT = p.passagem;

    document.getElementById("txt-evolucao-output").innerText = ev;
    document.getElementById("txt-round-ia-output").innerText = rd;
    document.getElementById("txt-passagem-output").value = p.passagem;

    let dadosChecklist = { dieta: p.dieta, vm: p.vm, dva: p.dva, lucido: p.lucido, ac: p.ac, e_alta: p.e_alta };
    estado.checklistSalvo = dadosChecklist;
    
    renderizarMalhaLeitosGeral();
    alert(`MedAI Engine: Dados organizados com sucesso! Siga para a próxima aba de Checklist.`);
    
    // Força avanço do fluxo de trabalho clínico automático
    abrirJanelaLeito(leitoSelecionadoAtivo);
    mudarAba('checklist');
}

function renderChecklistInputs(alvo) {
    const zona = document.getElementById("checklist-inputs-zona");
    if(!zona) return;
    
    if (perfilAtivo === "ROTINA") {
        let html = `<div style="background:#f8fafc; border:1px solid #e2e8f0; padding:15px; border-radius:6px; line-height:1.6;">`;
        html += `<p style="color:#0056b3; font-weight:700; margin-bottom:10px;">📋 Triagem Consolidada das Barreiras (Visão Otimizada):</p>`;
        itensChecklistDef.forEach(item => {
            let val = "✔️ Ativo/Sim";
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
                    <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9;">
                        <span style="font-size:13px; font-weight:600; color:#334155;">${item.label}</span>
                        <div>
                            <label style="margin-right:10px;"><input type="radio" name="rad-${item.id}" value="sim" ${sIdx}> sim</label>
                            <label><input type="radio" name="rad-${item.id}" value="nao" ${nIdx}> não</label>
                        </div>
                    </div>`;
            } else if (item.tipo === "dieta") {
                html += `
                    <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9;">
                        <span style="font-size:13px; font-weight:600; color:#334155;">${item.label}</span>
                        <div>
                            <label style="margin-right:8px;"><input type="radio" name="rad-${item.id}" value="oral" ${alvo.dieta==="oral"?"checked":""}> oral</label>
                            <label style="margin-right:8px;"><input type="radio" name="rad-${item.id}" value="sne" ${alvo.dieta==="sne"?"checked":""}> sne</label>
                            <label><input type="radio" name="rad-${item.id}" value="gtt" ${alvo.dieta==="gtt"?"checked":""}> gtt</label>
                        </div>
                    </div>`;
            }
        });
        html += `</div>`;
        zona.innerHTML = html;
    }
}

function validarAssinaturaSupervisor() {
    const pin = document.getElementById("pin-supervisor").value;
    if(pin === "1234") {
        const estado = window.bancoDadosLeitos[leitoSelecionadoAtivo];
        estado.statusDocumento = "Aprovado";
        estado.supervisorAprovador = usuarioNome;
        alert("Sucesso: Caso revisado e validado pelo médico supervisor!");
        abrirJanelaLeito(leitoSelecionadoAtivo);
        mudarAba('round');
    } else {
        alert("Erro: PIN do supervisor incorreto. Liberação negada.");
    }
}

function salvarChecklistLeito() { 
    alert("Checklist de barreiras salvo e integrado ao Estado Clínico!"); 
    mudarAba('round'); 
}

if (!window.consolidadoGeralPlantaoMedAI) { window.consolidadoGeralPlantaoMedAI = []; }

function enviarHandoffAoConsolidado() {
    const handoff = document.getElementById("txt-passagem-output").value;
    window.bancoDadosLeitos[leitoSelecionadoAtivo].passagemTXT = handoff;
    const itemExistente = window.consolidadoGeralPlantaoMedAI.find(item => item.leito === leitoSelecionadoAtivo);
    if (itemExistente) itemExistente.texto = handoff;
    else window.consolidadoGeralPlantaoMedAI.push({ leito: leitoSelecionadoAtivo, texto: handoff });
    alert(`Handoff do Leito ${leitoSelecionadoAtivo} acoplado ao Consolidado Geral da Unidade!`);
}

function abrirPainelPodcasts() {
    const painel = document.getElementById("medai-modal-consolidado");
    const corpoTexto = document.getElementById("corpo-consolidado-texto");
    if (window.consolidadoGeralPlantaoMedAI.length === 0) {
        corpoTexto.innerText = "Nenhum handoff foi consolidado hoje pela equipe assistencial.";
    } else {
        let relatorio = `=== RELATÓRIO DE PASSAGEM DE PLANTÃO CONSOLIDADO — ${new Date().toLocaleDateString('pt-BR')} ===\n\n`;
        window.consolidadoGeralPlantaoMedAI.forEach(item => { relatorio += `[Leito ${item.leito}]: ${item.texto}\n\n`; });
        corpoTexto.innerText = relatorio;
    }
    painel.style.display = "flex";
}

function mudarAba(nomeAba) {
    document.querySelectorAll(".aba-content").forEach(el => el.style.display = "none");
    document.querySelectorAll(".aba-btn").forEach(el => {
        el.style.background = "#f1f5f9";
        el.style.color = "#475569";
    });
    
    const c = document.getElementById(`conteudo-aba-${nomeAba}`);
    const b = document.getElementById(`btn-aba-${nomeAba}`);
    if(c) c.style.display = "block";
    if(b) {
        b.style.background = "#0056b3";
        b.style.color = "#ffffff";
    }
}

function fecharJanelaLeito() { document.getElementById("medai-modal-leito").style.display = "none"; }

function executarAltaRapida() {
    if (confirm("Dar alta assistencial definitiva e esvaziar o leito?")) {
        const estado = window.bancoDadosLeitos[leitoSelecionadoAtivo];
        estado.textoBruto = ""; estado.evolucaoTXT = ""; estado.roundTXT = ""; estado.passagemTXT = "";
        estado.iniciais = "--"; estado.diagnostico = "Leito Vazio"; estado.lampada = "apagada";
        estado.statusDocumento = "Vazio";
        renderizarMalhaLeitosGeral();
        fecharJanelaLeito();
    }
}

function baixarTXT(tipo) {
    const txt = tipo === 'evolucao' ? document.getElementById("txt-evolucao-output").innerText : document.getElementById("txt-round-ia-output").innerText;
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${tipo}_Leito_${leitoSelecionadoAtivo}.txt`;
    link.click();
}

// Inicialização segura ao carregar a interface
document.addEventListener("DOMContentLoaded", () => {
    // Injeta a estrutura HTML dos modais assistenciais direto no corpo da página
    const wrapper = document.createElement('div');
    wrapper.innerHTML = interfaceEstruturaHTML;
    document.body.appendChild(wrapper);

    // Ajusta os títulos do cabeçalho com base no perfil logado
    const tagPerfil = document.getElementById("info-perfil-visto");
    if(tagPerfil) {
        tagPerfil.innerText = `Função atual: ${perfilAtivo} (${usuarioNome})`;
    }

    // Se for Chefia, expõe os painéis de gerenciamento de leitos
    if(perfilAtivo === "CHEFIA") {
        const painelConfig = document.getElementById("painel-macro-chefia");
        if(painelConfig) painelConfig.style.display = "flex";
    }

    // Desenha o mapa hospitalar inicial na tela
    renderizarMalhaLeitosGeral();
});
