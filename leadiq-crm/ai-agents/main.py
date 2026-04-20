from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import health, enrichment, scoring, discovery, outreach

app = FastAPI(
    title="LeadIQ AI Agents",
    description="Claude-powered AI agents for lead discovery, enrichment, scoring, and outreach",
    version="1.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(enrichment.router)
app.include_router(scoring.router)
app.include_router(discovery.router)
app.include_router(outreach.router)

@app.on_event("startup")
async def startup():
    print("🤖 LeadIQ AI Agents starting up...")
    from config.settings import settings
    if settings.anthropic_api_key:
        print("✅ Anthropic API key configured")
    else:
        print("⚠️  No Anthropic API key — agents will use fallback mode")

@app.on_event("shutdown")
async def shutdown():
    print("👋 LeadIQ AI Agents shutting down...")
