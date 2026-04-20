from .base_agent import BaseAgent

SYSTEM = """You are an expert lead enrichment agent. Given a person's name, title, and company,
research and enrich their profile. Return structured JSON with the enriched information.
Focus on: professional background, company context, potential pain points, and conversation starters."""

class EnrichmentAgent(BaseAgent):
    def enrich(self, lead: dict) -> dict:
        name = f"{lead.get('firstName', '')} {lead.get('lastName', '')}"
        company = lead.get('company', {})
        company_name = company.get('name', '') if company else ''
        title = lead.get('title', '')

        prompt = f"""Enrich this lead profile:
Name: {name}
Title: {title}
Company: {company_name}
Email: {lead.get('email', 'unknown')}
LinkedIn: {lead.get('linkedinUrl', 'unknown')}
GitHub: {lead.get('githubUrl', 'unknown')}

Return JSON with keys: notes (string with enriched bio and insights), tags (array of 3-5 relevant tags like 'decision-maker', 'technical', 'startup', 'founder', 'enterprise')"""

        result = self.call_claude_json(SYSTEM, prompt)
        return {
            "notes": result.get("notes", ""),
            "tags": result.get("tags", []),
        }
