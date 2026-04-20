# LeadIQ CRM — Complete File Tree
# Every file across all services (all 10 parts of the scaffold)

leadiq-crm/
│
├── docker-compose.yml                        # [FILE 1] All 5 service orchestration
├── .env.example                              # [FILE 2] All environment variables, grouped
├── .env                                      # ← Your local copy (git-ignored)
├── .gitignore                                # Node, Python, Docker, .env ignores
├── package.json                              # [FILE 3] Monorepo root scripts
├── README.md                                 # [FILE 4] Full setup + troubleshooting guide
│
├── docker/                                   # Dockerfiles for each service
│   ├── Dockerfile.backend                    # Node 20 Alpine, ts-node-dev hot reload
│   ├── Dockerfile.frontend                   # Node 20 Alpine, Next.js dev server
│   └── Dockerfile.agents                     # Python 3.11 Slim, uvicorn + FastAPI
│
├── backend/                                  # Express REST API (Node.js + TypeScript)
│   ├── package.json                          # Backend deps: express, prisma, redis, jwt, etc.
│   ├── tsconfig.json                         # TypeScript config (strict mode)
│   ├── nodemon.json                          # Nodemon watch config for hot reload
│   ├── .eslintrc.json                        # ESLint rules for TypeScript
│   │
│   ├── prisma/
│   │   ├── schema.prisma                     # Full DB schema: User, Lead, Company, Pipeline…
│   │   ├── migrations/                       # Auto-generated migration SQL files
│   │   │   └── 20240101000000_init/
│   │   │       └── migration.sql
│   │   └── seed.ts                           # Seeds: admin user, demo leads, pipeline stages
│   │
│   └── src/
│       ├── index.ts                          # Server entry point, Express app bootstrap
│       ├── app.ts                            # Express app setup, middleware registration
│       │
│       ├── config/
│       │   ├── env.ts                        # Validated env vars (zod schema)
│       │   ├── database.ts                   # Prisma client singleton
│       │   └── redis.ts                      # IORedis client singleton
│       │
│       ├── routes/
│       │   ├── index.ts                      # Route aggregator
│       │   ├── auth.routes.ts                # POST /auth/login, /register, /refresh, /logout
│       │   ├── leads.routes.ts               # CRUD /leads + /leads/:id/enrich
│       │   ├── companies.routes.ts           # CRUD /companies
│       │   ├── pipeline.routes.ts            # GET/PUT /pipeline, /pipeline/stages
│       │   ├── outreach.routes.ts            # POST /outreach/send, GET /outreach/history
│       │   ├── analytics.routes.ts           # GET /analytics/dashboard, /funnel, /sources
│       │   ├── agents.routes.ts              # POST /agents/discover, /enrich, /score
│       │   └── health.routes.ts              # GET /health — liveness probe
│       │
│       ├── controllers/
│       │   ├── auth.controller.ts            # Login/register/refresh logic
│       │   ├── leads.controller.ts           # Lead CRUD + AI enrichment trigger
│       │   ├── companies.controller.ts       # Company CRUD
│       │   ├── pipeline.controller.ts        # Pipeline stage management
│       │   ├── outreach.controller.ts        # Email sending via SendGrid
│       │   ├── analytics.controller.ts       # Dashboard metrics aggregation
│       │   └── agents.controller.ts          # Proxy to AI agents service
│       │
│       ├── services/
│       │   ├── auth.service.ts               # JWT sign/verify, bcrypt, refresh tokens
│       │   ├── lead.service.ts               # Lead business logic, scoring, deduplication
│       │   ├── company.service.ts            # Company enrichment + firmographic data
│       │   ├── email.service.ts              # SendGrid wrapper, template rendering
│       │   ├── cache.service.ts              # Redis get/set/del/TTL helpers
│       │   ├── queue.service.ts              # Bull queue for async jobs
│       │   └── websocket.service.ts          # Socket.IO real-time event emitter
│       │
│       ├── middleware/
│       │   ├── auth.middleware.ts            # JWT verification, attach req.user
│       │   ├── rateLimiter.middleware.ts     # Redis-backed rate limiting
│       │   ├── validate.middleware.ts        # Zod request body/params validation
│       │   ├── errorHandler.middleware.ts    # Global error handler, structured responses
│       │   └── logger.middleware.ts          # Morgan + Winston HTTP request logging
│       │
│       ├── models/
│       │   └── types.ts                      # Shared TypeScript types and interfaces
│       │
│       └── utils/
│           ├── logger.ts                     # Winston logger (file + console transports)
│           ├── pagination.ts                 # Cursor-based pagination helper
│           ├── response.ts                   # Standardized API response wrapper
│           └── crypto.ts                     # Encryption helpers for sensitive fields
│
├── frontend/                                 # Next.js 14 App Router (TypeScript)
│   ├── package.json                          # Frontend deps: next, react, tailwind, etc.
│   ├── tsconfig.json                         # TypeScript config
│   ├── next.config.ts                        # Next.js config, API rewrites, image domains
│   ├── tailwind.config.ts                    # Tailwind theme, colors, fonts
│   ├── postcss.config.js                     # PostCSS for Tailwind
│   ├── .eslintrc.json                        # ESLint + Next.js rules
│   │
│   ├── public/
│   │   ├── logo.svg                          # LeadIQ brand logo
│   │   └── favicon.ico
│   │
│   └── src/
│       ├── app/                              # Next.js App Router
│       │   ├── layout.tsx                    # Root layout: font, providers, sidebar
│       │   ├── page.tsx                      # Redirects to /dashboard
│       │   ├── (auth)/
│       │   │   ├── login/
│       │   │   │   └── page.tsx              # Login form with JWT auth
│       │   │   └── register/
│       │   │       └── page.tsx              # Registration form
│       │   └── (app)/
│       │       ├── layout.tsx                # App shell with sidebar nav
│       │       ├── dashboard/
│       │       │   └── page.tsx              # Dashboard: KPIs, charts, activity feed
│       │       ├── leads/
│       │       │   ├── page.tsx              # Lead table with filters, search, sort
│       │       │   ├── [id]/
│       │       │   │   └── page.tsx          # Lead detail: timeline, AI insights, notes
│       │       │   └── new/
│       │       │       └── page.tsx          # Manual lead creation form
│       │       ├── companies/
│       │       │   ├── page.tsx              # Company list with enrichment status
│       │       │   └── [id]/
│       │       │       └── page.tsx          # Company detail with linked leads
│       │       ├── pipeline/
│       │       │   └── page.tsx              # Kanban board with drag-and-drop stages
│       │       ├── outreach/
│       │       │   ├── page.tsx              # Email campaign history and status
│       │       │   └── compose/
│       │       │       └── page.tsx          # AI-assisted email composer
│       │       ├── agents/
│       │       │   └── page.tsx              # Agent control panel: run tasks, view logs
│       │       └── settings/
│       │           └── page.tsx              # User profile, API keys, integrations
│       │
│       ├── components/
│       │   ├── ui/                           # shadcn/ui base components
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── dialog.tsx
│       │   │   ├── input.tsx
│       │   │   ├── badge.tsx
│       │   │   ├── table.tsx
│       │   │   ├── dropdown-menu.tsx
│       │   │   └── toast.tsx
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx               # Collapsible sidebar with nav items
│       │   │   ├── Header.tsx                # Top header with search + user menu
│       │   │   └── PageContainer.tsx         # Consistent page wrapper with heading
│       │   ├── leads/
│       │   │   ├── LeadTable.tsx             # Sortable, filterable data table
│       │   │   ├── LeadCard.tsx              # Summary card for list views
│       │   │   ├── LeadScore.tsx             # AI score badge with tooltip breakdown
│       │   │   ├── LeadTimeline.tsx          # Activity timeline component
│       │   │   └── AIInsightsPanel.tsx       # Streaming Claude insights sidebar
│       │   ├── pipeline/
│       │   │   ├── KanbanBoard.tsx           # DnD pipeline board
│       │   │   ├── KanbanColumn.tsx          # Individual pipeline stage column
│       │   │   └── DealCard.tsx              # Draggable deal card
│       │   ├── dashboard/
│       │   │   ├── KPICard.tsx               # Metric card with sparkline
│       │   │   ├── ConversionFunnel.tsx      # Recharts funnel chart
│       │   │   ├── LeadSourceChart.tsx       # Pie chart of lead sources
│       │   │   └── ActivityFeed.tsx          # Real-time activity stream
│       │   └── outreach/
│       │       ├── EmailComposer.tsx         # Rich text composer with AI assist
│       │       └── CampaignStatus.tsx        # Email delivery status tracker
│       │
│       ├── hooks/
│       │   ├── useAuth.ts                    # Login, logout, token refresh
│       │   ├── useLeads.ts                   # SWR hooks for lead CRUD
│       │   ├── useCompanies.ts               # SWR hooks for company CRUD
│       │   ├── usePipeline.ts                # Pipeline state + optimistic updates
│       │   ├── useWebSocket.ts               # Socket.IO connection + event listeners
│       │   └── useAgents.ts                  # Agent job submission + polling
│       │
│       └── lib/
│           ├── api.ts                        # Axios instance with interceptors + refresh
│           ├── auth.ts                       # Token storage, decode, expiry check
│           ├── constants.ts                  # Pipeline stages, lead statuses, sources
│           └── utils.ts                      # cn(), formatDate(), formatCurrency(), etc.
│
└── ai-agents/                                # Python AI Agent Service (FastAPI)
    ├── requirements.txt                      # anthropic, fastapi, uvicorn, httpx, etc.
    ├── main.py                               # FastAPI app, router registration, lifespan
    ├── pytest.ini                            # Pytest config
    │
    ├── config/
    │   ├── settings.py                       # Pydantic Settings from env vars
    │   └── database.py                       # Async SQLAlchemy engine + session
    │
    ├── models/
    │   ├── lead.py                           # Pydantic Lead models (request/response)
    │   ├── company.py                        # Pydantic Company models
    │   ├── agent.py                          # AgentTask, AgentResult, AgentStatus models
    │   └── outreach.py                       # OutreachDraft, EmailPersonalization models
    │
    ├── routers/
    │   ├── discovery.py                      # POST /discover — find leads from sources
    │   ├── enrichment.py                     # POST /enrich — enrich lead with Claude
    │   ├── scoring.py                        # POST /score — AI lead scoring (0–100)
    │   ├── outreach.py                       # POST /outreach/draft — personalized email
    │   ├── research.py                       # POST /research/company — company intel
    │   └── health.py                         # GET /health — liveness probe
    │
    ├── agents/
    │   ├── base_agent.py                     # Abstract base: Claude client, tool runner
    │   ├── discovery_agent.py                # Finds leads via SERP, GitHub, Product Hunt
    │   ├── enrichment_agent.py               # Enriches lead profile with web research
    │   ├── scoring_agent.py                  # Scores leads 0–100 with reasoning
    │   ├── outreach_agent.py                 # Drafts personalized cold outreach emails
    │   └── research_agent.py                 # Deep company/market research agent
    │
    ├── tools/
    │   ├── serp_tool.py                      # SerpAPI web search integration
    │   ├── github_tool.py                    # GitHub user/org data fetcher
    │   ├── product_hunt_tool.py              # Product Hunt company lookup
    │   ├── scraper_tool.py                   # Async web scraper (httpx + BeautifulSoup)
    │   ├── linkedin_tool.py                  # LinkedIn data via RapidAPI
    │   └── clearbit_tool.py                  # Clearbit company enrichment
    │
    ├── services/
    │   ├── redis_service.py                  # Async Redis client, caching helpers
    │   ├── backend_service.py                # HTTP client to call backend REST API
    │   └── rate_limiter.py                   # Per-API-key rate limiting with Redis
    │
    └── tests/
        ├── conftest.py                       # Pytest fixtures: mock Claude, mock tools
        ├── test_discovery_agent.py           # Discovery agent unit tests
        ├── test_enrichment_agent.py          # Enrichment agent unit tests
        ├── test_scoring_agent.py             # Scoring agent unit tests
        └── test_outreach_agent.py            # Outreach draft generation tests

# ─────────────────────────────────────────────────────────────
# TOTAL FILE COUNT (approximate, excluding migrations)
# ─────────────────────────────────────────────────────────────
# Root:          5 files
# docker/:       3 Dockerfiles
# backend/:     ~40 TypeScript source files
# frontend/:    ~50 TypeScript / TSX source files
# ai-agents/:   ~30 Python source files
# ─────────────────────────────────────────────────────────────
# Grand total:  ~128 files across all services
# ─────────────────────────────────────────────────────────────
