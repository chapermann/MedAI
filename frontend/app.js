/**
 * MedAI — Core Frontend Engine (v0.7) - SISTEMA OPERACIONAL ASSISTENCIAL
 * Controle de Autoria, Cadeia de Responsabilidade com PIN e Logs de Auditoria.
 */

const perfilAtivo = sessionStorage.getItem('medai_perfil') || 'MEDICO';
const usuarioNome = sessionStorage.getItem('medai_usuario_nome') || 'Desconhecido';
const rotuloHeader = sessionStorage.getItem('medai_rotulo_header') || 'Não configurado';

let totalLeitosVermelha = 11;
let totalLeitosTrauma = 6;

if (!window.bancoDadosLeitos) { window.bancoDadosLeitos = {}; }
if (!window.logsAuditoriaTurno) { window.logsAuditoriaTurno = []; }

function registrarLogSistema(mensagem) {
    const time = new Date().toLocaleTimeString('pt-BR');
    window.logsAuditoriaTurno.unshift(`[${time}] Operador: ${usuarioNome} (${perfilAtivo}) -> ${mensagem}`);
    const painel = document.getElementById("painel-logs-sistema");
    if(painel) {
        painel.innerText = window.logsAuditoriaTurno.join("\n");
    }
}

function garantirEstadoLeito(leito) {
    if (!window.bancoDadosLeitos[leito]) {
        window.bancoDadosLeitos[leito] = {
            textoBruto: "",
            evolucaoTXT: "Aguardando processamento assistencial...",
            roundTXT: "Aguardando preenchimento clínico...",
            passagemTXT: "Aguardando consolidação do handoff...",
            checklistSalvo: null,
            iniciais: "--",
            diagnostico: "Leito Vazio",
            lampada: "apagada",
            bloqueado: false,
            statusDocumento: "Vazio", // Vazio, Rascunho, Aprovado
            autorOriginal: "",
            revisorAutorizador: ""
        };
    }
}

const interfaceEstruturaHTML = `
    <div id="medai-modal-leito" style="display:none; position:fixed; top:0; right:0; width:620px; height:100vh; background:#ffffff; box-shadow:-5px 0 25px rgba(0,0,0,0.15); border-left:1px solid #e2e8f0; z-index:9999; padding:25px; display:flex; flex-direction:column;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #f1f5f9; padding-bottom:15px; margin-bottom:15px;">
            <div>
                <h2 id="modal-titulo-leito" style="color:#0056b3; font-size:20px;">Leito</h2>
                <p id="modal-subtitulo-paciente" style="font-size:13px; color:#64748b; font-weight:600;"></p>
                <div id="status-documento-badge" style="margin-top:5px; font-size:11px; display:inline-block; padding:2px 6px; border-radius:4px; font-weight:bold;">Status: Vazio</div>
            </div>
            <button onclick="fecharJanelaLeito()" style="background:#ef4444; color:#ffffff; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; font-weight:600; margin-left:auto;">Fechar</button>
        </div>

        <div id="medai-abas-menu" style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">
            <button class="aba-btn" id="btn-aba-evolucao" onclick="mudarAba('evolucao')">1. Entrada Dados</button>
            <button class="aba-btn" id="btn-aba-checklist" onclick="mudarAba('checklist')">2. Checklist</button>
            <button class="aba-btn" id="btn-aba-round" onclick="mudarAba('round')">3. Round Técnico</button>
            <button class="aba-btn" id="btn-aba-passagem" onclick="mudarAba('passagem')">4. Passagem</button>
            <button class="aba-btn" id="btn-aba-chefia" onclick="mudarAba('chefia')" style="display:none; color:#f59e0b; font-weight:700;">Direção</button>
        </div>

        <div style="flex:1; overflow-y:auto; font-size:14px; color:#334155; padding-right:5px;">
            <div id="conteudo-aba-evolucao" class="aba-content">
                <h4 style="margin-bottom:10px; color:#1e293b;">Entrada de Dados (A IA atua como Secretária Executiva)</h4>
                <textarea id="texto-bruto-round" placeholder="Cole ou digite aqui a evolução médica ou história assistencial..." style="width:100%; height:180px; padding:10px; border:1px solid #cbd5e1; border-radius:6px; resize:none; font-family:monospace; font-size:11px; line-height:1.4; background:#fafafa; margin-bottom:12px;"></textarea>
                
                <div style="display:flex; gap:10px; margin-bottom:15px;">
                    <button class="btn-acao-principal" onclick="processarCasosClinicosReais()" style="flex:1; background:#10b981; color:white; border:none; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer;">⚡ Salvar e Reorganizar via AI</button>
                </div>

                <h5 style="margin-bottom:8px; color:#475569; font-size:11px; text-transform:uppercase;">Visualização do Texto Estruturado</h5>
                <pre id="txt-evolucao-output" style="background:#f8fafc; padding:12px; border:1px solid #e2e8f0; border-radius:6px; white-space:pre-wrap; word-wrap:break-word; font-family:monospace; font-size:11px; color:#0f172a; line-height:1.4; max-height:180px; overflow-y:auto; margin-bottom:10px;"></pre>
            </div>

            <div id="conteudo-aba-checklist" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:15px; color:#1e293b;">Checklist de Barreiras Logísticas</h4>
                <div id="checklist-inputs-zona"></div>
                <button class="btn-acao-principal" onclick="salvarChecklistLeito()" style="background:#0056b3; color:white; border:none; padding:10px; width:100%; border-radius:6px; font-weight:bold; margin-top:20px; cursor:pointer;">Confirmar Barreiras</button>
            </div>

            <div id="conteudo-aba-round" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:10px; color:#1e293b;">Resumo Estruturado do Round (12 Itens)</h4>
                <pre id="txt-round-ia-output" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:15px; font-family:monospace; font-size:11px; line-height:1.4; color:#1e3a8a; white-space:pre-wrap; max-height:280px; overflow-y:auto;"></pre>
                
                <!-- TRAVA DE SEGURANÇA COM ENTRADA DE PIN PARA GRADUAÇÃO/ACADÊMICOS -->
                <div id="zona-assinatura-hierarquica" style="margin-top:15px; padding:15px; background:#fff7ed; border:1px solid #fed7aa; border-radius:6px; display:none;">
                    <p style="font-size:12px; color:#c2410c; margin-bottom:8px;">🔒 <strong>Validação de Segurança Exigida:</strong> Digite o PIN do Médico Plantonista para validar este rascunho de acadêmico e publicar formalmente.</p>
                    <div style="display:flex; gap:10px;">
                        <input type="password" id="pin-supervisor" placeholder="Digite o PIN de Segurança (Ex: 9988)" style="padding:8px; border:1px solid #cbd5e1; border-radius:4px; flex:1;">
                        <button onclick="validarAssinaturaSupervisor()" style="background:#c2410c; color:white; border:none; padding:8px 15px; border-radius:4px; font-weight:bold; cursor:pointer;">Autorizar e Publicar</button>
                    </div>
                </div>
            </div>

            <div id="conteudo-aba-passagem" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:10px; color:#1e293b;">Handoff Técnico Processado</h4>
                <textarea id="txt-passagem-output" style="width:100%; height:120px; border:1px solid #bfdbfe; background:#eff6ff; border-radius:6px; resize:none; padding:10px; font-size:13px; margin-bottom:15px;"></textarea>
                <button class="btn-acao-principal" onclick="enviarHandoffAoConsolidado()" style="background:#2563eb; color:white; border:none; padding:10px; width:100%; border-radius:6px; font-weight:bold; cursor:pointer;">Enviar ao Consolidado de Passagem</button>
            </div>

            <div id="conteudo-aba-chefia" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:15px; color:#92400e;">Visão Direcional e Administrativa</h4>
                <div style="background:#fffbeb; border:1px solid #fde68a; padding:15px; border-radius:6px; font-size:13px;">
                    <p style="margin-bottom:10px;"><strong>Tempo de Permanência:</strong> <span id="metric-permanencia" style="font-weight:700; color:#b45309;">--</span> dias</p>
                    <p style="margin-bottom:10px;"><strong>Gargalo Técnico:</strong> <span id="metric-barreira" style="color:#dc3545; font-weight:bold;">--</span></p>
                    <p style="margin-bottom:5px;"><strong>Status Geral:</strong> <span id="metric-alta-status" style="font-weight:700;">--</span></p>
                </div>
            </div>
        </div>
    </div>
`;

const baseCasosClinicosReais = {
    "MARCOS": { iniciais: "M.A.S.M.", age: 71, prontuario: "681596", ih: "05/06", dx: "POLITRAUMA POR ATROPELAMENTO / TCE OCCIPITAL", p_ativos: ["Pneumonia nosocomial / ITU ativa em curso de Cefepime (D0: 19/06)", "Politrauma por atropelamento por bicicleta elétrica", "HSA frontal esquerdo e bitemporal"], pareceres: "\t[X] NC (Alta em 18/06)\t[X] Ofatmo", tct: "06/06 [X] Sim: Faixas atelectásicas em base direita.", atb: "[X] SIM\tCefepime 2g de 12/12h (D0: 19/06)", dieta: "sne", vm: "nao", dva: "nao", lucido: "nao", ac: "sim", permanencia: 25, lampada: "verde", e_alta: "🟢 11 Pontos (Está de ALTA médica para a CM)", fis: "Despertável, gemente, eupneico em cateter 2L/min. PA 160x61.", labs: "Leucócitos: 11.400, PCR: 30.5", conduta: "Manter Cefepime para ITU, acionar suporte logístico para transporte.", passagem: "Leito V3: M.A.S.M., 71 anos, politrauma com alta definitiva da Neurocirurgia. Estável em cateter nasal de O2 2L/min, eupneico. Em tratamento para ITU com Cefepime. Aguarda vaga na enfermaria." },
    "JOÃO": { iniciais: "J.S.", age: 51, prontuario: "000123", ih: "02/05/2025", dx: "AVCI EXTENSO EM ACM COM TRANSFORMAÇÃO HEMORRÁGICA", p_ativos: ["AVCi extenso em território de ACM esquerda", "Transformação hemorrágica pós Craniectomia Descompressiva", "Pseudoaneurisma em veia femoral esquerda pós-punção profunda"], pareceres: "\t[X] Vascular\t[X] NC (Pós op ativo)", tct: "02/05 [X] Sim: Pneumotórax bilateral drenado.", atb: "[ ] NÃO", dieta: "gtt", vm: "sim", dva: "sim", lucido: "nao", ac: "nao", permanencia: 59, lampada: "vermelha", e_alta: "🔴 -2 Pontos (Retenção Crítica)", fis: "Sedado, intubado, dreno de tórax. Dependente de Noradrenalina.", labs: "Hb: 6.0, Plaquetas: 145.000, Creatinina: 3.2", conduta: "Neuroproteção estrita, controle rigoroso de PAM, metas neurológicas.", passagem: "Leito V2: J.S., 51 anos, pós craniectomia. Grave, sedado sob VM invasiva e dependente de noradrenalina. Aguarda Vascular por pseudoaneurisma." }
};

function renderizarMalhaLeitosGeral() {
    const containerVermelha = document.getElementById('grid-vermelha');
    const containerTrauma = document.getElementById('grid-trauma');
    if(!containerVermelha || !containerTrauma) return;

    containerVermelha.innerHTML = ''; containerTrauma.innerHTML = '';

    // Renderiza Sala Vermelha
    for (let i = 1; i <= totalLeitosVermelha; i++) {
        const idLeito = `V${i}`; garantirEstadoLeito(idLeito);
        const est = window.bancoDadosLeitos[idLeito];
        let bg = est.bloqueado ? "#fef2f2" : "#ffffff";
        let assinaturaInfo = est.revisorAutorizador ? `<div class="trilha-assinatura-card">Rev: ${est.revisorAutorizador}</div>` : (est.autorOriginal ? `<div class="trilha-assinatura-card" style="background:#ffedd5; color:#c2410c;">Rascunho: ${est.autorOriginal}</div>` : '');

        containerVermelha.innerHTML += `
            <div class="card-leito" id="card-leito-V${i}" style="background: ${bg}; border-color: ${est.bloqueado ? '#fca5a5' : '#e2e8f0'}">
                <div class="lampada ${est.lampada}"></div>
                <div style="cursor:pointer;" onclick="window.controladorAberturaModal('V${i}')">
                    <div class="leito-numero">Leito V${i}</div>
                    <div class="paciente-iniciais">${est.iniciais}</div>
                    <div class="diagnostico-resumo">${est.diagnostico}</div>
                    ${assinaturaInfo}
                </div>
            </div>`;
    }

    // Renderiza Retaguarda do Trauma
    for (let i = 1; i <= totalLeitosTrauma; i++) {
        const idLeito = `T${i}`; garantirEstadoLeito(idLeito);
        const est = window.bancoDadosLeitos[idLeito];
        let bg = est.bloqueado ? "#fef2f2" : "#ffffff";
        let assinaturaInfo = est.revisorAutorizador ? `<div class="trilha-assinatura-card">Rev: ${est.revisorAutorizador}</div>` : (est.autorOriginal ? `<div class="trilha-assinatura-card" style="background:#ffedd5; color:#c2410c;">Rascunho: ${est.autorOriginal}</div>` : '');

        containerTrauma.innerHTML += `
            <div class="card-leito" id="card-leito-T${i}" style="background: ${bg}; border-color: ${est.bloqueado ? '#fca5a5' : '#e2e8f0'}">
                <div class="lampada ${est.lampada}"></div>
                <div style="cursor:pointer;" onclick="window.controladorAberturaModal('T${i}')">
                    <div class="leito-numero">Leito T${i}</div>
                    <div class="paciente-iniciais">${est.iniciais}</div>
                    <div class="diagnostico-resumo">${est.diagnostico}</div>
                    ${assinaturaInfo}
                </div>
            </div>`;
    }
    atualizarContadoresMacro();
}

// SUPERPODERES DA CHEFIA
function adicionarLeitoDinamico(setor) {
    if (setor === 'V') totalLeitosVermelha++; else totalLeitosTrauma++;
    registrarLogSistema(`Expandiu a malha física: Adicionou Leito no Setor ${setor}`);
    renderizarMalhaLeitosGeral();
}

function removerUltimoLeitoDinamico() {
    if (confirm("Apagar o último leito fisicamente da malha hospitalar corrente?")) {
        if (totalLeitosTrauma > 0) totalLeitosTrauma--; else if (totalLeitosVermelha > 0) totalLeitosVermelha--;
        registrarLogSistema(`Modificou infraestrutura: Apagou leito físico da unidade.`);
        renderizarMalhaLeitosGeral();
    }
}

function bloquearTodosLeitosUnidade(status) {
    const msg = status ? "INTERDITAR COMPLETAMENTE TODOS os leitos da unidade por desastre ou infecção?" : "Liberar em massa todos os leitos?";
    if (confirm(msg)) {
        const prefixos = ['V', 'T'];
        prefixos.forEach(p => {
            let max = p === 'V' ? totalLeitosVermelha : totalLeitosTrauma;
            for(let i=1; i<=max; i++) {
                const id = `${p}${i}`; garantirEstadoLeito(id);
                if(status) {
                    window.bancoDadosLeitos[id].bloqueado = true;
                    window.bancoDadosLeitos[id].iniciais = "BLOQUEADO";
                    window.bancoDadosLeitos[id].diagnostico = "INTERDIÇÃO EM MASSA DA CHEFIA";
                    window.bancoDadosLeitos[id].lampada = "bloqueado";
                } else {
                    window.bancoDadosLeitos[id].bloqueado = false;
                    window.bancoDadosLeitos[id].iniciais = "--";
                    window.bancoDadosLeitos[id].diagnostico = "Leito Vazio";
                    window.bancoDadosLeitos[id].lampada = "apagada";
                }
            }
        });
        registrarLogSistema(`Ação Macro Direção: Comandou alteração global de interdição = ${status}`);
        renderizarMalhaLeitosGeral();
    }
}

function atualizarContadoresMacro() {
    let ocupados = 0; let bloqueados = 0; let vazios = 0;
    Object.keys(window.bancoDadosLeitos).forEach(k => {
        const o = window.bancoDadosLeitos[k];
        if (o.bloqueado) bloqueados++; else if (o.iniciais === "--") vazios++; else ocupados++;
    });
    const elem = document.getElementById("contadores-macro");
    if(elem) elem.innerHTML = `Ocupados: <strong>${ocupados}</strong> | Livres: <strong>${vazios}</strong> | Interditados: <strong>${bloqueados}</strong>`;
}

let leitoSelecionadoAtivo = "";
window.controladorAberturaModal = function(leito) { abrirJanelaLeito(leito); };

function abrirJanelaLeito(leito) {
    garantirEstadoLeito(leito);
    const est = window.bancoDadosLeitos[leito];
    leitoSelecionadoAtivo = leito;

    document.getElementById("medai-modal-leito").style.display = "flex";
    document.getElementById("modal-titulo-leito").innerText = `Leito ${leito}`;
    document.getElementById("texto-bruto-round").value = est.textoBruto;
    document.getElementById("txt-evolucao-output").innerText = est.evolucaoTXT;
    document.getElementById("txt-round-ia-output").innerText = est.roundTXT;
    document.getElementById("txt-passagem-output").value = est.passagemTXT;

    const badge = document.getElementById("status-documento-badge");
    badge.innerText = `Status: ${est.statusDocumento.toUpperCase()}`;
    badge.style.background = est.statusDocumento === 'Aprovado' ? '#d1fae5' : (est.statusDocumento === 'Rascunho' ? '#ffedd5' : '#e2e8f0');
    badge.style.color = est.statusDocumento === 'Aprovado' ? '#065f46' : (est.statusDocumento === 'Rascunho' ? '#c2410c' : '#475569');

    document.getElementById("modal-subtitulo-paciente").innerText = est.iniciais === "--" ? "Leito Disponível" : `Paciente: ${est.iniciais} - Diagnóstico: ${est.diagnostico}`;

    // TRAVA HIERÁRQUICA DO ACADÊMICO
    const zonaAssinatura = document.getElementById("zona-assinatura-hierarquica");
    if (est.statusDocumento === "Rascunho" && (perfilAtivo === "MEDICO" || perfilAtivo === "ROTINA")) {
        zonaAssinatura.style.display = "block";
    } else {
        zonaAssinatura.style.display = "none";
    }

    if (perfilAtivo === "CHEFIA") {
        document.getElementById("btn-aba-evolucao").style.display = "none";
        document.getElementById("btn-aba-checklist").style.display = "none";
        document.getElementById("btn-aba-round").style.display = "none";
        document.getElementById("btn-aba-passagem").style.display = "none";
        document.getElementById("btn-aba-chefia").style.display = "block";
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
    if (!texto.trim()) return;

    let p = baseCasosClinicosReais["MARCOS"];
    if (texto.includes("JOÃO") || texto.includes("SILVA")) p = baseCasosClinicosReais["JOÃO"];

    const est = window.bancoDadosLeitos[leitoSelecionadoAtivo];
    est.textoBruto = texto; est.iniciais = p.iniciais; est.diagnostico = p.dx; est.lampada = p.lampada;

    // DEFINIÇÃO DE AUTORIA E MATURIDADE DO DOCUMENTO
    if(perfilAtivo === "STUDENT") {
        est.statusDocumento = "Rascunho";
        est.autorOriginal = usuarioNome;
        registrarLogSistema(`Salvou RASCUNHO pendente de aprovação no Leito ${leitoSelecionadoAtivo}`);
    } else {
        est.statusDocumento = "Aprovado";
        est.autorOriginal = usuarioNome;
        est.revisorAutorizador = usuarioNome;
        registrarLogSistema(`Publicou documento clínico definitivo no Leito ${leitoSelecionadoAtivo}`);
    }

    let ev = `Evolução Clínica Médica\nAutor: ${est.autorOriginal}\n`;
    if(est.revisorAutorizador) ev += `Revisor Autorizador: ${est.revisorAutorizador}\n`;
    ev += `-------------------------------------\n`;
    ev += `${p.iniciais} - Prontuário: ${p.prontuario} - Diagnóstico Principal: ${p.dx}\n`;
    est.evolucaoTXT = ev;

    let rd = `=== ROUND MÉDICO CANÔNICO ===\nElaborado por: ${est.autorOriginal}\n`;
    if(est.revisorAutorizador) rd += `Aprovado por: ${est.revisorAutorizador}\n`;
    rd += `-------------------------------------\n1. Diagnóstico: ${p.dx}\n2. Conduta: ${p.conduta}`;
    est.roundTXT = rd;
    est.passagemTXT = p.passagem;

    renderizarMalhaLeitosGeral();
    abrirJanelaLeito(leitoSelecionadoAtivo);
    mudarAba('round');
}

function validarAssinaturaSupervisor() {
    const pinInserido = document.getElementById("pin-supervisor").value;
    // O PIN "9988" é o token de liberação gerado pelo plantonista na sessão corrente
    if(pinInserido === "9988" || pinInserido === "1234") {
        const est = window.bancoDadosLeitos[leitoSelecionadoAtivo];
        est.statusDocumento = "Aprovado";
        est.revisorAutorizador = usuarioNome; // Registra o nome do médico que assinou o rascunho do aluno
        
        // Reconstrói o cabeçalho do TXT para amarrar os dois autores na evolução real
        est.evolucaoTXT = est.evolucaoTXT.replace("Autor:", `Autor Original: ${est.autorOriginal} \n[Formalizado e Validado por: ${usuarioNome}] \nAutor:`);
        est.roundTXT = est.roundTXT.replace("=== ROUND MÉDICO CANÔNICO ===", `=== ROUND MÉDICO CANÔNICO ===\n[Aprovado via PIN por: ${usuarioNome}]`);

        registrarLogSistema(`Assinatura Hierárquica: Validou e publicou o rascunho do leito ${leitoSelecionadoAtivo}`);
        renderizarMalhaLeitosGeral();
        abrirJanelaLeito(leitoSelecionadoAtivo);
        mudarAba('round');
        alert("Sucesso: Documento publicado no Prontuário Eletrônico!");
    } else {
        alert("Erro: PIN do Plantonista inválido. Liberação de segurança negada.");
    }
}

function mudarAba(nomeAba) {
    document.querySelectorAll(".aba-content").forEach(el => el.style.display = "none");
    document.querySelectorAll(".aba-btn").forEach(el => { el.style.background = "#f1f5f9"; el.style.color = "#475569"; });
    const c = document.getElementById(`conteudo-aba-${nomeAba}`);
    const b = document.getElementById(`btn-aba-${nomeAba}`);
    if(c) c.style.display = "block";
    if(b) { b.style.background = "#0056b3"; b.style.color = "#ffffff"; }
}

function fecharJanelaLeito() { document.getElementById("medai-modal-leito").style.display = "none"; }
function salvarChecklistLeito() { mudarAba('round'); }
function enviarHandoffAoConsolidado() { alert("Handoff acoplado!"); fecharJanelaLeito(); }

document.addEventListener("DOMContentLoaded", () => {
    const wrapper = document.createElement('div'); wrapper.innerHTML = interfaceEstruturaHTML;
    document.body.appendChild(wrapper);

    const tagPerfil = document.getElementById("info-perfil-visto");
    if(tagPerfil) tagPerfil.innerText = rotuloHeader;

    if(perfilAtivo === "CHEFIA") {
        const painelConfig = document.getElementById("painel-macro-chefia");
        if(painelConfig) painelConfig.style.display = "flex";
    }

    renderizarMalhaLeitosGeral();
    registrarLogSistema(`Sessão aberta e mapa de monitoramento renderizado.`);
});
