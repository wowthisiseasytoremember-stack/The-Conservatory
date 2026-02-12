import os
import ast
import json
import logging
import traceback
from typing import Dict, Any

# Configure minimal logging for visibility during development
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Dependency Check
try:
    import vertexai
    from vertexai.generative_models import GenerativeModel, GenerationConfig
    VERTEX_AVAILABLE = True
except ImportError:
    VERTEX_AVAILABLE = False

class AIContractor:
    """
    Phase 1 Core: Context-Aware Executive Contractor.
    Drop this into any project root. 
    It scans Python DNA and generates copy-paste prompts for your IDE.
    """
    def __init__(self, project_id: str, location: str = "us-central1", model_name: str = "gemini-1.5-flash"):
        self.project_id = project_id
        self.location = location
        self.model_name = model_name
        self.root = os.getcwd()
        
        if VERTEX_AVAILABLE and project_id:
            try:
                vertexai.init(project=self.project_id, location=self.location)
                self.model = GenerativeModel(self.model_name)
            except Exception as e:
                logging.error(f"Failed to initialize Vertex AI: {e}")
                VERTEX_AVAILABLE = False
        
        self.ignore_list = {'.git', '__pycache__', '.venv', 'venv', 'env', 'node_modules', '.idea', '.vscode'}

    def _scan_dna(self) -> Dict[str, Any]:
        """Scans local Python files for structure (DNA)."""
        dna = {"files": {}}
        
        for dirpath, dirnames, files in os.walk(self.root):
            dirnames[:] = [d for d in dirnames if d not in self.ignore_list]
            
            for f in files:
                if f.endswith(".py") and f != "ai_contractor.py":
                    path = os.path.relpath(os.path.join(dirpath, f), self.root)
                    try:
                        with open(os.path.join(dirpath, f), "r", encoding="utf-8") as src:
                            tree = ast.parse(src.read())
                            file_meta = {"classes": [], "top_level_functions": []}
                            
                            for node in tree.body: # Iterate top-level nodes only
                                if isinstance(node, ast.ClassDef):
                                    methods = [n.name for n in node.body if isinstance(n, ast.FunctionDef)]
                                    file_meta["classes"].append({"name": node.name, "methods": methods})
                                elif isinstance(node, ast.FunctionDef):
                                    file_meta["top_level_functions"].append(node.name)
                            
                            dna["files"][path] = file_meta
                    except Exception as e:
                        logging.debug(f"Skipping {path} due to parse error: {e}")
        return dna

    def get_ide_instructions(self, user_intent: str) -> Dict[str, str]:
        """
        Primary Interface: Returns structured JSON for any adapter (CLI/GUI/Web).
        """
        if not VERTEX_AVAILABLE:
            return {
                "explanation": "Dependency Error",
                "terminal_commands": "pip install google-cloud-aiplatform",
                "master_ide_prompt": "Error: Vertex AI SDK not found or Project ID missing."
            }

        dna_summary = self._scan_dna()
        
        system_prompt = f"""
        You are an AI Executive Contractor. 
        Your goal: Translate user intent into a technical prompt for an AI-powered IDE (Cursor/Copilot).

        PROJECT CONTEXT (DNA):
        {json.dumps(dna_summary, indent=2)}

        RULES:
        1. REFERENCE existing files, classes, and functions from the context.
        2. NO generic advice. Provide specific, directive instructions for the IDE.
        3. Explain what will happen, list any terminal commands, and provide the Master IDE Prompt.
        4. Output MUST be valid JSON.
        """

        try:
            response = self.model.generate_content(
                [system_prompt, f"User Intent: {user_intent}"],
                generation_config=GenerationConfig(response_mime_type="application/json")
            )
            return json.loads(response.text)
        except Exception as e:
            logging.error(traceback.format_exc())
            return {
                "explanation": "AI generation failed.",
                "terminal_commands": "Check logs.",
                "master_ide_prompt": f"Error: {str(e)}"
            }

# --- PORTABLE CLI ADAPTER ---
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="AI Contractor Phase 1")
    parser.add_argument("--project_id", required=True, help="GCP Project ID")
    parser.add_argument("--query", required=True, help="What do you want to achieve?")
    args = parser.parse_args()

    contractor = AIContractor(project_id=args.project_id)
    result = contractor.get_ide_instructions(args.query)
    
    print("\n" + "="*50)
    print(" AI EXECUTIVE CONTRACTOR - PLAN")
    print("="*50)
    print(f"\n[WHAT]: {result.get('explanation')}")
    print(f"\n[RUN]:  {result.get('terminal_commands')}")
    print(f"\n[MASTER IDE PROMPT (Copy this into Cursor/Copilot)]:")
    print("-" * 50)
    print(f"{result.get('master_ide_prompt')}")
    print("-" * 50)
