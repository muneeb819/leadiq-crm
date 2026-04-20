from fastapi import APIRouter
from agents.outreach_agent import OutreachAgent

router = APIRouter()
agent = OutreachAgent()

@router.post("/outreach/draft")
def draft_outreach(payload: dict):
    lead = payload.get("lead", payload)
    result = agent.draft_email(lead)
    return {"success": True, "data": result}
