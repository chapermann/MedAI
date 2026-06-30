import os
import requests
from typing import Dict, Any
from app.config import settings

class AIEngine:
    def __init__(self):
        # Endereço padrão do Ollama rodando localmente no MacBook/Ubuntu
        self.ollama_url = getattr(settings, "OLLAMA_URL", "http://localhost:11434/api/generate")
        self.model_name = getattr(settings, "OLLAMA_MODEL", "qwen2.5:3b")
        # Caminho base para os arquivos espelho de prompts (.md)
        self.prompts_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts")

    def _load_prompt_template(self, filename: str) -> str:
        """
        Carrega o template do prompt isolado do código, mantendo o versionamento auditável.
        """
        path = os.path.join(self.prompts_dir, filename)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Template de prompt não localizado em: {path}")
        with open(path, "r", encoding="utf-8") as file:
            return file.read()

    def generate_clinical_product(self, prompt_type: str, snapshot_data: Dict[str, Any]) -> str:
        """
        Orquestra a montagem do prompt assistencial e dispara a execução local.
        prompt_type: 'evolucao.md', 'passagem.md', 'round.md'
        """
        try:
            # 1. Carrega as diretrizes do especialista em IA
            template = self._load_prompt_template(prompt_type)
            
            # 2. Constrói o contexto injetando a verdade única do banco relacional
            system_context = (
                "Você é o MedAI, uma Secretária Executiva de Alta Especialidade Médica.\n"
                "Siga rigorosamente as Leis de Ferro abaixo:\n"
                "- NUNCA invente, deduza ou complete lacunas utilizando imaginação (Navalha de Occam).\n"
                "- Se um dado clínico não estiver disponível na entrada, responda estritamente:\n"
                "  'Não foi possível localizar esta informação na documentação disponível.'\n"
                "- Seja cirúrgico, objetivo, gentil e profissional. Não elogie a equipe.\n\n"
                f"### DIRETRIZES DO ESPECIALISTA:\n{template}"
            )
            
            # Formata os dados de entrada do Dia Assistencial de forma legível
            input_payload = f"### SNAPSHOT CLÍNICO DO DIA ASSISTENCIAL:\n{snapshot_data}"

            # 3. Dispara a requisição HTTP estruturada para o motor Ollama local
            response = requests.post(
                self.ollama_url,
                json={
                    "model": self.model_name,
                    "prompt": f"{system_context}\n\n{input_payload}",
                    "stream": False,  # Desativado para simplificar a persistência inicial na v0.1
                    "options": {
                        "temperature": 0.1  # Baixa temperatura para mitigar qualquer risco de alucinação
                    }
                },
                timeout=60
            )
            
            if response.status_code == 200:
                return response.json().get("response", "").strip()
            else:
                return f"Erro no AI Engine (Ollama Status {response.status_code}): {response.text}"
                
        except Exception as e:
            return f"Falha crítica na execução do AI Engine: {str(e)}"
