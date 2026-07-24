import httpx
from config.settings import settings
from typing import List

def search_github_users(query: str) -> List[dict]:
    if not settings.github_token:
        return []
    
    headers = {
        "Authorization": f"token {settings.github_token}",
        "Accept": "application/vnd.github.v3+json",
    }
    
    with httpx.Client(timeout=10) as client:
        resp = client.get(
            "https://api.github.com/search/users",
            params={"q": query, "per_page": 5},
            headers=headers,
        )
        if resp.status_code != 200:
            return []
        
        data = resp.json()
        leads = []
        for user in data.get("items", []):
            detail_resp = client.get(user["url"], headers=headers)
            if detail_resp.status_code != 200:
                continue
            detail = detail_resp.json()
            name_parts = (detail.get("name") or user["login"]).split(" ", 1)
            leads.append({
                "firstName": name_parts[0],
                "lastName": name_parts[1] if len(name_parts) > 1 else "",
                "email": detail.get("email"),
                "title": detail.get("bio", "")[:100] if detail.get("bio") else "Developer",
                "githubUrl": user.get("html_url"),
                "companyName": (detail.get("company") or "").strip("@"),
                "source": "GITHUB",
                "notes": f"GitHub: {detail.get('public_repos', 0)} repos, {detail.get('followers', 0)} followers",
            })
        return leads
