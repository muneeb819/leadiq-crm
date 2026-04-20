import httpx
from config.settings import settings
from typing import List

def search_serp(query: str) -> List[dict]:
    if not settings.serp_api_key:
        return []
    
    with httpx.Client(timeout=10) as client:
        resp = client.get(
            "https://serpapi.com/search",
            params={"q": query + " CEO OR CTO OR founder site:linkedin.com", "api_key": settings.serp_api_key, "num": 5},
        )
        if resp.status_code != 200:
            return []
        
        results = resp.json().get("organic_results", [])
        leads = []
        for r in results[:5]:
            title_parts = r.get("title", "").split(" - ")
            if len(title_parts) >= 2:
                name_parts = title_parts[0].strip().split(" ", 1)
                leads.append({
                    "firstName": name_parts[0],
                    "lastName": name_parts[1] if len(name_parts) > 1 else "",
                    "title": title_parts[1].strip() if len(title_parts) > 1 else "",
                    "linkedinUrl": r.get("link"),
                    "source": "SERP",
                    "notes": r.get("snippet", "")[:200],
                })
        return leads
