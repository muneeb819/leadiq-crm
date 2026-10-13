from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from agents.discovery_agent import DiscoveryAgent
from sources.registry import available

router = APIRouter()
agent = DiscoveryAgent()


class DiscoverRequest(BaseModel):
    query: Optional[str] = None
    sources: Optional[List[str]] = None      # omit -> sensible defaults
    limit: Optional[int] = 20
    use_llm: Optional[bool] = True           # re-rank only; never generates leads


@router.get("/discover/sources")
def list_sources():
    """Which sources exist, what they cost, and whether they're configured.
    The UI builds its source picker from this."""
    return {"success": True, "data": available()}


@router.post("/discover")
def discover_leads(req: DiscoverRequest):
    report = agent.discover(
        query=req.query,
        sources=req.sources,
        limit=req.limit or 20,
        use_llm=bool(req.use_llm),
    )
    return {"success": True, "data": report}
