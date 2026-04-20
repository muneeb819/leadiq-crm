from .base_agent import BaseAgent

SYSTEM = """You are an expert B2B sales copywriter specializing in cold outreach.
Write personalized, concise, and compelling cold emails that:
- Have a specific subject line referencing their work
- Open with a relevant observation about them or their company
- Clearly state the value proposition in 1-2 sentences
- End with a soft, low-friction CTA
- Sound human, not sales-y. Max 150 words for body."""

class OutreachAgent(BaseAgent):
    def draft_email(self, lead: dict) -> dict:
        name = f"{lead.get('firstName', '')} {lead.get('lastName', '')}"
        company = lead.get('company', {})

        prompt = f"""Write a personalized cold email for this lead:
Name: {name}
Title: {lead.get('title', 'Professional')}
Company: {company.get('name', 'their company') if company else 'their company'}
Industry: {company.get('industry', '') if company else ''}
Notes: {lead.get('notes', '')}
Tags: {', '.join(lead.get('tags', []))}

Product being pitched: LeadIQ — an AI-powered CRM that helps sales teams discover and engage leads faster.

Return JSON with: subject (string), body (string with \\n for line breaks)"""

        result = self.call_claude_json(SYSTEM, prompt)
        return {
            "subject": result.get("subject", f"Quick question for {lead.get('firstName', 'you')}"),
            "body": result.get("body", "Hi,\n\nI came across your profile and thought LeadIQ could help your team close more deals.\n\nWould you be open to a 15-minute call?\n\nBest"),
        }
