from fastapi import APIRouter
from agents.enrichment_agent import EnrichmentAgent

router = APIRouter()
agent = EnrichmentAgent()

@router.post("/enrich")
def enrich_lead(payload: dict):
    lead = payload.get("lead", payload)
    result = agent.enrich(lead)
    return {"success": True, "data": result}
