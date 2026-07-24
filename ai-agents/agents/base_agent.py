import anthropic
from config.settings import settings
from typing import Optional

class BaseAgent:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key) if settings.anthropic_api_key else None
        self.model = settings.anthropic_model
        self.max_tokens = settings.anthropic_max_tokens

    def call_claude(self, system: str, prompt: str) -> str:
        if not self.client:
            return '{"error": "No Anthropic API key configured"}'
        message = self.client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            system=system,
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text

    def call_claude_json(self, system: str, prompt: str) -> dict:
        import json, re
        raw = self.call_claude(system + "\n\nRespond ONLY with valid JSON. No markdown, no explanation.", prompt)
        raw = re.sub(r'^```json\s*', '', raw.strip())
        raw = re.sub(r'\s*```$', '', raw)
        try:
            return json.loads(raw)
        except Exception:
            return {"error": "Failed to parse JSON", "raw": raw}
