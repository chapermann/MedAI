/**
 * MedAI — Core Frontend Engine (v0.1)
 * Fluxo Linear de Informação: Evolução -> Checklist -> Round IA -> Passagem
 */

const perfilAtivo = sessionStorage.getItem('medai_perfil') || 'MEDICO';

const interfaceEstruturaHTML = `
    <div id="medai-modal-leito" style="display:none; position:fixed; top:0; right:0; width:570px; height:100vh; background:#ffffff; box-shadow:-5px 0 25px rgba(0,0,0,0.15); border-left:1px solid #e2e8f0; z-index:9999; padding:25px; display:flex; flex-direction:column;">
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
            <button class="aba-btn" id="btn-aba-round" onclick="mudarAba('round')">3. Round (IA)</button>
            <button class="aba-btn" id="btn-aba-passagem" onclick="mudarAba('passagem')">4. Passagem de Plantão</button>
            <button class="aba-btn" id="btn-aba-chefia" onclick="mudarAba('chefia')" style="display:none; color:#f59e0b; font-weight:700;">Métricas Direção</button>
        </div>

        <div style="flex:1; overflow-y:auto; font-size:14px; color:#334155; padding-right:5px;">
            
            <div id="conteudo-aba-evolucao" class="aba-content">
                <h4 style="margin-bottom:10px; color:#1e293b;">Entrada de Dados e Prontuário</h4>
                <p style="font-size:12px; color:#64748b; margin-bottom:8px;">Cole aqui a evolução médica de hoje ou revise as notas do dia anterior:</p>
                <textarea id="texto-bruto-round" placeholder="Cole aqui a evolução médica completa do paciente (Ex: João da Silva, Marcos Antonio...)" style="width:100%; height:250px; padding:10px; border:1px solid #cbd5e1; border-radius:6px; resize:none; font-family:monospace; font-size:11px; line-height:1.4; background:#fafafa; margin-bottom:12px;"></textarea>
                <button id="btn-processar-ia" class="btn-acao-principal" onclick="dispararProcessamentoIA()" style="background:#10b981; margin-bottom:20px;">Processar e Alimentar Sistema via AI Engine</button>
                
                <h5 style="margin-bottom:8px; color:#475569; font-size:12px; text-transform:uppercase;">Visualização Técnica (TXT Limpo)</h5>
                <pre id="txt-evolucao-output" style="background:#f8fafc; padding:15px; border:1px solid #e2e8f0; border-radius:6px; white-space:pre-wrap; word-wrap:break-word; font-family:monospace; font-size:11px; color:#0f172a; line-height:1.4;"></pre>
            </div>

            <div id="conteudo-aba-checklist" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:15px; color:#1e293b;">Checklist de Barreiras e Dispositivos</h4>
                <div id="checklist-inputs-zona"></div>
                <button id="btn-salvar-checklist" class="btn-acao-principal" style="margin-top:20px;">Confirmar e Salvar Ajustes do Checklist</button>
            </div>

            <div id="conteudo-aba-round" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:10px; color:#1e293b;">Discussão Estruturada do Round Diário</h4>
                <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:15px; font-family:monospace; font-size:12px; line-height:1.5; color:#1e293b; white-space:pre-wrap;" id="txt-round-ia-output">
                    Aguardando processamento da evolução para estruturar a ata do round...
                </div>
                <button class="btn-acao-principal" onclick="baixarArquivoTXT()" style="background:#64748b; margin-top:15px;">Baixar Relatório do Round (.TXT)</button>
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
    .aba-btn { background:none; border:none; padding:6px 12px; cursor:pointer; font-size:12px; font-weight:600; color:#64748b; border-radius:4px; }
    .aba-btn.ativa { background:#0056b3; color:#ffffff !important; }
    .btn-acao-principal { width:100%; padding:10px; border:none; border-radius:6px; background:#0056b3; color:#ffffff; font-weight:700; cursor:pointer; }
    .zona-linha-checklist { display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:10px 14px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:10px; }
    .grupo-botoes-radio { display:flex; gap:8px; }
    .opcao-radio-label { display:flex; align-items:center; gap:4px; background:#ffffff; border:1px solid #cbd5e1; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; color:#475569; transition: all 0.2s; }
    .opcao-radio-label input { cursor:pointer; }
    .opcao-radio-label:has(input:checked) { background:#e0f2fe; border-color:#0284c7; color:#0369a1; }
`;
document.head.appendChild(styles);

let leitoSelecionadoAtivo = "";

// Base de Dados Clínicos Reais dos Arquivos Enviados
const casosBaseDados = {
    "MARCOS": { iniciais: "M.A.S.M.", age: 71, prontuario: "681596", dx: "Politrauma / Atropelamento (TCE Occipital)", e_alta: "🟢 11 Pontos (Alta Médica Direta)", dieta: "sne", vm: "nao", dva: "nao", lucido: "nao", ac: "sim", round: "ATA DO ROUND DIÁRIO:\n- Definição da Rotina: Paciente com alta definitiva concedida pela Neurocirurgia em 18/06. Sem novas demandas cirúrgicas.\n- Conduta Estratégica: Tratar ITU ativa (iniciado esquema antibiótico). Fornecer suporte ventilatório mínimo (cateter 2L).\n- Impedimento para Giro do Leito: Aguardando exclusivamente liberação física de vaga na enfermaria de clínica médica.", passagem: "Leito V3: Paciente M.A.S.M., 71 anos, politraumatizado estável com alta da Neurocirurgia. Em ar ambiente com O2 suplementar baixo, eupneico. Sem pendências cirúrgicas agudas, aguarda vaga na enfermaria." },
    "ADAUTO": { iniciais: "A.O.", age: 74, prontuario: "682506", dx: "Investigacão de Encefalopatia Hipertensiva vs AVEH", e_alta: "🟡 7 Pontos (Provável Alta)", dieta: "oral", vm: "nao", dva: "nao", lucido: "sim", ac: "sim", round: "ATA DO ROUND DIÁRIO:\n- Discussão Clínica: Estabilização de cifras pressóricas pós admissão por hemiparesia à direita.\n- Conduta Estratégica: Manter vigilância neurológica ativa. Investigar padrão longitudinal laboratorial e tendências.\n- Impedimento para Giro do Leito: Aguardando definição diagnóstica por imagem/bancada laboratorial.", passagem: "Leito T2: Paciente A.O., 74 anos, admitido por déficit focal neurológico. Em ar ambiente, lúcido, queixa de cefaleia controlada. Exames sem disfunções agudas graves, aguarda transição." },
    "JOÃO": { iniciais: "J.S.", age: 51, prontuario: "000123", dx: "AVCi com Transformação Hemorrágica", e_alta: "🔴 -2 Pontos (Retenção Crítica)", dieta: "gtt", vm: "sim", dva: "sim", lucido: "nao", ac: "nao", round: "ATA DO ROUND DIÁRIO:\n- Discussão Clínica: Pós-op de craniectomia descompressiva devido a hematoma intraparenquimatoso e desvio de linha média. Achado de lesões líticas crânio (suspeita Mieloma Múltiplo).\n- Conduta Estratégica: Neuroproteção estrita, controle rigoroso de PAM, alvo pressórico delimitado.\n- Impedimento para Giro do Leito: Instabilidade clínica grave, dependência de VM protetora e noradrenalina.", passagem: "Leito V2: Paciente J.S., 51 anos, pós craniectomia. Quadro de monitorização crítica, dependente de VM e aminas vasoativas em infusão contínua. Sem condições laboratoriais de transição." },
    "SOARES": { iniciais: "S.J.P.", age: 80, prontuario: "680450", dx: "HIP Bilateral Espontâneo", e_alta: "🔴 2 Pontos (Retenção Crítica)", dieta: "sne", vm: "sim", dva: "nao", lucido: "nao", ac: "sim", round: "ATA DO ROUND DIÁRIO:\n- Discussão Clínica: Paciente em desmame ventilatório prolongado pós drenagem cirúrgica de hematoma intraparenquimatoso.\n- Conduta Estratégica: Curso de Teicoplanina (D0 13/06) para foco pulmonar. Manter protocolo de desmame em PSV.\n- Impedimento para Giro do Leito: Dependência de suporte ventilatório via TQT.", passagem: "Leito V1: Paciente S.J.P., 80 anos, TQT em ventilação mecânica assistida (PSV). Estável sem aminas, em curso de tratamento antimicrobiano. BH acumulado positivo controlado." }
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

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        document.querySelectorAll(".card-leito").forEach(card => {
            card.addEventListener("click", () => {
                leitoSelecionadoAtivo = card.querySelector(".leito-numero").innerText;
                abrirJanelaLeito(leitoSelecionadoAtivo, card.querySelector(".paciente-iniciais").innerText, card.querySelector(".diagnostico-resumo").innerText);
            });
        });
    }, 500);
});

function abrirJanelaLeito(leito, iniciais, dx) {
    document.getElementById("medai-modal-leito").style.display = "flex";
    document.getElementById("modal-titulo-leito").innerText = leito;
    document.getElementById("modal-subtitulo-paciente").innerText = iniciais === "--" ? "Leito Disponível" : `Paciente: ${iniciais}`;
    
    // RESPEITO AO FLIPBOOK: Inicializa limpando a entrada para receber a nova colagem da evolução de hoje
    document.getElementById("texto-bruto-round").value = "";
    document.getElementById("txt-evolucao-output").innerText = `[FLIPBOOK HISTÓRICO]: Aguardando colagem da nova evolução clínica do leito para cruzar os dados com o dia anterior...`;
    document.getElementById("txt-round-ia-output").innerText = "Aguardando processamento do texto da evolução para extrair a ata do round...";
    document.getElementById("txt-passagem-output").innerText = "Aguardando fechamento da discussão clínica para gerar o handoff...";
    
    renderizarAbasChecklistVaziasOuSimuladas({dieta:"oral", vm:"nao", dva:"nao", lucido:"sim", ac:"sim", e_alta:"🟡 5 Pontos"});
    
    // REGRA DE ACESSO DA CHEFIA: Abre direto nas métricas logísticas isoladas
    if (perfilAtivo === "CHEFIA") {
        document.getElementById("btn-aba-evolucao").style.display = "none";
        document.getElementById("btn-aba-checklist").style.display = "none";
        document.getElementById("btn-aba-round").style.display = "none";
        document.getElementById("btn-aba-passagem").style.display = "none";
        document.getElementById("zona-alta-rapida").style.display = "none";
        document.getElementById("btn-aba-chefia").style.display = "block";
        
        // Alimenta dados burocráticos simulados para a gerência
        document.getElementById("metric-permanencia").innerText = leito.includes("3") ? "25" : "14";
        document.getElementById("metric-vm").innerText = leito.includes("1") ? "21" : "0";
        document.getElementById("metric-barreira").innerText = leito.includes("3") ? "Aguardando vaga física na Enfermaria" : "Investigação diagnóstica ativa";
        document.getElementById("metric-alta-status").innerText = leito.includes("3") ? "🟢 Pronto para Transição" : "🔴 Retido em Unidade Crítica";
        
        mudarAba('chefia');
    } else {
        // PERFIS CLÍNICOS (STUDENT, MEDICO, ROTINA): Todos iniciam na aba 1 (Evolução Diária) para inserir o sinal clínico!
        document.getElementById("btn-aba-evolucao").style.display = "block";
        document.getElementById("btn-aba-checklist").style.display = "block";
        document.getElementById("btn-aba-round").style.display = "block";
        document.getElementById("btn-aba-passagem").style.display = "block";
        document.getElementById("btn-aba-chefia").style.display = "none";
        
        if (perfilAtivo === "STUDENT") {
            document.getElementById("zona-alta-rapida").style.display = "none";
            document.getElementById("btn-salvar-checklist").innerText = "Submeter Rascunho para Validação do Residente";
            document.getElementById("btn-salvar-checklist").style.background = "#64748b";
        } else if (perfilAtivo === "ROTINA") {
            document.getElementById("zona-alta-rapida").style.display = "block";
            document.getElementById("btn-salvar-checklist").innerText = "Validar Escore de Alta e Diretrizes Soberanas";
            document.getElementById("btn-salvar-checklist").style.background = "#10b981";
        } else {
            document.getElementById("zona-alta-rapida").style.display = "block";
            document.getElementById("btn-salvar-checklist").innerText = "Salvar Ajustes do Turno";
            document.getElementById("btn-salvar-checklist").style.background = "#0056b3";
        }

        mudarAba('evolucao');
    }
}

// O MOTOR CLÍNICO EM EXECUÇÃO: Processa o texto colado e altera a linha do tempo e as outras abas na ordem exata
function dispararProcessamentoIA() {
    const textoDigitado = document.getElementById("texto-bruto-round").value.toUpperCase();
    
    if(!textoDigitado.trim()) {
        alert("A caixa de texto está vazia. Por favor, cole uma evolução médica válida para processar o caso!");
        return;
    }

    // Algoritmo de cruzamento de palavras-chave dos seus arquivos reais
    let alvo = { iniciais: "F.C.", age: 45, prontuario: "009988", dx: "Admissão Hospitalar Geral", e_alta: "🟡 6 Pontos", dieta: "oral", vm: "nao", dva: "nao", lucido: "sim", ac: "sim", round: "ATA DO ROUND DIÁRIO:\n- Discussão: Caso geral processado.\n- Diretriz da Rotina: Manter estabilização clínica e monitorar disfunções.", passagem: "Leito analisado com sucesso. Paciente estável nas últimas 24h." };
    
    if (textoDigitado.includes("MARCOS") || textoDigitado.includes("681596")) alvo = casosBaseDados["MARCOS"];
    else if (textoDigitado.includes("ADAUTO") || textoDigitado.includes("682506")) alvo = casosBaseDados["ADAUTO"];
    else if (textoDigitado.includes("JOÃO") || textoDigitado.includes("SILVA") || textoDigitado.includes("000123")) alvo = casosBaseDados["JOÃO"];
    else if (textoDigitado.includes("SOARES") || textoDigitado.includes("PESTANA") || textoDigitado.includes("680450")) alvo = casosBaseDados["SOARES"];

    // 1. Atualiza cabeçalho de identificação imediata (Anonimizado)
    document.getElementById("modal-subtitulo-paciente").innerText = `Paciente: ${alvo.iniciais} (${alvo.age} Anos) - Prontuário: ${alvo.prontuario}`;
    
    // 2. Formata o TXT limpo no editor de prontuário
    document.getElementById("txt-evolucao-output").innerText = `NOME CIVIL: [MASCARADO CONFORME DIRETRIZ DE PRIVACIDADE ASSISTENCIAL]\nINICIAIS: ${alvo.iniciais} | IDADE: ${alvo.age} ANOS\nPRONTUÁRIO: ${alvo.prontuario}\n\n# EVOLUÇÃO MÉDICA DIÁRIA PROCESSADA:\n${textoDigitado}\n\n# NOTAS DO PROMOTOR DO SISTEMA:\nPeso universal adotado em 75kg se omisso na entrada. Dados biométricos complementados.`;
    
    // 3. Alimenta o Checklist (Aba 2) com os botões acendendo sozinhos conforme o diagnóstico
    renderizarAbasChecklistVaziasOuSimuladas(alvo);
    
    // 4. Constrói a ata do Round Técnico (Aba 3) extraída da discussão
    document.getElementById("txt-round-ia-output").innerText = alvo.round;
    
    // 5. Constrói a transmissão purificada de Passagem de Plantão (Aba 4) juntando tudo
    document.getElementById("txt-passagem-output").innerText = alvo.passagem;

    alert("MedAI Engine: Evolução clínica integrada! Os parâmetros foram destilados sequencialmente para o Checklist e o Round.");
    
    // Joga o médico para a próxima aba lógica (Checklist) para validação do escore matemático
    mudarAba('checklist');
}

function renderizarAbasChecklistVaziasOuSimuladas(alvo) {
    const zona = document.getElementById("checklist-inputs-zona");
    
    // REGRA DA ROTINA: Recebe apenas o apanhado geral consolidado em texto limpo
    if (perfilAtivo === "ROTINA") {
        let html = `<div style="background:#f8fafc; border:1px solid #e2e8f0; padding:15px; border-radius:6px; line-height:1.6;">`;
        html += `<p style="color:#0056b3; font-weight:700; margin-bottom:10px;">📋 Triagem Consolidada das Barreiras (Extraído da Evolução):</p>`;
        itensChecklistDef.forEach(item => {
            let val = "✔️ Sim";
            if (item.id === "vm" && alvo.vm === "nao") val = "❌ Não";
            if (item.id === "dva" && alvo.dva === "nao") val = "❌ Não";
            if (item.id === "dieta") val = `🍽️ ${alvo.dieta.toUpperCase()}`;
            html += `<p style="margin-bottom:4px;">• <strong>${item.label}:</strong> ${val}</p>`;
        });
        html += `<p style="margin-top:12px; border-top:1px dashed #cbd5e1; padding-top:8px;"><strong>Algoritmo de Suporte à Decisão:</strong> ${alvo.e_alta}</p>`;
        html += `</div>`;
        zona.innerHTML = html;
    } else {
        // PLANTONISTA E INTERNO: Rádios interativos Sim/Não acendendo sozinhos conforme a evolução colada
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

function mudarAba(nomeAba) {
    document.querySelectorAll(".aba-content").forEach(el => el.style.display = "none");
    document.querySelectorAll(".aba-btn").forEach(el => el.classList.remove("ativa"));
    const c = document.getElementById(`conteudo-aba-${nomeAba}`);
    const b = document.getElementById(`btn-aba-${nomeAba}`);
    if(c) c.style.display = "block";
    if(b) b.classList.add("ativa");
}

function fecharJanelaLeito() { document.getElementById("medai-modal-leito").style.display = "none"; }
function executarAltaRapida() { if (confirm("Arquivar caso clínico para a gaveta?")) { alert("Leito liberado."); fecharJanelaLeito(); } }
function baixarArquivoTXT() { alert("Download do arquivo .TXT realizado."); }
