"""Lead discovery — orchestrates real sources.

IMPORTANT: this module never invents leads.

The previous implementation asked Claude to "generate 5 realistic B2B leads"
whenever the real sources returned nothing. That is actively harmful: invented
email addresses bounce, bounces destroy the sending domain's reputation, and
some invented addresses belong to real strangers. If every source fails, this
returns an empty list plus the reasons — it does not manufacture data.

The LLM is used only to *re-rank and summarise* leads that a real source
actually returned, and only when an API key is configured.
"""
from __future__ import annotations

from typing import Dict, List, Optional

from config.settings import settings
from services.classifier import classify
from sources.base import IntentLead, SourceResult
from sources.registry import DEFAULT_SOURCES, REGISTRY, run as run_sources

from .base_agent import BaseAgent

SYSTEM = """You are a B2B lead qualification analyst. You are given real leads
scraped from public sources. Score how likely each is to BUY one of these services:
IT services, AI automation, marketing, graphic design, business buy/sell advisory.

Rules:
- Judge only from the text given. Never invent facts, names, or contact details.
- A post advertising its OWN services is a competitor, not a lead — score it near 0.
- A post asking to hire or buy is a strong lead.
Return JSON: {"ranked": [{"index": <int>, "is_lead": <bool>, "score": <0-100>,
"vertical": "IT_SERVICES|AI_AUTOMATION|MARKETING|GRAPHIC_DESIGN|BUY_SELL|OTHER",
"why": "<one short sentence>"}]}"""


class DiscoveryAgent(BaseAgent):

    def discover(
        self,
        query: Optional[str] = None,
        sources: Optional[List[str]] = None,
        limit: int = 20,
        use_llm: bool = True,
    ) -> Dict:
        """Returns a report: leads + per-source diagnostics.

        The diagnostics matter as much as the leads — "0 leads" is useless
        unless you know *why* (no key? rate limited? source down?).
        """
        selected = sources or DEFAULT_SOURCES
        results: List[SourceResult] = run_sources(selected, query=query, limit=limit)

        leads: List[IntentLead] = []
        seen: set = set()
        modes: Dict[str, str] = {}
        for r in results:
            for lead in r.leads:
                key = lead.dedupe_key()
                if key in seen:
                    continue
                seen.add(key)
                modes[key] = r.mode
                leads.append(classify(lead))

        # Filtering depends on what the source *is*:
        #   intent  — a post from someone asking to buy. The classifier already
        #             penalised "we offer / hire us" competitor posts, so drop
        #             anything below the confidence floor.
        #   company — an organisation or project worth contacting. A company bio
        #             never says "looking for", so the buying-signal penalty is
        #             meaningless here; require only that a vertical matched.
        kept: List[IntentLead] = []
        for lead in leads:
            if modes.get(lead.dedupe_key()) == "company":
                if lead.vertical != "OTHER" and lead.matched_terms:
                    kept.append(lead)
            elif lead.confidence >= settings.discovery_min_confidence:
                kept.append(lead)
        leads = kept

        llm_used = False
        llm_error: Optional[str] = None
        if use_llm and leads and self.client:
            try:
                leads = self._llm_rerank(leads)
                llm_used = True
            except Exception as exc:
                llm_error = f"{type(exc).__name__}: {exc}"

        # Best prospects first.
        leads.sort(key=lambda l: l.confidence, reverse=True)

        return {
            "leads": [l.model_dump(mode="json") for l in leads],
            "count": len(leads),
            "llm_used": llm_used,
            "llm_error": llm_error,
            "sources": [
                {
                    "source": r.source,
                    "found": len(r.leads),
                    "ok": r.ok,
                    "error": r.error,
                    "elapsedMs": r.elapsed_ms,
                }
                for r in results
            ],
            "not_attempted": [
                {"key": k, "reason": "not selected"}
                for k in REGISTRY if k not in selected
            ],
        }

    def _llm_rerank(self, leads: List[IntentLead], batch: int = 25) -> List[IntentLead]:
        """Re-rank with Claude. Falls back to keyword scores on any failure —
        a model outage must never discard real leads."""
        chunk = leads[:batch]
        listing = "\n".join(
            f"[{i}] source={l.source} vertical={l.vertical}\n    {l.intent_summary or ''}"
            for i, l in enumerate(chunk)
        )
        result = self.call_claude_json(SYSTEM, f"Leads:\n{listing}")
        if not isinstance(result, dict) or "ranked" not in result:
            return leads

        for item in result["ranked"]:
            try:
                idx = int(item.get("index", -1))
            except (TypeError, ValueError):
                continue
            if not 0 <= idx < len(chunk):
                continue
            if item.get("is_lead") is False:
                chunk[idx].confidence = 0.0
                continue
            score = item.get("score")
            if isinstance(score, (int, float)):
                chunk[idx].confidence = round(max(0.0, min(1.0, float(score) / 100.0)), 2)
            vertical = item.get("vertical")
            if isinstance(vertical, str) and vertical:
                chunk[idx].vertical = vertical
            why = item.get("why")
            if isinstance(why, str) and why:
                chunk[idx].notes = (chunk[idx].notes or "") + f" | AI: {why[:200]}"
            if item.get("is_lead") is True:
                chunk[idx].tags = list(dict.fromkeys(chunk[idx].tags + ["ai-qualified"]))

        # Anything the model zeroed out is dropped.
        return [l for l in leads if l.confidence > 0]
