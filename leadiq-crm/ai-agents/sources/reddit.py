"""Reddit — the single densest source of people asking to buy services.

Subreddits like r/forhire, r/hiring, r/jobbit, r/DoneDirtCheap, r/INAT and
r/DesignJobs are full of posts from people who need exactly what this CRM sells.

Uses the public JSON endpoints (append `.json` to any listing URL). These work
without credentials at a low rate limit; set REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET
(free at https://www.reddit.com/prefs/apps) for ~10x the allowance. Reddit
requires a descriptive User-Agent or it will 429 you.
"""
from __future__ import annotations

import base64
from datetime import datetime, timezone
from typing import List, Optional

import httpx

from config.settings import settings
from sources.base import IntentLead, SourceResult

BASE = "https://www.reddit.com"

# subreddit -> what it is good for
SUBREDDITS = {
    "forhire":       "general hiring / looking-for",
    "hiring":        "companies hiring",
    "jobbit":        "tech hiring",
    "INAT":          "I need a team / freelancer requests",
    "DoneDirtCheap": "cheap design & small tasks",
    "DesignJobs":    "graphic & UI/UX design work",
    "MarketingHelp": "marketing service requests",
    "Entrepreneur":  "founders needing services",
    "startups":      "startup needs",
    "SaaS":          "SaaS founders needing dev/marketing",
}

# Only pull posts where the author wants to BUY something.
SEARCH_QUERIES = ("hiring", "looking for", "[Hiring]", "need")


def _headers() -> dict:
    h = {"User-Agent": settings.reddit_user_agent}
    if settings.reddit_client_id and settings.reddit_client_secret:
        raw = f"{settings.reddit_client_id}:{settings.reddit_client_secret}"
        h["Authorization"] = "Basic " + base64.b64encode(raw.encode()).decode()
    return h


def _post_to_lead(post: dict, subreddit: str) -> Optional[IntentLead]:
    d = post.get("data", {})
    if d.get("stickied"):
        return None
    title = d.get("title") or ""
    body = d.get("selftext") or ""
    if len(title) < 8:
        return None

    permalink = d.get("permalink") or ""
    url = f"{BASE}{permalink}" if permalink.startswith("/") else permalink

    return IntentLead(
        first_name=(d.get("author") or "")[:1],
        title=d.get("author"),
        intent_summary=(title[:180] + (f" — {body[:300]}" if body else "")).strip(),
        contact_url=url,
        posted_at=datetime.fromtimestamp(d.get("created_utc", 0), tz=timezone.utc) if d.get("created_utc") else None,
        source="REDDIT",
        source_url=url,
        source_id=d.get("id"),
        budget_hint=_extract_budget(f"{title} {body}"),
        notes=f"r/{subreddit} · {d.get('score', 0)} upvotes · {d.get('num_comments', 0)} comments",
        tags=[f"r/{subreddit}"],
    )


def _extract_budget(text: str) -> Optional[str]:
    import re
    m = re.search(r"(\$\s?\d[\d,]*(?:\s?-\s?\$?\s?\d[\d,]*)?)", text)
    return m.group(1).strip() if m else None


def fetch(subreddit: str, limit: int = 25, timeout: float = 15.0) -> SourceResult:
    started = datetime.now(timezone.utc)
    leads: List[IntentLead] = []
    errors: List[str] = []

    try:
        with httpx.Client(timeout=timeout, follow_redirects=True, headers=_headers()) as client:
            for q in SEARCH_QUERIES:
                resp = client.get(
                    f"{BASE}/r/{subreddit}/search.json",
                    params={"q": q, "restrict_sr": 1, "sort": "new", "limit": limit, "t": "month"},
                )
                if resp.status_code == 429:
                    errors.append("rate limited (429)")
                    break
                if resp.status_code != 200:
                    errors.append(f"HTTP {resp.status_code}")
                    continue
                for child in resp.json().get("data", {}).get("children", []):
                    lead = _post_to_lead(child, subreddit)
                    if lead:
                        leads.append(lead)
    except httpx.HTTPError as exc:
        return SourceResult(source="REDDIT", error=f"network: {exc}")

    # A source that is entirely rate-limited is an error, not "zero leads".
    if not leads and errors:
        return SourceResult(source="REDDIT", error="; ".join(dict.fromkeys(errors)))

    elapsed = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
    return SourceResult(source="REDDIT", leads=leads, elapsed_ms=elapsed)


def fetch_all(limit: int = 25) -> SourceResult:
    all_leads: List[IntentLead] = []
    errors: List[str] = []
    total_ms = 0
    for sub in SUBREDDITS:
        r = fetch(sub, limit=limit)
        total_ms += r.elapsed_ms
        if r.error:
            errors.append(f"r/{sub}: {r.error}")
        all_leads.extend(r.leads)
    return SourceResult(
        source="REDDIT",
        leads=all_leads,
        error="; ".join(errors) if errors and not all_leads else None,
        elapsed_ms=total_ms,
    )
