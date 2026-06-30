/**
 * MedAI — Core Frontend Engine (v0.1) - CORRIGIDO
 * Gerencia a carga cognitiva, regras de privilégio por perfil e estados do Flipbook.
 */

// 1. Captura o perfil do usuário logado vindo do login.html
const perfilAtivo = sessionStorage.getItem('medai_perfil') || 'MEDICO'; // Padrão de segurança

// 2. Elementos de Controle de Interface (Modal do Leito)
const interfaceEstruturaHTML = `
    <div id="medai-modal-leito" style="display:none; position:fixed; top:0; right:0; width:550px; height:100vh; background:#ffffff; box-shadow:-5px 0 25px rgba(0,0,0,0.15); border-left:1px solid #e2e8f0; z-index:9999; padding:25px; flex-direction:column;">
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

        <div style="flex:1; overflow-y:auto; font-size:14px; color:#334155;">
            <div id="conteudo-aba-checklist" class="aba-content">
                <h4 style="margin-bottom:10px; color:#1e293b;">Checklist de Barreiras e Dispositivos</h4>
                <div id="checklist-inputs-zona"></div>
                <button id="btn-salvar-checklist" class="btn-acao-principal" style="margin-top:15px;">Salvar Ajustes</button>
            </div>

            <div id="conteudo-aba-round" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:10px; color:#1e293b;">Gravação ou Digitação de Discussão</h4>
                <p style="font-size:12px; color:#64748b; margin-bottom:8px;">Cole o prontuário ou a transcrição bruta do round à beira do leito:</p>
                <textarea id="texto-bruto-round" placeholder="Cole aqui a evolução médica de hoje..." style="width:100%; height:200px; padding:10px; border:1px solid #cbd5e1; border-radius:6px; resize:none; font-family:monospace;"></textarea>
                <button id="btn-processar-ia" class="btn-acao-principal" style="margin-top:15px; background:#10b981;">Processar via AI Engine</button>
            </div>

            <div id="conteudo-aba-evolucao" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:10px; color:#1e293b;">Evolução Prontuário (TXT Limpo)</h4>
                <pre id="txt-evolucao-output" style="background:#f8fafc; padding:15px; border:1px solid #e2e8f0; border-radius:6px; white-space:pre-wrap; word-wrap:break-word; font-family:monospace; font-size:12px; color:#0f172a;"></pre>
                <button class="btn-acao-principal" onclick="baixarArquivoTXT()" style="background:#64748b; margin-top:10px;">Baixar em arquivo .TXT</button>
            </div>

            <div id="conteudo-aba-passagem" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:10px; color:#1e293b;">Handoff de Transmissão (50-80 palavras)</h4>
                <div style="background:#eff6ff; border-left:4px solid #3b82f6; padding:15px; border-radius:4px; margin-bottom:15px;">
                    <p id="txt-passagem-output" style="font-style:italic; line-height:1.6; color:#1e3a8a;"></p>
                </div>
            </div>

            <div id="conteudo-aba-chefia" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:15px; color:#92400e;">Relatório de Gargalos Hospitalares</h4>
                <div style="background:#fffbeb; border:1px solid #fde68a; padding:15px; border-radius:6px;">
                    <p style="margin-bottom:8px;"><strong>Tempo de Permanência no Leito:</strong> <span id="metric-permanencia">--</span> dias</p>
                    <p style="margin-bottom:8px;"><strong>Tempo de Ventilação Mecânica (VM):</strong> <span id="metric-vm">--</span> dias</p>
                    <p style="margin-bottom:8px;"><strong>Barreira Ativa Encontrada:</strong> <span id="metric-barreira" style="color:#dc3545; font-weight:bold;">--</span></p>
                    <p style="margin-bottom:8px;"><strong>Previsão de Alta Calculada:</strong> <span id="metric-alta-status">--</span></p>
                </div>
            </div>
        </div>

        <div id="zona-alta-rapida" style="border-top:1px solid #e2e8f0; padding-top:15px; margin-top:15px; display:flex; justify-content:space-between;">
            <button onclick="executarAltaRapida()" style="background:#dc3545; color:#ffffff; border:none; padding:10px 15px; border-radius:6px; font-weight:700; cursor:pointer; width:100%;">[ Dar Alta / Arquivar Caso para a Gaveta ]</button>
        </div>
    </div>
`;

// 3. Inicialização e Injeção do Painel na tela ao carregar o script
document.body.insertAdjacentHTML('beforeend', interfaceEstruturaHTML);

// Injeta estilos CSS para os elementos injetados dinamicamente
const estilosEstáticos = document.createElement("style");
estilosEstáticos.innerHTML = `
    .aba-btn { background:none; border:none; padding:6px 12px; cursor:pointer; font-size:13px; font-weight:600; color:#64748b; border-radius:4px; }
    .aba-btn.ativa { background:#0056b3; color:#ffffff !important; }
    .btn-acao-principal { width:100%; padding:10px; border:none; border-radius:6px; background:#0056b3; color:#ffffff; font-weight:700; cursor:pointer; }
`;
document.head.appendChild(estilosEstáticos);

// 4. Configura os cliques nas caixas 3D que já existem no mapa de leitos
document.addEventListener("DOMContentLoaded", () => {
    // Configura os escutadores em atraso mínimo para garantir render mestre
    setTimeout(() => {
        const cards = document.querySelectorAll(".card-leito");
        cards.forEach(card => {
            card.style.cursor = "pointer"; // Adiciona dica visual de clique
            card.addEventListener("click", () => {
                const tituloLeito = card.querySelector(".leito-numero").innerText;
                const iniciaisPaciente = card.querySelector(".paciente-iniciais").innerText;
                const dxResumo = card.querySelector(".diagnostico-resumo").innerText;
                
                abrirJanelaLeito(tituloLeito, iniciaisPaciente, dxResumo);
            });
        });
    }, 500);
});

// 5. Função Mestre: Aplica as Trava Hierárquicas e Configura as Telas ao abrir o leito
function abrirJanelaLeito(leito, iniciais, dx) {
    const modal = document.getElementById("medai-modal-leito");
    modal.style.display = "flex"; // Força exibição como bloco Flexbox
    
    document.getElementById("modal-titulo-leito").innerText = leito;
    document.getElementById("modal-subtitulo-paciente").innerText = iniciais === "--" ? "Leito Disponível para Internação" : `Paciente: ${iniciais}`;
    
    // Resgata elementos de abas para aplicar as regras ocultação/travas
    const btnChecklist = document.getElementById("btn-aba-checklist");
    const btnRound = document.getElementById("btn-aba-round");
    const btnEvolucao = document.getElementById("btn-aba-evolucao");
    const btnPassagem = document.getElementById("btn-aba-passagem");
    const btnChefia = document.getElementById("btn-aba-chefia");
    const btnSalvarChecklist = document.getElementById("btn-salvar-checklist");
    const btnAltaRapida = document.getElementById("zona-alta-rapida");
    const zonaChecklistInputs = document.getElementById("checklist-inputs-zona");

    zonaChecklistInputs.innerHTML = "";

    // Reasigna valores base simulados baseados no Flipbook (Ontem vs Hoje)
    document.getElementById("texto-bruto-round").value = iniciais !== "--" ? `Paciente ${iniciais}, evoluindo estável...` : "";
    document.getElementById("txt-evolucao-output").innerText = `NOME INTERNO: [OCULTADO CONFORME LEI DE PRIVACIDADE]\nPRONTUÁRIO: 998421\nDIAGNÓSTICO: ${dx}\n\n[DADOS DO DIA ANTERIOR CARREGADOS - FLIPBOOK ATIVO]`;
    document.getElementById("txt-passagem-output").innerText = `${leito}: Paciente ${iniciais}, internado por ${dx}. Encontra-se estável, em ar ambiente, sem queixas álgicas agudas no momento. Plano da rotina mantém conduta clínica. No momento não há pendências imediatas.`;

    // Itens do checklist unificado
    const itensChecklist = [
        { id: "tvp", label: "Profilaxia TVP ativa" },
        { id: "ulcera", label: "Profilaxia de Úlcera ativa" },
        { id: "delirium", label: "Profilaxia de Delirium ativa" },
        { id: "dieta", label: "Paciente recebendo dieta (Oral/SNE/GTT)" },
        { id: "atb", label: "Antibioticoterapia em andamento" },
        { id: "culturas", label: "Culturas coletadas/controladas" },
        { id: "eliminacoes", label: "Eliminações fisiológicas presentes nas últimas 24h" },
        { id: "vm", label: "Em Ventilação Mecânica (VM)" },
        { id: "dva", label: "Em uso de Drogas Vasoativas (DVA)" },
        { id: "alta_cirurgica", label: "Paciente com alta das especialidades cirúrgicas" },
        { id: "sem_dor", label: "Paciente sem queixas álgicas agudas" },
        { id: "lucido", label: "Paciente encontra-se lúcido" }
    ];

    // --- APLICAÇÃO IMPLACÁVEL DA MATRIZ DE GOVERNANÇA (USER_ROLES) ---
    
    if (perfilAtivo === "CHEFIA") {
        btnChecklist.style.display = "none";
        btnRound.style.display = "none";
        btnEvolucao.style.display = "none";
        btnPassagem.style.display = "none";
        btnAltaRapida.style.display = "none";
        btnChefia.style.display = "block";
        
        document.getElementById("metric-permanencia").innerText = "14";
        document.getElementById("metric-vm").innerText = "0 (Ar ambiente)";
        document.getElementById("metric-barreira").innerText = "Aguardando parecer da Vascular solicitado há 48h";
        document.getElementById("metric-alta-status").innerText = "Aguardando liberação de barreira logística";
        
        mudarAba('chefia');
    } 
    else if (perfilAtivo === "ROTINA") {
        btnChefia.style.display = "none";
        btnChecklist.style.display = "block";
        btnRound.style.display = "block";
        btnEvolucao.style.display = "block";
        btnPassagem.style.display = "block";
        btnAltaRapida.style.display = "block";

        btnSalvarChecklist.innerText = "Validar Escore de Alta e Condutas";
        btnSalvarChecklist.style.background = "#10b981";
        
        // Exibição limpa e sumarizada para o médico de Rotina
        let htmlResumo = `<div style="background:#f8fafc; border:1px solid #e2e8f0; padding:15px; border-radius:6px; line-height:1.6;">`;
        htmlResumo += `<p style="color:#0056b3; font-weight:700; margin-bottom:10px;">📋 Apanhado Geral do Turno (Extraído):</p>`;
        itensChecklist.forEach(item => {
            const statusSimulado = item.id !== "vm" && item.id !== "dva" ? "✔️ Ativo/Sim" : "❌ Inativo/Não";
            htmlResumo += `<p style="margin-bottom:4px;">• <strong>${item.label}:</strong> <span style="color:#475569;">${statusSimulado}</span></p>`;
        });
        htmlResumo += `</div>`;
        
        zonaChecklistInputs.innerHTML = htmlResumo;
        mudarAba('round');
    } 
    else if (perfilAtivo === "STUDENT") {
        btnChefia.style.display = "none";
        btnChecklist.style.display = "block";
        btnRound.style.display = "block";
        btnEvolucao.style.display = "block";
        btnPassagem.style.display = "block";
        btnAltaRapida.style.display = "none";

        btnSalvarChecklist.innerText = "Submeter Rascunho para Validação do Residente";
        btnSalvarChecklist.style.background = "#64748b";
        
        let htmlForm = `<div style="display:flex; flex-direction:column; gap:12px;">`;
        itensChecklist.forEach(item => {
            htmlForm += `
                <label style="display:flex; align-items:center; gap:10px; cursor:pointer; background:#f8fafc; padding:8px 12px; border-radius:6px; border:1px solid #e2e8f0;">
                    <input type="checkbox" id="chk-${item.id}" style="width:16px; height:16px; cursor:pointer;">
                    <span style="font-size:13px; font-weight:600; color:#334155;">${item.label}</span>
                </label>
            `;
        });
        htmlForm += `</div>`;
        
        zonaChecklistInputs.innerHTML = htmlForm;
        mudarAba('checklist');
    } 
    else {
        // PERFIL: MEDICO / PLANTONISTA
        btnChefia.style.display = "none";
        btnChecklist.style.display = "block";
        btnRound.style.display = "block";
        btnEvolucao.style.display = "block";
        btnPassagem.style.display = "block";
        btnAltaRapida.style.display = "block";
        
        btnSalvarChecklist.innerText = "Salvar Ajustes do Plantão";
        btnSalvarChecklist.style.background = "#0056b3";
        
        let htmlForm = `<div style="display:flex; flex-direction:column; gap:12px;">`;
        itensChecklist.forEach(item => {
            htmlForm += `
                <label style="display:flex; align-items:center; gap:10px; cursor:pointer; background:#f8fafc; padding:8px 12px; border-radius:6px; border:1px solid #e2e8f0;">
                    <input type="checkbox" id="chk-${item.id}" style="width:16px; height:16px; cursor:pointer;">
                    <span style="font-size:13px; font-weight:600; color:#334155;">${item.label}</span>
                </label>
            `;
        });
        htmlForm += `</div>`;
        
        zonaChecklistInputs.innerHTML = htmlForm;
        mudarAba('passagem');
    }
}

// 6. Controle de Abas
function mudarAba(nomeAba) {
    document.querySelectorAll(".aba-content").forEach(el => el.style.display = "none");
    document.querySelectorAll(".aba-btn").forEach(el => el.classList.remove("ativa"));
    
    const targetContent = document.getElementById(`conteudo-aba-${nomeAba}`);
    const targetBtn = document.getElementById(`btn-aba-${nomeAba}`);
    
    if(targetContent) targetContent.style.display = "block";
    if(targetBtn) targetBtn.classList.add("ativa");
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
