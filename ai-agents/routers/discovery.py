from fastapi import APIRouter
from agents.discovery_agent import DiscoveryAgent
from pydantic import BaseModel
from typing import Optional

router = APIRouter()
agent = DiscoveryAgent()

class DiscoverRequest(BaseModel):
    query: str
    limit: Optional[int] = 10

@router.post("/discover")
def discover_leads(req: DiscoverRequest):
    leads = agent.discover(req.query)
    return {"success": True, "data": {"leads": leads, "count": len(leads)}}
