import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import health, enrichment, scoring, discovery, outreach
from config.settings import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="LeadIQ AI Agents",
    description="Claude-powered AI agents for lead discovery, enrichment, scoring, and outreach",
    version="1.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.backend_url],
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
    logger.info("LeadIQ AI Agents starting up...")
    if settings.anthropic_api_key:
        logger.info("Anthropic API key configured")
    else:
        logger.warning("No Anthropic API key - agents will use fallback mode")

@app.on_event("shutdown")
async def shutdown():
    logger.info("LeadIQ AI Agents shutting down...")
