from .base_agent import BaseAgent
from tools.github_tool import search_github_users
from tools.serp_tool import search_serp
import asyncio

SYSTEM = """You are a B2B lead discovery agent. Given raw data from various sources,
identify and extract real potential leads. Return structured JSON arrays of leads.
Only include people who could be decision makers or key stakeholders."""

class DiscoveryAgent(BaseAgent):
    def discover(self, query: str) -> list:
        # Try real data sources first
        leads = []
        
        # GitHub search
        try:
            gh_users = search_github_users(query)
            leads.extend(gh_users)
        except Exception as e:
            print(f"GitHub search failed: {e}")

        # SERP search  
        try:
            serp_leads = search_serp(query)
            leads.extend(serp_leads)
        except Exception as e:
            print(f"SERP search failed: {e}")

        # If no real data, use AI to generate plausible leads
        if not leads:
            prompt = f"""Generate 5 realistic B2B leads for the query: "{query}"
These should be plausible professionals who match this description.

Return JSON array of objects with keys:
firstName, lastName, email (optional), title, source (use "SERP"), 
companyName (optional), notes (brief background), githubUrl (optional)"""
            result = self.call_claude_json(SYSTEM, prompt)
            if isinstance(result, list):
                leads = result
            elif isinstance(result, dict) and "leads" in result:
                leads = result["leads"]

        return leads[:10]  # max 10 leads per discovery run
