from pydantic import BaseModel

class OutreachDraft(BaseModel):
    subject: str
    body: str
