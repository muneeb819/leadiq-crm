"""Remote job boards that expose free, keyless JSON APIs.

These find *companies with budget*: a company actively hiring a marketing
manager or an AI engineer is a company that may well outsource the same work.
Both endpoints are public and cost nothing.

  Remotive   https://remotive.com/api/remote-jobs   (no key)
  RemoteOK   https://remoteok.com/api               (no key, legal per their ToS)
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

import httpx

from sources.base import IntentLead, SourceResult

UA = {"User-Agent": "LeadIQ-CRM/1.0 (lead discovery; contact via repo)"}


def _parse_iso(value) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def fetch_remotive(search: str, limit: int = 25, timeout: float = 15.0) -> SourceResult:
    started = datetime.now(timezone.utc)
    try:
        with httpx.Client(timeout=timeout, follow_redirects=True, headers=UA) as client:
            resp = client.get("https://remotive.com/api/remote-jobs", params={"search": search, "limit": limit})
            if resp.status_code != 200:
                return SourceResult(source="REMOTIVE", error=f"HTTP {resp.status_code}")
            jobs = resp.json().get("jobs", [])
    except httpx.HTTPError as exc:
        return SourceResult(source="REMOTIVE", error=f"network: {exc}")

    leads: List[IntentLead] = []
    for j in jobs:
        leads.append(IntentLead(
            organisation=j.get("company_name"),
            title=j.get("title"),
            intent_summary=f"Hiring a {j.get('title')} — {j.get('company_name')}. "
                           f"{(j.get('description') or '')[:200]}",
            budget_hint=j.get("salary"),
            contact_url=j.get("url"),
            posted_at=_parse_iso(j.get("publication_date")),
            source="REMOTIVE",
            source_url=j.get("url") or "",
            source_id=str(j.get("id")),
            notes=f"Tags: {', '.join(j.get('tags') or [])[:150]}",
            tags=(j.get("tags") or [])[:8],
        ))
    elapsed = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
    return SourceResult(source="REMOTIVE", leads=leads, elapsed_ms=elapsed)


def fetch_remoteok(search: str, limit: int = 25, timeout: float = 15.0) -> SourceResult:
    started = datetime.now(timezone.utc)
    try:
        with httpx.Client(timeout=timeout, follow_redirects=True, headers=UA) as client:
            # RemoteOK's API does not accept a search param; filter client-side.
            resp = client.get("https://remoteok.com/api")
            if resp.status_code != 200:
                return SourceResult(source="REMOTEOK", error=f"HTTP {resp.status_code}")
            payload = resp.json()
    except httpx.HTTPError as exc:
        return SourceResult(source="REMOTEOK", error=f"network: {exc}")
    except ValueError as exc:
        return SourceResult(source="REMOTEOK", error=f"bad payload: {exc}")

    jobs = [j for j in payload if isinstance(j, dict) and j.get("id")][:400]
    needle = search.lower()
    matched = [j for j in jobs if needle in " ".join(
        [j.get("position") or "", j.get("company") or "", " ".join(j.get("tags") or [])]
    ).lower()]

    leads: List[IntentLead] = []
    for j in matched[:limit]:
        leads.append(IntentLead(
            organisation=j.get("company"),
            title=j.get("position"),
            intent_summary=f"Hiring a {j.get('position')} — {j.get('company')}",
            budget_hint=j.get("salary_min") and f"{j.get('salary_min')}-{j.get('salary_max')}",
            contact_url=j.get("url") or j.get("apply_url"),
            posted_at=_parse_iso(j.get("date")),
            source="REMOTEOK",
            source_url=j.get("url") or "",
            source_id=str(j.get("id")),
            notes=f"Tags: {', '.join(j.get('tags') or [])[:150]}",
            tags=(j.get("tags") or [])[:8],
        ))
    elapsed = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
    return SourceResult(source="REMOTEOK", leads=leads, elapsed_ms=elapsed)
