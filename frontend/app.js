/**
 * MedAI — Core Frontend Engine (v0.1) - CORRIGIDO
 * Gerencia a carga cognitiva, regras de privilégio por perfil e estados do Flipbook.
 */

const perfilAtivo = sessionStorage.getItem('medai_perfil') || 'MEDICO';

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

document.body.insertAdjacentHTML('beforeend', interfaceEstruturaHTML);

const estilosMestres = document.createElement("style");
estilosMestres.innerHTML = `
    .aba-btn { background:none; border:none; padding:6px 12px; cursor:pointer; font-size:13px; font-weight:600; color:#64748b; border-radius:4px; }
    .aba-btn.ativa { background:#0056b3; color:#ffffff !important; }
    .btn-acao-principal { width:100%; padding:10px; border:none; border-radius:6px; background:#0056b3; color:#ffffff; font-weight:700; cursor:pointer; }
`;
document.head.appendChild(estilosMestres);

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        const cards = document.querySelectorAll(".card-leito");
        cards.forEach(card => {
            card.style.cursor = "pointer";
            card.addEventListener("click", () => {
                const tituloLeito = card.querySelector(".leito-numero").innerText;
                const iniciais
