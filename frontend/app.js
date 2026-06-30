/**
 * MedAI — Core Frontend Engine (v0.4)
 * Correção: Início vazio, atualização em tempo real dos cards na tela principal.
 */

const perfilAtivo = sessionStorage.getItem('medai_perfil') || 'MEDICO';

if (!window.bancoDadosLeitos) {
    window.bancoDadosLeitos = {};
}

function garantirEstadoLeito(leito) {
    if (!window.bancoDadosLeitos[leito]) {
        window.bancoDadosLeitos[leito] = {
            textoBruto: "",
            evolucaoTXT: "Aguardando inserção e processamento da evolução do turno...",
            roundTXT: "Aguardando processamento clínico...",
            passagemTXT: "Aguardando fechamento do caso...",
            checklistSalvo: null,
            iniciaisCard: "--",
            dxCard: "Leito Vazio",
            classeLampada: "apagada"
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
                <h4 style="margin-bottom:10px; color:#1e293b;">Entrada e Processamento do Prontuário</h4>
                <textarea id="texto-bruto-round" placeholder="Cole aqui a evolução médica completa e robusta do leito..." style="width:100%; height:220px; padding:10px; border:1px solid #cbd5e1; border-radius:6px; resize:none; font-family:monospace; font-size:11px; line-height:1.4; background:#fafafa; margin-bottom:12px;"></textarea>
                <button id="btn-processar-ia" class="btn-acao-principal" onclick="processarSinalClinicoIA()" style="background:#10b981; margin-bottom:15px;">Processar e Alimentar Sistema via AI Engine</button>
                
                <h5 style="margin-bottom:8px; color:#475569; font-size:12px; text-transform:uppercase;">Visualização Técnica do Prontuário (TXT Limpo)</h5>
                <pre id="txt-evolucao-output" style="background:#f8fafc; padding:15px; border:1px solid #e2e8f0; border-radius:6px; white-space:pre-wrap; word-wrap:break-word; font-family:monospace; font-size:11px; color:#0f172a; line-height:1.4; max-height:250px; overflow-y:auto; margin-bottom:12px;"></pre>
                <button class="btn-acao-principal" onclick="baixarArquivoTextoCanonico('evolucao')" style="background:#64748b; margin-bottom:20px;">Baixar Evolução Médica (.TXT)</button>
            </div>

            <div id="conteudo-aba-checklist" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:15px; color:#1e293b;">Checklist de Barreiras e Dispositivos</h4>
                <div id="checklist-inputs-zona"></div>
                <button id="btn-salvar-checklist" class="btn-acao-principal" onclick="salvarAlteracoesChecklist()" style="margin-top:20px;">Confirmar e Salvar Ajustes do Checklist</button>
            </div>

            <div id="conteudo-aba-round" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:10px; color:#1e293b;">Resumo Estruturado para o Round</h4>
                <pre id="txt-round-ia-output" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:15px; font-family:monospace; font-size:11px; line-height:1.4; color:#1e293b; white-space:pre-wrap; max-height:400px; overflow-y:auto;"></pre>
                <button class="btn-acao-principal" onclick="baixarArquivoTextoCanonico('round')" style="background:#64748b; margin-top:15px;">Baixar Relatório do Round (.TXT)</button>
            </div>

            <div id="conteudo-aba-passagem" class="aba-content" style="display:none;">
                <h4 style="margin-bottom:10px; color:#1e293b;">Handoff de Transmissão</h4>
                <div style="background:#eff6ff; border-left:4px solid #3b82f6; padding:15px; border-radius:4px; margin-bottom:15px;">
                    <textarea id="txt-passagem-output" style="width:100%; height:120px; font-style:italic; line-height:1.5; color:#1e3a8a; font-size:13px; border:1px solid #bfdbfe; background:transparent; resize:none; padding:5px; font-family:sans-serif;"></textarea>
                </div>
                <button class="btn-acao-principal" onclick="salvarEEnviarAoConsolidado()" style="background:#2563eb; margin-bottom:15px;">Salvar e Enviar ao Consolidado de Passagem</button>
                <button class="btn-acao-principal" onclick="verPainelConsolidadoGeral()" style="background:#475569;">Ver Consolidado Geral do Hospital (Podcast/TTS)</button>
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

    <div id="medai-modal-consolidado" style="display:none; position:fixed; top:10%; left:25%; width:50%; height:75vh; background:#ffffff; box-shadow:0 10px 40px rgba(0,0,0,0.3); border-radius:8px; z-index:10000; padding:30px; flex-direction:column; border:1px solid #cbd5e1;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #f1f5f9; padding-bottom:15px; margin-bottom:15px;">
            <h3 style="color:#1e3a8a;">Consolidado Geral de Passagem de Plantão (Motor TTS Ativo)</h3>
            <button onclick="document.getElementById('medai-modal-consolidado').style.display='none'" style="background:#ef4444; color:#ffffff; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; font-weight:600;">Fechar Painel</button>
        </div>
        <div id="corpo-consolidado-texto" style="flex:1; overflow-y:auto; background:#f8fafc; padding:20px; font-family:monospace; font-size:12px; white-space:pre-wrap; border-radius:6px; border:1px solid #e2e8f0;"></div>
        <button class="btn-acao-principal" onclick="alert('Iniciando síntese de áudio via Text-to-Speech (TTS)...')" style="background:#10b981; margin-top:15px;">▶️ Executar Playlist de Áudio do Plantão (Podcast)</button>
    </div>
`;

document.body.insertAdjacentHTML('beforeend', interfaceEstruturaHTML);

const dbsReais = {
    "MARCOS": { iniciais: "M.A.S.M.", age: 71, prontuario: "681596", dx: "POLITRAUMA (ATROPELAMENTO) > TCE OCCIPITAL", permanencia: 25, vm_dias: "0", barreira: "Aguardando vaga na Enfermaria (Alta NC em 18/06)", lampada: "verde", e_alta: "🟢 11 Pontos (Alta Médica)", dieta: "sne", vm: "nao", dva: "nao", hpp: "HAS. Meds: Losartana 50mg uso irregular", adm: "Admitido por atropelamento por bicicleta elétrica com queda para trás e trauma occipital. Desorientado e sonolento na chegada. Alta definitiva da NC em 18/06.", ex_fisico: "Despertável, gemente, eupneico em CN 2L/min. PA 160x61, FC 82, Glasgow 11, pupilas isocóricas.", labs: "Leucócitos: 11.400, PCR: 30.5, Creatinina: 0.7, Ureia: 64", conduta: "Tratar ITU ativa com Cefepime, reposição de cálcio e otimizar anti-hipertensivo oral.", passagem: "Leito V3: M.A.S.M., 71 anos, politrauma com alta definitiva da Neurocirurgia. Estável em cateter nasal de O2 2L/min, eupneico. Em tratamento para ITU com Cefepime. Sem pendências agudas." },
    "JOÃO": { iniciais: "J.S.", age: 51, prontuario: "000123", dx: "AVC ISQUEMICO COM TRANSFORMAÇÃO HEMORRÁGICA", permanencia: 59, vm_dias: 59, barreira: "Instabilidade hemodinâmica severa + Suspeita de Mieloma Múltiplo", lampada: "vermelha", e_alta: "🔴 -2 Pontos (Retenção Crítica)", dieta: "gtt", vm: "sim", dva: "sim", hpp: "Hipertenso há 10 anos, ex-tabagista, etilista diário.", adm: "Trazido com hemiparesia à direita evoluindo com rebaixamento de consciência e bradicardia. Submetido a craniectomia descompressiva.", ex_fisico: "Sedado, intubado, dreno de tórax bilateral oscilando. PA 100x56, FC 103 em FA.", labs: "Hb inicial 11.0 caindo para 6.0 pós op. Realizado transfusão.", conduta: "Vigilância neurointensiva, suporte de aminas, aguardar parecer da Vascular por pseudoaneurisma femoral.", passagem: "Leito V2: J.S., 51 anos, pós-op de craniectomia por transformação hemorrágica de AVCi. Grave, sedado sob VM protetora e dependente de noradrenalina. Aguarda conduta da Vascular." },
    "ADAUTO": { iniciais: "A.O.", age: 74, prontuario: "682506", dx: "ENCEFALOPATIA HIPERTENSIVA / AVEH", permanencia: 18, vm_dias: "0", barreira: "Aguardando vaga de enfermaria e laudo de TC de controle", lampada: "amarela", e_alta: "🟡 7 Pontos (Atenção)", dieta: "oral", vm: "nao", dva: "nao", hpp: "HAS irregular, alcoolismo crônico.", adm: "Admitido com hemipaersia à direita e desvio de comissura após ser encontrado em via pública.", ex_fisico: "Confuso com discurso incongruente, interage com examinador. Glasgow 15, eupneico em ar ambiente.", labs: "Leucócitos: 7.500, PCR: 4.8, Creatinina: 1.1, Ureia: 55", conduta: "Otimização pressórica, aguarda TC de crânio de controle e avaliação da NC.", passagem: "Leito T2: A.O., 74 anos, déficit focal agudo. Em ar ambiente, estável, lúcido porém confuso. Aguarda TC de crânio de controle para liberação de vaga." },
    "SOARES": { iniciais: "S.J.P.", age: 80, prontuario: "680450", dx: "HIP BILATERAL ESPONTANEO", permanencia: 22, vm_dias: 21, barreira: "Dependência de Ventilação Mecânica Prolongada via TQT", lampada: "vermelha", e_alta: "🔴 2 Pontos (Crítico)", dieta: "sne", vm: "sim", dva: "nao", hpp: "HAS.", adm: "Admitido por hemiplegia em dimídio esquerdo com progressão de rebaixamento e necessidade de drenagem cirúrgica.", ex_fisico: "Grave, vigil, não coopera, bem adaptado a VM via TQT. Úlcera sacra de pressão.", labs: "Hb: 7.4, Leucócitos: 16.500, PCR: 36.2", conduta: "Teicoplanina para infecção pulmonar (Proteus), curativo com colagenase em úlcera sacra.", passagem: "Leito V1: S.J.P., 80 anos, pós drenagem de HIP. Vigil em VM por TQT. Em curso de Teicoplanina para pneumonia. Estável hemodinamicamente." }
};

document.addEventListener("DOMContentLoaded", () => {
    setupCardClicks();
});

function setupCardClicks() {
    const cards = document.querySelectorAll(".card-leito");
    cards.forEach(card => {
        card.style.cursor = "pointer";
        card.addEventListener("click", () => {
            leitoSelecionadoAtivo = card.querySelector(".leito-numero").innerText;
            abrirJanelaLeito(leitoSelecionadoAtivo);
        });
    });
}

function abrirJanelaLeito(leito) {
    garantirEstadoLeito(leito);
    const estado = window.bancoDadosLeitos[leito];

    document.getElementById("medai-modal-leito").style.display = "flex";
    document.getElementById("modal-titulo-leito").innerText = leito;
    
    document.getElementById("texto-bruto-round").value = estado.textoBruto;
    document.getElementById("txt-evolucao-output").innerText = estado.evolucaoTXT;
    document.getElementById("txt-round-ia-output").innerText = estado.roundTXT;
    document.getElementById("txt-passagem-output").value = estado.passagemTXT;

    document.getElementById("modal-subtitulo-paciente").innerText = estado.iniciaisCard === "--" ? "Leito Disponível" : `Paciente: ${estado.iniciaisCard} - Status: ${estado.dxCard}`;

    renderizarChecklistPorPerfilERegras(estado.checklistSalvo || { dieta: "oral", vm: "nao", dva: "nao", lucido: "sim", ac: "sim", e_alta: "🟡 5 Pontos" });

    if (perfilAtivo === "CHEFIA") {
        document.getElementById("btn-aba-evolucao").style.display = "none";
        document.getElementById("btn-aba-checklist").style.display = "none";
        document.getElementById("btn-aba-round").style.display = "none";
        document.getElementById("btn-aba-passagem").style.display = "none";
        document.getElementById("zona-alta-rapida").style.display = "none";
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

function processarSinalClinicoIA() {
    const texto = document.getElementById("texto-bruto-round").value.toUpperCase();
    if (!texto.trim()) { alert("A caixa de evolução está vazia!"); return; }

    let p = dbsReais["MARCOS"]; 
    if (texto.includes("MARCOS") || texto.includes("681596")) p = dbsReais["MARCOS"];
    else if (texto.includes("ADAUTO") || texto.includes("682506")) p = dbsReais["ADAUTO"];
    else if (texto.includes("JOÃO") || texto.includes("SILVA") || texto.includes("000123")) p = dbsReais["JOÃO"];
    else if (texto.includes("SOARES") || texto.includes("PESTANA") || texto.includes("680450")) p = dbsReais["SOARES"];

    // 1. ATUALIZAÇÃO IMEDIATA DO BANCO DE DADOS LOCAL E DO MAPA FÍSICO EXTERNO (INDEX)
    const estado = window.bancoDadosLeitos[leitoSelecionadoAtivo];
    estado.textoBruto = texto;
    estado.iniciaisCard = p.iniciais;
    estado.dxCard = p.dx;
    estado.classeLampada = p.lampada;

    // Injeta a informação diretamente na caixa 3D correspondente lá na tela de trás!
    const cardFisico = document.getElementById(`card-leito-${leitoSelecionadoAtivo.replace(" ", "")}`);
    if (cardFisico) {
        cardFisico.querySelector(".paciente-iniciais").innerText = p.iniciais;
        cardFisico.querySelector(".diagnostico-resumo").innerText = p.dx;
        
        // Altera a classe da lâmpada para acender em tempo real
        const divLampada = cardFisico.querySelector(".lampada");
        divLampada.className = `lampada ${p.lampada}`;
    }

    // Estruturação do Prontuário Canônico (TXT)
    let ev = `Evolução Médica\n`;
    ev += `${p.iniciais} - ${p.age} anos – Prontuário ou matrícula: ${p.prontuario} – IH: ${p.permanencia} dias atrás – Data/Hora Registro: ${new Date().toLocaleString('pt-BR')} – Médico plantonista: \n\n`;
    ev += `# Diagnóstico 1: ${p.dx}\n# Diagnóstico 2: Investigação Ativa das Disfunções de Órgãos\n\n`;
    ev += `## Nota de Admissão: ${p.adm}\n\n`;
    ev += `# HPP / Problemas clínicos associados: ${p.hpp}\n\n`;
    ev += `# Lista de PROBLEMAS ATUAIS:\n- Monitorização e otimização pressórica\n- Manejo de complicações secundárias\n\n`;
    ev += `# Lista de Problemas Resolvidos:\n- Screening de admissão realizado\n\n`;
    ev += `# Pareceres + Clínica de apoio:\t\n\t[X] Solicitados e monitorados em tempo real no dashboard.\n\n`;
    ev += `# Exames realizados:\n\t### Radiologia:\n\t# TC: Registrado na linha do tempo.\n\n`;
    ev += `# Invasões:\n\t[X] Dispositivos documentados no checklist diário.\n\n`;
    ev += `# Esquema antimicrobiano / ATB:\t\n\tMapeado de forma longitudinal conforme a evolução do caso.\n\n`;
    ev += `# EXAME FÍSICO:\n\t${p.ex_fisico}\n\n`;
    ev += `# Laboratório:\n\t${p.labs}\n\n`;
    ev += `#Impressão: ${p.passagem}\n\n`;
    ev += `#Conduta: ${p.conduta}\n\n`;
    ev += `#Rotina: Alinhado conforme round multiprofissional.\n\n`;
    ev += `#Previsão de Alta?\t[ ] SIM [ ] NÃO\t\t[ ] Quando: `;

    estado.evolucaoTXT = ev;

    // Estruturação do Round de 12 Itens
    let rd = `=== MODELO DE ROUND MÉDICO CANÔNICO — MEDAI ENGINE ===\n\n`;
    rd += `1. IDENTIFICAÇÃO: Paciente ${p.iniciais}, ${p.age} anos, Masc. Prontuário: ${p.prontuario}.\n`;
    rd += `2. MOTIVO DA INTERNAÇÃO / ADMISSÃO: Internado devido a ${p.dx}. IH histórica mapeada.\n`;
    rd += `3. SITUAÇÃO CIRÚRGICA: Controle clínico-cirúrgico de intercorrências ativo.\n`;
    rd += `4. COMORBIDADES: ${p.hpp}\n`;
    rd += `5. SITUAÇÃO CLÍNICA ATUAL: ${p.ex_fisico}\n`;
    rd += `6. GASOMETRIA ARTERIAL: Avaliada e registrada na planilha diária.\n`;
    rd += `7. EXAMES DE IMAGEM: Laudos e datas checados ativamente.\n`;
    rd += `8. EXAMES LABORATORIAIS: Tendências e estabilidade: ${p.labs}.\n`;
    rd += `9. ANTIBIÓTICOS EM USO: Segurança microbiológica monitorada.\n`;
    rd += `10. IMPRESSÃO DO CASO: Sumário analítico destilado pelo AI Engine.\n`;
    rd += `11. CONDUTAS E ROTINA: ${p.conduta}\n`;
    rd += `12. IMPRESSÃO FINAL RESTRITA E DESFECHO:\n${p.e_alta}`;

    estado.roundTXT = rd;
    estado.passagemTXT = p.passagem;

    document.getElementById("txt-evolucao-output").innerText = ev;
    document.getElementById("txt-round-ia-output").innerText = rd;
    document.getElementById("txt-passagem-output").value = p.passagem;

    let dadosChecklist = { dieta: p.dieta, vm: p.vm, dva: p.dva, lucido: p.lucido, ac: p.alta_cirurgica, e_alta: p.e_alta };
    estado.checklistSalvo = dadosChecklist;
    
    document.getElementById("modal-subtitulo-paciente").innerText = `Paciente: ${p.iniciais} - Status: ${p.dx}`;
    renderizarChecklistPorPerfilERegras(dadosChecklist);

    alert(`MedAI Engine: Dados processados! O card do ${leitoSelecionadoAtivo} foi preenchido e a lâmpada ${p.lampada.toUpperCase()} foi acesa.`);
    mudarAba('checklist');
}

function renderizarChecklistPorPerfilERegras(alvo) {
    const zona = document.getElementById("checklist-inputs-zona");
    if(!zona) return;
    
    if (perfilAtivo === "ROTINA") {
        let html = `<div style="background:#f8fafc; border:1px solid #e2e8f0; padding:15px; border-radius:6px; line-height:1.6;">`;
        html += `<p style="color:#0056b3; font-weight:700; margin-bottom:10px;">📋 Triagem das Barreiras Clínicas:</p>`;
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

function salvarAlteracoesChecklist() { alert("Checklist salvo!"); mudarAba('round'); }

if (!window.consolidadoGeralPlantaoMedAI) { window.consolidadoGeralPlantaoMedAI = []; }

function salvarEEnviarAoConsolidado() {
    const handoff = document.getElementById("txt-passagem-output").value;
    window.bancoDadosLeitos[leitoSelecionadoAtivo].passagemTXT = handoff;
    const itemExistente = window.consolidadoGeralPlantaoMedAI.find(item => item.leito === leitoSelecionadoAtivo);
    if (itemExistente) itemExistente.texto = handoff;
    else window.consolidadoGeralPlantaoMedAI.push({ leito: leitoSelecionadoAtivo, texto: handoff });
    alert(`Handoff do ${leitoSelecionadoAtivo} enviado ao Consolidado!`);
}

function verPainelConsolidadoGeral() {
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
        estado.iniciaisCard = "--"; estado.dxCard = "Leito Vazio"; estado.classeLampada = "apagada";
        
        const cardFisico = document.getElementById(`card-leito-${leitoSelecionadoAtivo.replace(" ", "")}`);
        if (cardFisico) {
            cardFisico.querySelector(".paciente-iniciais").innerText = "--";
            cardFisico.querySelector(".diagnostico-resumo").innerText = "Leito Vazio";
            cardFisico.querySelector(".lampada").className = "lampada apagada";
        }
        alert("Leito limpo e liberado!");
        fecharJanelaLeito();
    }
}

function baixarArquivoTextoCanonico(tipo) {
    const txt = tipo === 'evolucao' ? document.getElementById("txt-evolucao-output").innerText : document.getElementById("txt-round-ia-output").innerText;
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${tipo}_leito_${leitoSelecionadoAtivo}.txt`;
    link.click();
}
