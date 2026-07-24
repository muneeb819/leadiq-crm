# LeadIQ CRM - File Tree

```
leadiq-crm/
|-- LICENSE                          # MIT License
|-- README.md                        # Project documentation
|-- package.json                     # Root monorepo scripts
|-- docker-compose.yml               # 5-service Docker orchestration
|-- .env.example                     # Environment variable template
|-- .gitignore                       # Git ignore rules
|-- .dockerignore                    # Docker build ignore rules
|-- leadiq-crm.code-workspace        # VS Code workspace config
|
|-- .vscode/
|   |-- settings.json                # Editor settings
|   |-- extensions.json              # Recommended extensions
|
|-- docker/
|   |-- Dockerfile.backend           # Node.js 20 Alpine backend image
|   |-- Dockerfile.frontend          # Node.js 20 Alpine frontend image
|   |-- Dockerfile.agents            # Python 3.11 Slim agents image
|
|-- backend/
|   |-- package.json                 # Backend dependencies
|   |-- tsconfig.json                # TypeScript config
|   |-- nodemon.json                 # Dev server config
|   |-- .eslintrc.json               # ESLint rules
|   |-- prisma/
|   |   |-- schema.prisma            # Database schema (6 models)
|   |   |-- seed.ts                  # Database seeder
|   |   |-- migrations/
|   |       |-- migration_lock.toml
|   |       |-- 20240101000000_init/
|   |           |-- migration.sql    # Initial migration
|   |           |-- migration.lock
|   |-- src/
|       |-- index.ts                 # Server entry point
|       |-- app.ts                   # Express app configuration
|       |-- config/
|       |   |-- env.ts               # Zod-validated env vars
|       |   |-- database.ts          # Prisma client singleton
|       |   |-- redis.ts             # IORedis client
|       |-- routes/
|       |   |-- index.ts             # Route aggregator
|       |   |-- auth.routes.ts       # Auth endpoints
|       |   |-- leads.routes.ts      # Lead CRUD + AI actions
|       |   |-- companies.routes.ts  # Company CRUD
|       |   |-- pipeline.routes.ts   # Pipeline view + move
|       |   |-- outreach.routes.ts   # Outreach draft/send
|       |   |-- analytics.routes.ts  # Dashboard analytics
|       |   |-- agents.routes.ts     # AI agent proxy
|       |   |-- health.routes.ts     # Health check
|       |-- controllers/
|       |   |-- auth.controller.ts   # Auth business logic
|       |   |-- leads.controller.ts  # Lead operations + AI triggers
|       |   |-- analytics.controller.ts # Dashboard data aggregation
|       |-- services/
|       |   |-- auth.service.ts      # JWT, bcrypt, user CRUD
|       |   |-- lead.service.ts      # Lead query logic
|       |   |-- cache.service.ts     # Redis cache helpers
|       |-- middleware/
|       |   |-- auth.middleware.ts   # JWT verification + role check
|       |   |-- rateLimiter.middleware.ts # Rate limiting
|       |   |-- errorHandler.middleware.ts # Global error handler
|       |   |-- logger.middleware.ts # HTTP request logging
|       |   |-- validate.middleware.ts # Zod validation middleware
|       |   |-- schemas.ts          # Zod validation schemas
|       |-- utils/
|           |-- response.ts          # Standardized API responses
|           |-- pagination.ts        # Pagination helper
|           |-- logger.ts            # Winston logger
|
|-- frontend/
|   |-- package.json                 # Frontend dependencies
|   |-- tsconfig.json                # TypeScript config
|   |-- next.config.ts               # Next.js config + API rewrites
|   |-- tailwind.config.ts           # Tailwind theme
|   |-- postcss.config.js            # PostCSS config
|   |-- .eslintrc.json               # ESLint config
|   |-- public/
|   |   |-- logo.svg                 # LeadIQ logo
|   |   |-- favicon.svg              # Favicon
|   |-- src/
|       |-- app/
|       |   |-- layout.tsx           # Root layout
|       |   |-- page.tsx             # Redirect to /dashboard
|       |   |-- globals.css          # Tailwind + CSS variables
|       |   |-- auth/
|       |   |   |-- login/page.tsx   # Login page
|       |   |   |-- register/page.tsx # Registration page
|       |   |-- dashboard/
|       |   |   |-- layout.tsx       # Auth-protected layout
|       |   |   |-- page.tsx         # Dashboard with KPIs/charts
|       |   |-- leads/
|       |   |   |-- layout.tsx       # Auth-protected layout
|       |   |   |-- page.tsx         # Lead list with search/filter
|       |   |   |-- [id]/page.tsx    # Lead detail + AI actions
|       |   |   |-- new/page.tsx     # New lead form
|       |   |-- companies/
|       |   |   |-- layout.tsx       # Auth-protected layout
|       |   |   |-- page.tsx         # Company grid view
|       |   |-- pipeline/
|       |   |   |-- layout.tsx       # Auth-protected layout
|       |   |   |-- page.tsx         # Kanban board
|       |   |-- outreach/
|       |   |   |-- layout.tsx       # Auth-protected layout
|       |   |   |-- page.tsx         # Outreach history table
|       |   |   |-- compose/page.tsx # Email composer with AI
|       |   |-- agents/
|       |   |   |-- layout.tsx       # Auth-protected layout
|       |   |   |-- page.tsx         # AI agents control panel
|       |   |-- settings/
|       |       |-- layout.tsx       # Auth-protected layout
|       |       |-- page.tsx         # Settings (profile, API keys)
|       |-- components/
|       |   |-- ui/
|       |   |   |-- button.tsx       # shadcn Button
|       |   |   |-- card.tsx         # shadcn Card
|       |   |   |-- badge.tsx        # shadcn Badge
|       |   |   |-- input.tsx        # shadcn Input
|       |   |   |-- label.tsx        # shadcn Label
|       |   |-- layout/
|       |   |   |-- Sidebar.tsx      # Navigation sidebar
|       |   |   |-- Header.tsx       # Page header with search
|       |   |   |-- AuthenticatedLayout.tsx # Shared auth guard layout
|       |   |-- leads/
|       |   |   |-- LeadTable.tsx    # Sortable lead data table
|       |   |   |-- LeadScore.tsx    # AI score display with tooltip
|       |   |-- pipeline/
|       |   |   |-- KanbanBoard.tsx  # DnD pipeline board
|       |   |-- dashboard/
|       |       |-- KPICard.tsx      # Metric card
|       |       |-- ActivityFeed.tsx # Activity stream
|       |-- hooks/
|       |   |-- useAuth.ts           # Auth context + provider
|       |   |-- useLeads.ts          # SWR hooks for leads
|       |   |-- useDashboard.ts      # SWR hook for dashboard
|       |   |-- usePipeline.ts       # SWR hook + move action
|       |-- lib/
|           |-- api.ts               # Axios instance + interceptors
|           |-- constants.ts         # Pipeline stages, statuses
|           |-- utils.ts             # Formatting utilities
|
|-- ai-agents/
    |-- main.py                      # FastAPI app entry point
    |-- requirements.txt             # Python dependencies
    |-- pytest.ini                   # Pytest config
    |-- config/
    |   |-- __init__.py
    |   |-- settings.py              # Pydantic settings from env
    |-- models/
    |   |-- __init__.py
    |   |-- lead.py                  # Lead Pydantic models
    |   |-- outreach.py              # Outreach Pydantic model
    |-- agents/
    |   |-- __init__.py
    |   |-- base_agent.py            # Claude client + JSON parser
    |   |-- discovery_agent.py       # Lead discovery agent
    |   |-- enrichment_agent.py      # Lead enrichment agent
    |   |-- scoring_agent.py         # Lead scoring agent
    |   |-- outreach_agent.py        # Email drafting agent
    |-- routers/
    |   |-- __init__.py
    |   |-- health.py                # Health endpoint
    |   |-- enrichment.py            # /enrich endpoint
    |   |-- scoring.py               # /score endpoint
    |   |-- discovery.py             # /discover endpoint
    |   |-- outreach.py              # /outreach/draft endpoint
    |-- tools/
    |   |-- __init__.py
    |   |-- serp_tool.py             # SerpAPI integration
    |   |-- github_tool.py           # GitHub API integration
    |   |-- scraper_tool.py          # Web scraper (httpx+BS4)
    |-- services/
    |   |-- __init__.py              # Empty placeholder
    |-- tests/
        |-- __init__.py
        |-- conftest.py              # Test fixtures
        |-- test_health.py           # Health endpoint test
        |-- test_enrichment_agent.py # Enrichment endpoint test
        |-- test_scoring_agent.py    # Scoring endpoint test
```
