"""Keyword classifier: maps a post to one of the five business verticals.

Deliberately dependency-free and offline. It runs on every lead from every
source, costs nothing, and needs no API key. The optional LLM re-rank in
`discovery_agent` can refine it, but classification must never *require* a
model call.
"""
from __future__ import annotations

from typing import List, Tuple

from sources.base import IntentLead

# Ordered by specificity — AI_AUTOMATION is checked before IT_SERVICES because
# "AI automation" also contains "automation", which would otherwise fall through
# to generic IT.
VERTICAL_KEYWORDS: List[Tuple[str, Tuple[str, ...]]] = [
    ("AI_AUTOMATION", (
        "ai automation", "ai agent", "ai agents", "llm", "chatbot", "chat bot",
        "gpt", "openai", "claude", "rag ", "prompt engineering", "machine learning",
        "ml engineer", "n8n", "make.com", "zapier", "workflow automation",
        "automate", "automation", "copilot", "voice agent", "ai integration",
    )),
    ("GRAPHIC_DESIGN", (
        "logo", "branding", "brand identity", "graphic design", "designer",
        "illustration", "illustrator", "figma", "ui design", "ux design",
        "brochure", "flyer", "banner", "photoshop", "thumbnail", "packaging design",
        "social media design", "creative designer", "vector", "mockup",
    )),
    ("MARKETING", (
        "seo", "sem", "ppc", "google ads", "facebook ads", "meta ads",
        "social media marketing", "content marketing", "email marketing",
        "growth", "lead generation", "lead gen", "copywriter", "copywriting",
        "influencer", "marketing agency", "digital marketing", "campaign",
        "funnel", "tiktok ads", "linkedin ads", "community manager",
    )),
    ("BUY_SELL", (
        "buying a business", "selling a business", "business for sale",
        "acquisition", "acquire", "due diligence", "valuation", "marketplace",
        "ecommerce store for sale", "domain for sale", "website for sale",
        "flip", "flipping", "broker", "merger", "exit strategy", "shopify store for sale",
    )),
    ("IT_SERVICES", (
        "web developer", "web development", "full stack", "fullstack",
        "frontend", "backend", "react", "next.js", "node.js", "python developer",
        "devops", "cloud", "aws", "azure", "gcp", "api integration",
        "mobile app", "ios", "android", "flutter", "react native",
        "database", "cybersecurity", "it support", "managed services",
        "software engineer", "saas development", "erp", "crm development",
    )),
]

# Words that suggest the poster is BUYING rather than selling their own services.
BUYING_SIGNALS = (
    "looking for", "need a", "need an", "hiring", "seeking", "iso ",
    "anyone know", "recommendations for", "who can", "want to hire",
    "budget", "quote for", "proposal for", "[hiring]",
)

# Words that suggest the poster is ADVERTISING their own services — not a lead.
SELLING_SIGNALS = (
    "we offer", "our services", "hire us", "hire me", "i am a freelancer",
    "available for hire", "portfolio", "dm me", "open to work", "[for hire]",
)


def _score_vertical(text: str) -> Tuple[str, List[str], float]:
    lowered = text.lower()
    best_vertical = "OTHER"
    best_hits: List[str] = []

    for vertical, keywords in VERTICAL_KEYWORDS:
        hits = [k for k in keywords if k in lowered]
        if len(hits) > len(best_hits):
            best_hits = hits
            best_vertical = vertical

    if not best_hits:
        return "OTHER", [], 0.1

    # Buying vs selling tilt. A post that is advertising services is not a lead.
    buying = sum(1 for s in BUYING_SIGNALS if s in lowered)
    selling = sum(1 for s in SELLING_SIGNALS if s in lowered)

    confidence = min(0.95, 0.45 + 0.12 * len(best_hits))
    if buying:
        confidence = min(0.98, confidence + 0.15)
    if selling > buying:
        confidence = max(0.05, confidence - 0.45)   # probably a competitor, not a lead

    return best_vertical, best_hits, round(confidence, 2)


def classify(lead: IntentLead) -> IntentLead:
    """Classify in place and return the lead, for easy chaining."""
    text = " ".join(filter(None, [
        lead.intent_summary or "",
        lead.notes or "",
        lead.title or "",
        " ".join(lead.tags),
    ]))
    vertical, hits, confidence = _score_vertical(text)
    lead.vertical = vertical
    lead.matched_terms = hits
    lead.confidence = confidence
    return lead
