"""Normalised lead/intent data shapes shared by every source.

Every source returns `IntentLead` objects. Sources MUST NOT invent data: if a
source cannot reach its upstream, it returns an empty list plus an error string
in `SourceResult.error`. Fabricated leads are worse than no leads — invented
emails bounce, and bounces destroy the sending domain's reputation.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# The five business verticals this CRM hunts for.
VERTICALS = ["IT_SERVICES", "AI_AUTOMATION", "MARKETING", "GRAPHIC_DESIGN", "BUY_SELL"]


class IntentLead(BaseModel):
    """A single discovered lead or buying signal.

    `contact_email` is populated ONLY when the source itself published it.
    It is never guessed, pattern-generated, or model-invented.
    """

    # --- who ---
    first_name: str = ""
    last_name: str = ""
    organisation: Optional[str] = None
    title: Optional[str] = None

    # --- contact (only if the source published it) ---
    contact_email: Optional[str] = None
    contact_url: Optional[str] = None          # profile / platform DM / thread URL

    # --- the buying signal ---
    intent_summary: Optional[str] = None        # what they say they want
    budget_hint: Optional[str] = None           # "$2k", "hourly", None
    posted_at: Optional[datetime] = None

    # --- provenance (always set — this is what makes a lead actionable) ---
    source: str                                 # e.g. "HACKERNEWS", "REDDIT"
    source_url: str                             # deep link to the original post
    source_id: Optional[str] = None             # upstream id, for dedupe

    # --- classification ---
    vertical: str = "OTHER"
    matched_terms: List[str] = Field(default_factory=list)
    confidence: float = 0.5

    # --- legacy CRM compatibility ---
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

    def dedupe_key(self) -> str:
        if self.contact_email:
            return f"email:{self.contact_email.lower().strip()}"
        if self.source_id:
            return f"{self.source}:{self.source_id}"
        return f"{self.source}:{self.source_url}"


# "intent"  = posts from people asking to buy  -> buying-signal filter applies
# "company" = organisations/projects worth contacting -> vertical match only,
#             because a company bio never says "looking for"
SOURCE_MODES = ("intent", "company")


class SourceResult(BaseModel):
    """Outcome of one source run. `error` is set instead of raising, so a single
    dead source never takes down the whole discovery pass."""

    source: str
    mode: str = "intent"
    leads: List[IntentLead] = Field(default_factory=list)
    error: Optional[str] = None
    elapsed_ms: int = 0

    @property
    def ok(self) -> bool:
        return self.error is None
