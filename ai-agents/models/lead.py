from pydantic import BaseModel
from typing import Optional

class LeadInput(BaseModel):
    id: Optional[str] = None
    firstName: str
    lastName: str
    email: Optional[str] = None
    title: Optional[str] = None
    linkedinUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    source: Optional[str] = None
    company: Optional[dict] = None

class DiscoveredLead(BaseModel):
    firstName: str
    lastName: str
    email: Optional[str] = None
    title: Optional[str] = None
    linkedinUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    source: str
    companyName: Optional[str] = None
    notes: Optional[str] = None
