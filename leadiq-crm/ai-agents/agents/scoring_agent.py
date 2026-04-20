from .base_agent import BaseAgent

SYSTEM = """You are a B2B lead scoring expert. Score leads based on their fit as a potential customer.
Consider: seniority (decision-making power), company size and growth, technology stack alignment,
budget indicators, and engagement signals. Return a score 0-100 with clear reasoning."""

class ScoringAgent(BaseAgent):
    def score(self, lead: dict) -> dict:
        name = f"{lead.get('firstName', '')} {lead.get('lastName', '')}"
        company = lead.get('company', {})

        prompt = f"""Score this B2B lead for a SaaS CRM product:
Name: {name}
Title: {lead.get('title', 'Unknown')}
Company: {company.get('name', 'Unknown') if company else 'Unknown'}
Industry: {company.get('industry', 'Unknown') if company else 'Unknown'}
Company Size: {company.get('size', 'Unknown') if company else 'Unknown'}
Source: {lead.get('source', 'Unknown')}
Tags: {', '.join(lead.get('tags', []))}
Notes: {lead.get('notes', 'None')}

Return JSON with: score (integer 0-100), reason (2-3 sentence explanation of the score)"""

        result = self.call_claude_json(SYSTEM, prompt)
        score = result.get("score", 50)
        if isinstance(score, str):
            try:
                score = int(score)
            except:
                score = 50
        return {
            "score": max(0, min(100, score)),
            "reason": result.get("reason", "Score based on available profile data."),
        }
