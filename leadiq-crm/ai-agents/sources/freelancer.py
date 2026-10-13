"""Freelancer.com — live buyer demand for exactly these services.

This is the "sale/purchase marketplace" motion made concrete: real clients
posting real projects with real budgets, right now. The active-projects
endpoint is public and costs nothing.

Docs: https://developers.freelancer.com/docs/projects/search-projects
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List

import httpx

from sources.base import IntentLead, SourceResult

API = "https://www.freelancer.com/api/projects/0.1/projects/active/"
UA = {"User-Agent": "LeadIQ-CRM/1.0 (lead discovery)"}

# Search terms per vertical. Freelancer matches on title + description.
VERTICAL_QUERIES = {
    "IT_SERVICES":    ("web development", "api integration", "mobile app", "bug fix"),
    "AI_AUTOMATION":  ("ai automation", "chatbot", "openai integration", "n8n workflow"),
    "MARKETING":      ("seo service", "google ads", "social media marketing", "email campaign"),
    "GRAPHIC_DESIGN": ("logo design", "brand identity", "ui ux design", "illustration"),
    "BUY_SELL":       ("business valuation", "ecommerce store", "shopify store", "business plan"),
}


def _to_lead(p: dict, vertical: str) -> IntentLead:
    budget = p.get("budget") or {}
    hint = None
    if budget.get("minimum") is not None:
        hint = f"${budget.get('minimum')}-{budget.get('maximum') or '?'} {budget.get('type') or ''}".strip()

    owner = (p.get("owner") or {})
    seo_url = p.get("seo_url") or str(p.get("id"))

    return IntentLead(
        first_name=(owner.get("username") or "")[:1],
        title=owner.get("username"),
        intent_summary=(p.get("title") or "")[:180] + (f" — {(p.get('preview_description') or '')[:250]}" if p.get("preview_description") else ""),
        budget_hint=hint,
        contact_url=f"https://www.freelancer.com/projects/{seo_url}",
        posted_at=datetime.fromtimestamp(p.get("submitdate", 0), tz=timezone.utc) if p.get("submitdate") else None,
        source="FREELANCER",
        source_url=f"https://www.freelancer.com/projects/{seo_url}",
        source_id=str(p.get("id")),
        vertical=vertical,
        notes=f"{p.get('bid_stats', {}).get('bid_count', '?')} bids · "
              f"{len(p.get('jobs', []) or [])} skills",
        tags=["freelancer", "marketplace", vertical.lower()],
    )


def fetch(query: str, limit: int = 20, vertical: str = "OTHER", timeout: float = 20.0) -> SourceResult:
    started = datetime.now(timezone.utc)
    try:
        with httpx.Client(timeout=timeout, follow_redirects=True, headers=UA) as client:
            resp = client.get(API, params={
                "query": query,
                "limit": limit,
                "project_types[]": "fixed",
                "compact": "false",
            })
            if resp.status_code == 429:
                return SourceResult(source="FREELANCER", error="rate limited (429)")
            if resp.status_code != 200:
                return SourceResult(source="FREELANCER", error=f"HTTP {resp.status_code}")
            projects = resp.json().get("result", {}).get("projects", [])
    except httpx.HTTPError as exc:
        return SourceResult(source="FREELANCER", error=f"network: {exc}")
    except ValueError as exc:
        return SourceResult(source="FREELANCER", error=f"bad payload: {exc}")

    leads = [_to_lead(p, vertical) for p in projects]
    elapsed = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
    return SourceResult(source="FREELANCER", leads=leads, elapsed_ms=elapsed)


def fetch_all(limit: int = 15, **_ignored) -> SourceResult:
    limit_per_query = limit
    """Run one query per vertical. Freelancer rate-limits, so this is sequential."""
    all_leads: List[IntentLead] = []
    errors: List[str] = []
    total_ms = 0
    for vertical, queries in VERTICAL_QUERIES.items():
        for q in queries:
            r = fetch(q, limit=limit_per_query, vertical=vertical)
            total_ms += r.elapsed_ms
            if r.error:
                errors.append(f"{q}: {r.error}")
            all_leads.extend(r.leads)
    return SourceResult(
        source="FREELANCER",
        leads=all_leads,
        error="; ".join(errors) if errors and not all_leads else None,
        elapsed_ms=total_ms,
    )
