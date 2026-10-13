"""Tests for the two invariants that matter most in lead discovery.

Unlike the original test suite, these exercise the real code — no mocking of
the thing under test. The classifier is pure and offline, so it is fully
testable; the no-fabrication rule is tested by running discovery with every
source pointed at an unreachable host.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest

from services.classifier import classify
from sources.base import IntentLead


def _lead(text):
    return classify(IntentLead(intent_summary=text, source="TEST", source_url="u"))


# ---------------------------------------------------------------- classification

@pytest.mark.parametrize("text,expected", [
    ("Looking for someone to build an AI automation workflow with n8n, budget $3k", "AI_AUTOMATION"),
    ("Need a logo and brand identity for my startup", "GRAPHIC_DESIGN"),
    ("Hiring a SEO specialist for a google ads campaign", "MARKETING"),
    ("Looking to acquire an ecommerce store, need due diligence help", "BUY_SELL"),
    ("Full stack react developer needed for api integration", "IT_SERVICES"),
])
def test_classifies_each_vertical(text, expected):
    assert _lead(text).vertical == expected


def test_competitor_post_is_suppressed():
    """A post advertising its own services is not a lead."""
    lead = _lead("We offer web development services, hire us, portfolio attached")
    assert lead.confidence < 0.35


def test_buying_signal_beats_neutral():
    buying = _lead("Looking for a developer to build an api integration")
    neutral = _lead("api integration developer")
    assert buying.confidence > neutral.confidence


def test_unrelated_text_scores_low():
    assert _lead("nice weather today").confidence < 0.35


def test_matched_terms_recorded():
    lead = _lead("need a logo and branding done")
    assert "logo" in lead.matched_terms


# ------------------------------------------------------------------ dedupe keys

def test_dedupe_prefers_email():
    a = IntentLead(contact_email="A@Example.com", source="X", source_url="u1")
    b = IntentLead(contact_email="a@example.com", source="Y", source_url="u2")
    assert a.dedupe_key() == b.dedupe_key()


def test_dedupe_falls_back_to_source_id():
    a = IntentLead(source="REDDIT", source_url="u1", source_id="abc")
    b = IntentLead(source="REDDIT", source_url="u2", source_id="abc")
    assert a.dedupe_key() == b.dedupe_key()


def test_dedupe_falls_back_to_url():
    a = IntentLead(source="HACKERNEWS", source_url="https://x/1")
    b = IntentLead(source="HACKERNEWS", source_url="https://x/1")
    assert a.dedupe_key() == b.dedupe_key()


# ------------------------------------------------------- THE no-fabrication rule

def test_discovery_never_invents_leads_when_every_source_fails(monkeypatch):
    """The single most important test in this file.

    The previous implementation asked Claude to invent leads when the real
    sources came back empty. Invented emails bounce and destroy the sending
    domain's reputation, so this must stay impossible.
    """
    from sources.base import SourceResult
    import sources.registry as registry

    monkeypatch.setattr(registry, "REGISTRY", {
        "dead": registry.SourceSpec(
            "dead", "Unreachable source",
            lambda **kw: SourceResult(source="DEAD", error="network: connection refused"),
        )
    })

    from agents.discovery_agent import DiscoveryAgent
    report = DiscoveryAgent().discover(sources=["dead"], use_llm=False)

    assert report["count"] == 0, "discovery must return zero leads, not invented ones"
    assert report["leads"] == []
    # ...and it must explain why, rather than silently returning nothing.
    assert report["sources"][0]["ok"] is False
    assert "connection refused" in report["sources"][0]["error"]


def test_unknown_source_reports_error_instead_of_crashing(monkeypatch):
    import sources.registry as registry
    monkeypatch.setattr(registry, "REGISTRY", {})
    from agents.discovery_agent import DiscoveryAgent
    report = DiscoveryAgent().discover(sources=["does_not_exist"], use_llm=False)
    assert report["count"] == 0
    assert "unknown source" in report["sources"][0]["error"]


def test_report_shape_matches_backend_contract():
    """The backend route reads these exact keys; a rename here breaks persistence."""
    from agents.discovery_agent import DiscoveryAgent
    import sources.registry as registry
    from sources.base import SourceResult
    original = registry.REGISTRY
    registry.REGISTRY = {
        "noop": registry.SourceSpec("noop", "No-op", lambda **kw: SourceResult(source="NOOP")),
    }
    try:
        report = DiscoveryAgent().discover(sources=["noop"], use_llm=False)
    finally:
        registry.REGISTRY = original

    for key in ("leads", "count", "llm_used", "llm_error", "sources", "not_attempted"):
        assert key in report, f"missing contract key: {key}"
    for key in ("source", "found", "ok", "error", "elapsedMs"):
        assert key in report["sources"][0], f"missing per-source key: {key}"
