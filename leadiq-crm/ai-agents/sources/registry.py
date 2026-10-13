"""Source registry — the single place that knows which sources exist and how
to run them.

Adding a new lead source = write a module in `sources/` and add one entry here.
Nothing else in the codebase needs to change.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict, List

from sources.base import SourceResult


@dataclass
class SourceSpec:
    key: str
    label: str
    runner: Callable[..., SourceResult]
    needs_key: bool = False
    key_env: str = ""
    cost: str = "free"
    note: str = ""


def _gh_orgs(**kw) -> SourceResult:
    from sources.github import search_orgs
    return search_orgs(kw.pop("query", "ai automation agency"), **kw)


def _gh_repos(**kw) -> SourceResult:
    from sources.github import search_repos
    return search_repos(kw.pop("query", "ai automation"), **kw)


def _hn(**kw) -> SourceResult:
    from sources.hackernews import fetch_all
    kw.pop("query", None)
    return fetch_all(**kw)


def _reddit(**kw) -> SourceResult:
    from sources.reddit import fetch_all
    kw.pop("query", None)
    return fetch_all(**kw)


def _freelancer(**kw) -> SourceResult:
    from sources.freelancer import fetch_all
    kw.pop("query", None)
    return fetch_all(**kw)


def _remotive(**kw) -> SourceResult:
    from sources.jobboards import fetch_remotive
    return fetch_remotive(kw.pop("query", "marketing"), **kw)


def _remoteok(**kw) -> SourceResult:
    from sources.jobboards import fetch_remoteok
    return fetch_remoteok(kw.pop("query", "marketing"), **kw)


REGISTRY: Dict[str, SourceSpec] = {
    spec.key: spec for spec in [
        SourceSpec("hackernews", "Hacker News (Algolia)", _hn,
                   note="No key. Highest density of people asking to buy services."),
        SourceSpec("github_orgs", "GitHub organisations", _gh_orgs,
                   key_env="GITHUB_TOKEN",
                   note="60 req/hr unauthenticated, 5,000 with a free token."),
        SourceSpec("github_repos", "GitHub repositories", _gh_repos,
                   key_env="GITHUB_TOKEN",
                   note="Active projects by vertical."),
        SourceSpec("reddit", "Reddit (r/forhire, r/INAT, r/DesignJobs, …)", _reddit,
                   key_env="REDDIT_CLIENT_ID",
                   note="Works keyless at low rate; a free app registration lifts it ~10x."),
        SourceSpec("freelancer", "Freelancer.com live projects", _freelancer,
                   note="Real clients, real budgets, public API."),
        SourceSpec("remotive", "Remotive remote jobs", _remotive,
                   note="Companies with budget. No key."),
        SourceSpec("remoteok", "RemoteOK jobs", _remoteok,
                   note="Companies with budget. No key."),
    ]
}

# Sensible default when the caller does not choose.
DEFAULT_SOURCES = ["hackernews", "github_orgs", "freelancer", "remotive"]


def available() -> List[dict]:
    """Status of every registered source, for the UI's source picker."""
    from config.settings import settings
    out = []
    for key, spec in REGISTRY.items():
        configured = True
        if spec.key_env:
            configured = bool(getattr(settings, spec.key_env.lower(), ""))
        out.append({
            "key": key,
            "label": spec.label,
            "cost": spec.cost,
            "needsKey": spec.needs_key,
            "keyEnv": spec.key_env,
            "configured": configured,
            "note": spec.note,
            "worksWithoutKey": not spec.needs_key,
        })
    return out


def run(keys: List[str] | None, query: str | None = None, limit: int = 20) -> List[SourceResult]:
    """Run the selected sources (or the defaults) and return every result,
    including failures — callers need to see which source died and why."""
    from config.settings import settings
    selected = keys or DEFAULT_SOURCES
    results: List[SourceResult] = []

    for key in selected:
        spec = REGISTRY.get(key)
        if not spec:
            results.append(SourceResult(source=key.upper(), error=f"unknown source '{key}'"))
            continue
        kwargs: dict = {"limit": limit}
        if query:
            kwargs["query"] = query
        try:
            results.append(spec.runner(**kwargs))
        except Exception as exc:                      # a source must never kill the pass
            results.append(SourceResult(source=spec.label, error=f"crashed: {type(exc).__name__}: {exc}"))

    return results
