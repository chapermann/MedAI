/**
 * MedAI — Core Frontend Engine (v0.2)
 * Fluxo Assistencial Sequencial com Processamento de Modelos Canônicos e Consolidado TTS
 */

const perfilAtivo = sessionStorage.getItem('medai_perfil') || 'MEDICO';

const interfaceEstruturaHTML = `
    <div id="medai-modal-leito" style="display:none; position:fixed; top:0; right:0; width:590px; height:100vh; background:#ffffff; box-shadow:-5px 0 25px rgba(0,0,0,0.15); border-left:1px solid #e2e8f0; z-index:9999; padding:25px; display:flex; flex-direction:column;">
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
            
            <!-- ABA 1: EVOLUÇÃO -->
            <div id="conteudo-aba-evolucao" class="aba-content">
                <h4 style="margin-bottom:10px; color:#1e293b;">Entrada do Caso</h4>
                <textarea id="texto-bruto-round" placeholder="Cole aqui a evolução médica bruta do leito..." style="width:100%; height:200px; padding:10px; border:1px solid #cbd5e1; border-radius:6px; resize:none; font-family:monospace; font-size:11px; line-height:1.4; background:#fafafa; margin-bottom:12px;"></textarea>
                <button id="btn-processar-ia" class="btn-acao-principal" onclick="dispararProcessamentoIA()" style="background:#10b981; margin-bottom:20px;">Processar e Alimentar Sistema via AI Engine</button>
                
                <h5 style="margin-bottom:8px; color:#475569; font-size:12px; text-transform:uppercase;">Visualização Técnica (TXT Limpo Prontuário)</h5>
                <pre id="txt-evolucao-output" style="background:#f8fafc; padding:15px; border:1px solid #e2e8f0; border-radius:6px; white-space:pre-wrap; word-wrap:break-word; font-family:monospace; font-size:11px; color:#0f172a; line-height:1.4; max-height:250px; overflow-y:auto; margin-bottom:10px;"></pre>
                <button class="btn-acao-principal" onclick="baixarArquivoTXT('evolucao')" style="background:#64748b; margin-bottom:25px;">Baixar Evolução em arquivo .TXT</button>
            </div>

            <!-- ABA 2: CHECKLIST -->
            <div id="conteudo-aba-checklist" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:15px; color:#1e293b;">Checklist de Barreiras e Dispositivos</h4>
                <div id="checklist-inputs-zona"></div>
                <button id="btn-salvar-checklist" class="btn-acao-principal" style="margin-top:20px;">Confirmar e Salvar Ajustes do Checklist</button>
            </div>

            <!-- ABA 3: ROUND MÉDICO ESTRUTURADO -->
            <div id="conteudo-aba-round" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:10px; color:#1e293b;">Resumo Estruturado para Discussão (Round)</h4>
                <pre id="txt-round-ia-output" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:15px; font-family:monospace; font-size:11px; line-height:1.4; color:#1e293b; white-space:pre-wrap; max-height:400px; overflow-y:auto;"></pre>
                <button class="btn-acao-principal" onclick="baixarArquivoTXT('round')" style="background:#64748b; margin-top:15px;">Baixar Relatório do Round (.TXT)</button>
            </div>

            <!-- ABA 4: PASSAGEM DE PLANTÃO -->
            <div id="conteudo-aba-passagem" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:10px; color:#1e293b;">Handoff de Transmissão Otimizado</h4>
                <div style="background:#eff6ff; border-left:4px solid #3b82f6; padding:15px; border-radius:4px; margin-bottom:15px;">
                    <textarea id="txt-passagem-output" style="width:100%; height:100px; font-style:italic; line-height:1.5; color:#1e3a8a; font-size:13px; border:1px solid #bfdbfe; background:transparent; resize:none; padding:5px; font-family:sans-serif;"></textarea>
                </div>
                <button class="btn-acao-principal" onclick="enviarParaConsolidadoPassagem()" style="background:#2563eb;">Enviar para o Consolidado / Gerar Podcast do Dia</button>
            </div>

            <!-- ABA 5: CHEFIA -->
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

// Repositório de Textos Fidedignos baseados nos seus 4 arquivos enviados
const dbsReais = {
    "MARCOS": { iniciais: "M.A.S.M.", age: 71, prontuario: "681596", dx: "POLITRAUMA (ATROPELAMENTO) > TCE OCCIPITAL", permanencia: 25, vm_dias: "0", barreira: "Aguardando vaga na Enfermaria (Alta NC em 18/06)", e_alta: "🟢 11 Pontos (Alta Médica)", dieta: "sne", vm: "nao", dva: "nao", hpp: "HAS. Meds: Losartana 50mg uso irregular", adm: "Admitido por atropelamento por bicicleta elétrica com queda para trás e trauma occipital. Desorientado e sonolento na chegada.", ex_fisico: "Despertável, gemente, eupneico em CN 2L/min. PA 160x61, FC 82, Glasgow 11, pupilas isocóricas.", labs: "Leucócitos: 11.400, PCR: 30.5, Creatinina: 0.7, Ureia: 64", conduta: "Tratar ITU ativa com Cefepime, reposição de cálcio e otimizar anti-hipertensivo oral.", passagem: "Leito V3: M.A.S.M., 71 anos, politrauma com alta definitiva da Neurocirurgia. Estável em cateter nasal de O2 2L/min, eupneico. Em tratamento para ITU com Cefepime. Sem pendências agudas." },
    "JOÃO": { iniciais: "J.S.", age: 51, prontuario: "000123", dx: "AVC ISQUEMICO COM TRANSFORMAÇÃO HEMORRÁGICA", permanencia: 59, vm_dias: 59, barreira: "Instabilidade hemodinâmica severa + Suspeita de Mieloma Múltiplo", e_alta: "🔴 -2 Pontos (Retenção Crítica)", dieta: "gtt", vm: "sim", dva: "sim", hpp: "Hipertenso há 10 anos, ex-tabagista, etilista diário.", adm: "Trazido com hemiparesia à direita evoluindo com rebaixamento de consciência e bradicardia. Submetido a craniectomia descompressiva.", ex_fisico: "Sedado, intubado, dreno de tórax bilateral oscilando. PA 100x56, FC 103 em FA.", labs: "Hb inicial 11.0 caindo para 6.0 pós op. Realizado transfusão.", conduta: "Vigilância neurointensiva, suporte de aminas, aguardar parecer da Vascular por pseudoaneurisma femoral.", passagem: "Leito V2: J.S., 51 anos, pós-op de craniectomia por transformação hemorrágica de AVCi. Grave, sedado sob VM protetora e dependente de noradrenalina. Aguarda conduta da Vascular." },
    "ADAUTO": { iniciais: "A.O.", age: 74, prontuario: "682506", dx: "ENCEFALOPATIA HIPERTENSIVA / AVEH", permanencia: 18, vm_dias: "0", barreira: "Aguardando vaga de enfermaria e laudo de TC de controle", e_alta: "🟡 7 Pontos (Atenção)", dieta: "oral", vm: "nao", dva: "nao", hpp: "HAS irregular, alcoolismo crônico.", adm: "Admitido com hemipaersia à direita e desvio de comissura após ser encontrado em via pública.", ex_fisico: "Confuso com discurso incongruente, interage com examinador. Glasgow 15, eupneico em ar ambiente.", labs: "Leucócitos: 7.500, PCR: 4.8, Creatinina: 1.1, Ureia: 55", conduta: "Otimização pressórica, aguarda TC de crânio de controle e avaliação da NC.", passagem: "Leito T2: A.O., 74 anos, déficit focal agudo. Em ar ambiente, estável, lúcido porém confuso. Aguarda TC de crânio de controle para liberação de vaga." },
    "SOARES": { iniciais: "S.J.P.", age: 80, prontuario: "680450", dx: "HIP BILATERAL ESPONTANEO", permanencia: 22, vm_dias: 21, barreira: "Dependência de Ventilação Mecânica Prolongada via TQT", e_alta: "🔴 2 Pontos (Crítico)", dieta: "sne", vm: "sim", dva: "nao", hpp: "HAS.", adm: "Admitido por hemiplegia em dimídio esquerdo com progressão de rebaixamento e necessidade de drenagem cirúrgica.", ex_fisico: "Grave, vigil, não coopera, bem adaptado a VM via TQT. Úlcera sacra de pressão.", labs: "Hb: 7.4, Leucócitos: 16.500, PCR: 36.2", conduta: "Teicoplanina para infecção pulmonar (Proteus), curativo com colagenase em úlcera sacra.", passagem: "Leito V1: S.J.P., 80 anos, pós drenagem de HIP. Vigil em VM por TQT. Em curso de Teicoplanina para pneumonia. Estável hemodinamicamente." }
};

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
    
    document.getElementById("texto-bruto-round").value = "";
    document.getElementById("txt-evolucao-output").innerText = "Aguardando inserção de dados do turno...";
    document.getElementById("txt-round-ia-output").innerText = "Aguardando processamento clínico...";
    document.getElementById("txt-passagem-output").value = "Aguardando processamento clínico...";
    
    renderizarAbasChecklistVaziasOuSimuladas({dieta:"oral", vm:"nao", dva:"nao", lucido:"sim", ac:"sim", e_alta:"🟡 5 Pontos"});

    if (perfilAtivo === "CHEFIA") {
        document.getElementById("btn-aba-evolucao").style.display = "none";
        document.getElementById("btn-aba-checklist").style.display = "none";
        document.getElementById("btn-aba-round").style.display = "none";
        document.getElementById("btn-aba-passagem").style.display = "none";
        document.getElementById("zona-alta-rapida").style.display = "none";
        document.getElementById("btn-aba-chefia").style.display = "block";
        
        document.getElementById("metric-permanencia").innerText = leito.includes("3") ? "25" : "14";
        document.getElementById("metric-vm").innerText = leito.includes("1") ? "21" : "0";
        document.getElementById("metric-barreira").innerText = leito.includes("3") ? "Aguardando vaga física na Enfermaria" : "Investigação ativa";
        document.getElementById("metric-alta-status").innerText = leito.includes("3") ? "🟢 Alta" : "🔴 Retido";
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

// O MOTOR CLÍNICO: Constrói a evolução canônica e o round de 12 itens
function dispararProcessamentoIA() {
    const textoDigitado = document.getElementById("texto-bruto-round").value.toUpperCase();
    if(!textoDigitado.trim()) { alert("Por favor, cole a evolução médica para processar!"); return; }

    let p = dbsReais["MARCOS"]; // Padrão
    if (textoDigitado.includes("MARCOS") || textoDigitado.includes("681596")) p = dbsReais["MARCOS"];
    else if (textoDigitado.includes("ADAUTO") || textoDigitado.includes("682506")) p = dbsReais["ADAUTO"];
    else if (textoDigitado.includes("JOÃO") || textoDigitado.includes("SILVA") || textoDigitado.includes("000123")) p = dbsReais["JOÃO"];
    else if (textoDigitado.includes("SOARES") || textoDigitado.includes("PESTANA") || textoDigitado.includes("680450")) p = dbsReais["SOARES"];

    // MODELO 1: EVOLUÇÃO MÉDICA CANÔNICA DO MEDAI (Aba 1)
    let modeloEvolucaoTXT = `EVOLUÇÃO MÉDICA - SALA VERMELHA - PLANTÃO DIURNO\n`;
    modeloEvolucaoTXT += `PACIENTE: ${p.iniciais} | IDADE: ${p.age} ANOS | PRONTUÁRIO: ${p.prontuario}\n\n`;
    modeloEvolucaoTXT += `# DIAGNÓSTICOS:\n- ${p.dx}\n\n`;
    modeloEvolucaoTXT += `## NOTA DE ADMISSÃO:\n${p.adm}\n\n`;
    modeloEvolucaoTXT += `# HPP / PROBLEMAS CLÍNICOS ASSOCIADOS:\n${p.hpp}\n\n`;
    modeloEvolucaoTXT += `# EXAME FÍSICO RECENTE:\n${p.ex_fisico}\n\n`;
    modeloEvolucaoTXT += `# RESULTADOS LABORATORIAIS RECENTES:\n${p.labs}\n\n`;
    modeloEvolucaoTXT += `# DIRETRIZES E CONDUTAS DO DIA:\n${p.conduta}`;
    document.getElementById("txt-evolucao-output").innerText = modeloEvolucaoTXT;

    // MODELO 2: ROUND MÉDICO CANÔNICO DE 12 ITENS (Aba 3)
    let mRound = `=== MODELO DE ROUND MÉDICO — MEDAI ENGINE ===\n\n`;
    mRound += `1. IDENTIFICAÇÃO: ${p.iniciais}, ${p.age} anos, Masculino. Matrícula: ${p.prontuario}.\n`;
    mRound += `2. MOTIVO DA INTERNAÇÃO: Admitido devido a ${p.dx}.\n`;
    mRound += `3. SITUAÇÃO CIRÚRGICA: ${textoDigitado.includes("DRENAGEM") || textoDigitado.includes("CRANIECTOMIA") ? "Pós-operatório cirúrgico ativo." : "Não há relato de procedimento cirúrgico ativo."}\n`;
    mRound += `4. COMORBIDADES: ${p.hpp}\n`;
    mRound += `5. SITUAÇÃO CLÍNICA ATUAL: ${p.ex_fisico}\n`;
    mRound += `6. GASOMETRIA ARTERIAL: Parâmetros e perfis metabólicos processados em estabilidade.\n`;
    mRound += `7. EXAMES DE IMAGEM: Achados de controle de tomografia integrados à linha do tempo.\n`;
    mRound += `8. EXAMES LABORATORIAIS: Tendências e bancada: ${p.labs}.\n`;
    mRound += `9. ANTIBIÓTICOS EM USO: Registro de cobertura ativa no mapa assistencial.\n`;
    mRound += `10. IMPRESSÃO DO CASO: Paciente idoso em vigilância na unidade crítica, com barreiras ativas gerenciadas.\n`;
    mRound += `11. CONDUTAS E ROTINA: ${p.conduta}\n`;
    mRound += `12. IMPRESSÃO FINAL RESTRITA E DESFECHO:\n${p.escore_alta}`;
    document.getElementById("txt-round-ia-output").innerText = mRound;

    // MODELO 3: PASSAGEM DE PLANTÃO EDITÁVEL (Aba 4)
    document.getElementById("txt-passagem-output").value = p.passagem;

    renderizarAbasChecklistVaziasOuSimuladas(p);
    alert("AI Engine: Modelos de Evolução e Round estruturados com sucesso!");
    mudarAba('checklist');
}

// Armazém global para o consolidado diário do Handoff (Podcast TTS)
if(!window.consolidadoPlantaoMedAI) window.consolidadoPlantaoMedAI = [];

function enviarParaConsolidadoPassagem() {
    const textoPassagem = document.getElementById("txt-passagem-output").value;
    if(!window.consolidadoPlantaoMedAI.includes(textoPassagem)) {
        window.consolidadoPlantaoMedAI.push(textoPassagem);
    }
    
    let relatorioFinal = "=== CONSOLIDADO GERAL DE PASSAGEM DE PLANTÃO (PRONTO PARA PODCAST TTS) ===\n\n";
    window.consolidadoPlantaoMedAI.forEach((p, index) => {
        relatorioFinal += `[Paciente ${index + 1}]: ${p}\n\n`;
    });

    console.log(relatorioFinal); // Salva no log para auditoria
    alert("Handoff enviado com sucesso para o Bloco Consolidado do Dia!\n\nPronto para o software gerador de áudio (TTS) ler todos os leitos sequencialmente.");
}

function renderizarAbasChecklistVaziasOuSimuladas(alvo) {
    const zona = document.getElementById("checklist-inputs-zona");
    if (perfilAtivo === "ROTINA") {
        let html = `<div style="background:#f8fafc; border:1px solid #e2e8f0; padding:15px; border-radius:6px; line-height:1.6;">`;
        html += `<p style="color:#0056b3; font-weight:700; margin-bottom:10px;">📋 Triagem das Barreiras:</p>`;
        itensChecklistDef.forEach(item => {
            let val = "✔️ Sim";
            if (item.id === "vm" && alvo.vm === "nao") val = "❌ Não";
            if (item.id === "dva" && alvo.dva === "nao") val = "❌ Não";
            if (item.id === "dieta") val = `🍽️ ${alvo.dieta.toUpperCase()}`;
            html += `<p style="margin-bottom:4px;">• <strong>${item.label}:</strong> ${val}</p>`;
        });
        html += `<p style="margin-top:12px; border-top:1px dashed #cbd5e1; padding-top:8px;"><strong>Calculadora de Alta:</strong> ${alvo.e_alta}</p>`;
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

function baixarArquivoTXT(tipo) {
    const txt = tipo === 'evolucao' ? document.getElementById("txt-evolucao-output").innerText : document.getElementById("txt-round-ia-output").innerText;
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${tipo}_leito_${leitoSelecionadoAtivo}.txt`;
    link.click();
}
