from fastapi import APIRouter
from agents.scoring_agent import ScoringAgent

router = APIRouter()
agent = ScoringAgent()

@router.post("/score")
def score_lead(payload: dict):
    lead = payload.get("lead", payload)
    result = agent.score(lead)
    return {"success": True, "data": result}
