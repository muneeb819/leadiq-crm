"""Hacker News via the Algolia Search API.

The best free source in the stack: no API key, no account, no signup, no cost,
and a public documented API. The monthly "Who is hiring" threads and the
"Ask HN" posts contain a very high density of people who need exactly the
services this CRM sells — IT work, AI automation, marketing, design.

Docs: https://hn.algolia.com/api
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

import httpx

from sources.base import IntentLead, SourceResult

API = "https://hn.algolia.com/api/v1"
BASE_THREAD = "https://news.ycombinator.com/item?id="

# Queries aimed at *buyers* of services, not at job-seekers.
DEFAULT_QUERIES = (
    '"looking for" AI automation agency',
    '"need a" developer OR designer OR marketer',
    '"anyone know" good agency',
    'Ask HN: hiring freelancer',
    '"recommendations for" marketing agency',
)


def _parse_ts(value) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromtimestamp(int(value), tz=timezone.utc)
    except (TypeError, ValueError):
        return None


def _hit_to_lead(hit: dict, query: str) -> Optional[IntentLead]:
    text = hit.get("story_title") or hit.get("title") or ""
    body = (hit.get("comment_text") or hit.get("story_text") or "")
    # Algolia returns HTML; strip tags crudely but safely enough for classification.
    import re
    body = re.sub(r"<[^>]+>", " ", body)
    body = re.sub(r"\s+", " ", body).strip()

    story_id = hit.get("story_id") or hit.get("objectID")
    comment_id = hit.get("objectID")
    url = hit.get("url") or f"{BASE_THREAD}{comment_id or story_id}"

    combined = f"{text} {body}".strip()
    if len(combined) < 20:
        return None

    return IntentLead(
        first_name=(hit.get("author") or "")[:1],
        last_name="",
        organisation=None,
        title=hit.get("author"),
        intent_summary=(text[:180] + (" — " + body[:300] if body else "")).strip(),
        contact_url=url,
        posted_at=_parse_ts(hit.get("created_at_i")),
        source="HACKERNEWS",
        source_url=url,
        source_id=str(comment_id or story_id),
        notes=f"HN query: {query}",
        tags=["hn", "intent"],
    )


def fetch(query: str, limit: int = 25, timeout: float = 15.0) -> SourceResult:
    started = datetime.now(timezone.utc)
    try:
        with httpx.Client(timeout=timeout, follow_redirects=True) as client:
            resp = client.get(
                f"{API}/search_by_date",
                params={"query": query, "tags": "(story,comment)", "hitsPerPage": limit},
                headers={"User-Agent": "LeadIQ-CRM/1.0 (lead discovery)"},
            )
            if resp.status_code == 429:
                return SourceResult(source="HACKERNEWS", error="rate limited (429)")
            if resp.status_code != 200:
                return SourceResult(source="HACKERNEWS", error=f"HTTP {resp.status_code}")
            hits = resp.json().get("hits", [])
    except httpx.HTTPError as exc:
        return SourceResult(source="HACKERNEWS", error=f"network: {exc}")

    leads = [l for l in (_hit_to_lead(h, query) for h in hits) if l]
    elapsed = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
    return SourceResult(source="HACKERNEWS", leads=leads, elapsed_ms=elapsed)


def fetch_all(queries=DEFAULT_QUERIES, limit: int = 25) -> SourceResult:
    """Run every query, merging results. One failed query does not abort the rest."""
    all_leads: List[IntentLead] = []
    errors: List[str] = []
    total_ms = 0
    for q in queries:
        r = fetch(q, limit=limit)
        total_ms += r.elapsed_ms
        if r.error:
            errors.append(f"{q}: {r.error}")
        all_leads.extend(r.leads)
    return SourceResult(
        source="HACKERNEWS",
        leads=all_leads,
        error="; ".join(errors) if errors and not all_leads else None,
        elapsed_ms=total_ms,
    )
