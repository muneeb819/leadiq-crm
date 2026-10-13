"""GitHub — find *companies* building in your verticals, via orgs and repos.

The original github_tool searched *users*, which returns individual developers
— not buyers of IT services. Searching organisations and repositories is a much
better fit: an org actively building AI automation is an org that may need help.

Free: 60 req/hr unauthenticated, 5,000 req/hr with a token.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

import httpx

from config.settings import settings
from sources.base import IntentLead, SourceResult

API = "https://api.github.com"


def _headers() -> dict:
    h = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "LeadIQ-CRM/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if settings.github_token:
        h["Authorization"] = f"Bearer {settings.github_token}"
    return h


def _parse_ts(value) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def search_orgs(query: str, limit: int = 20, timeout: float = 15.0) -> SourceResult:
    """Organisations matching a vertical — the closest thing GitHub has to a company list."""
    started = datetime.now(timezone.utc)
    try:
        with httpx.Client(timeout=timeout, follow_redirects=True, headers=_headers()) as client:
            resp = client.get(f"{API}/search/users",
                              params={"q": f"{query} type:org", "per_page": min(limit, 30)})
            if resp.status_code == 403:
                return SourceResult(source="GITHUB", mode="company", error="rate limited or token rejected (403)")
            if resp.status_code != 200:
                return SourceResult(source="GITHUB", mode="company", error=f"HTTP {resp.status_code}")
            items = resp.json().get("items", [])
    except httpx.HTTPError as exc:
        return SourceResult(source="GITHUB", mode="company", error=f"network: {exc}")

    leads: List[IntentLead] = []
    try:
        with httpx.Client(timeout=timeout, follow_redirects=True, headers=_headers()) as client:
            for org in items:
                detail_resp = client.get(org["url"])
                if detail_resp.status_code != 200:
                    continue
                d = detail_resp.json()
                email = d.get("email")            # only present if the org published it
                leads.append(IntentLead(
                    organisation=d.get("name") or d.get("login"),
                    title="Organisation",
                    # contact_email is set ONLY because GitHub itself published it.
                    contact_email=email if email and "@" in email else None,
                    contact_url=d.get("html_url"),
                    intent_summary=(d.get("description") or f"GitHub org: {d.get('login')}")[:300],
                    source="GITHUB",
                    source_url=d.get("html_url") or org.get("html_url"),
                    source_id=str(d.get("id")),
                    github_url=d.get("html_url"),
                    notes=f"{d.get('public_repos', 0)} repos · "
                          f"{d.get('followers', 0)} followers · "
                          f"{d.get('location') or 'location unknown'} · "
                          f"blog: {d.get('blog') or '-'}",
                    tags=[t for t in ["github", "org"] if t],
                ))
    except httpx.HTTPError as exc:
        return SourceResult(source="GITHUB", mode="company", error=f"network during detail fetch: {exc}")

    elapsed = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
    return SourceResult(source="GITHUB", leads=leads, mode="company", elapsed_ms=elapsed)


def search_repos(query: str, limit: int = 20, vertical: str = "OTHER", timeout: float = 15.0) -> SourceResult:
    """Recently-pushed repos matching a vertical — active projects that may need help."""
    started = datetime.now(timezone.utc)
    try:
        with httpx.Client(timeout=timeout, follow_redirects=True, headers=_headers()) as client:
            resp = client.get(f"{API}/search/repositories",
                              params={"q": f"{query} pushed:>2025-01-01", "per_page": min(limit, 30),
                                      "sort": "updated", "order": "desc"})
            if resp.status_code == 403:
                return SourceResult(source="GITHUB", mode="company", error="rate limited or token rejected (403)")
            if resp.status_code != 200:
                return SourceResult(source="GITHUB", mode="company", error=f"HTTP {resp.status_code}")
            items = resp.json().get("items", [])
    except httpx.HTTPError as exc:
        return SourceResult(source="GITHUB", mode="company", error=f"network: {exc}")

    leads: List[IntentLead] = []
    for r in items:
        owner = r.get("owner") or {}
        owner_email = (owner.get("email") or None)
        leads.append(IntentLead(
            organisation=owner.get("login"),
            title="Repository owner",
            contact_email=owner_email if owner_email and "@" in owner_email else None,
            contact_url=owner.get("html_url"),
            intent_summary=f"{r.get('full_name')}: {(r.get('description') or 'no description')[:220]}",
            source="GITHUB",
            source_url=r.get("html_url") or "",
            source_id=str(r.get("id")),
            github_url=r.get("html_url"),
            vertical=vertical,
            notes=f"{r.get('stargazers_count', 0)} stars · "
                  f"language: {r.get('language') or '-'} · "
                  f"pushed: {(r.get('pushed_at') or '')[:10]}",
            tags=(r.get("topics") or [])[:6] + ["github", "repo"],
        ))
    elapsed = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
    return SourceResult(source="GITHUB", leads=leads, mode="company", elapsed_ms=elapsed)
