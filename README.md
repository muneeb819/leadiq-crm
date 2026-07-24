# LeadIQ CRM

> **AI-Powered Business Development CRM** -- Automatically discover, enrich, score, and engage leads using Claude AI.

## Features

- **Lead Management** -- Full CRUD with search, filter, sort, and pagination
- **AI Lead Discovery** -- Autonomous agents find leads from GitHub, Product Hunt, and web search
- **AI Lead Enrichment** -- Claude AI enriches profiles with professional background and context
- **AI Lead Scoring** -- Scores leads 0-100 based on ICP fit with reasoning
- **AI Email Drafting** -- Generates personalized cold outreach emails
- **Kanban Pipeline** -- Drag-and-drop pipeline board with stage management
- **Company Management** -- Company profiles with firmographic data
- **Dashboard & Analytics** -- KPIs, charts, and activity feeds
- **JWT Authentication** -- Login, registration, token refresh, role-based access

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js 20, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL 16, Redis 7 |
| AI Agents | Python 3.11, FastAPI, Anthropic Claude SDK |
| Infrastructure | Docker, Docker Compose |

## Quick Start

```bash
# 1. Clone
git clone https://github.com/your-org/leadiq-crm.git
cd leadiq-crm

# 2. Configure environment
cp .env.example .env
# Edit .env -- add your API keys (Anthropic required, others optional)

# 3. Start all services
docker-compose up -d

# 4. Run migrations
docker-compose exec backend npm run migrate

# 5. Seed demo data
docker-compose exec backend npm run seed
```

Open **http://localhost:3000**

**Default login:**

| Field | Value |
|-------|-------|
| Email | `admin@leadiq.com` |
| Password | `Admin1234!` |

> Note: Demo credentials are only available after seeding the database. Change the admin password before any production use.

## Port Reference

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js web app |
| Backend API | http://localhost:4000 | Express REST API |
| AI Agents | http://localhost:8000 | FastAPI Python agents |
| API Docs | http://localhost:8000/docs | Interactive Swagger UI |
| PostgreSQL | localhost:5432 | Primary database |
| Redis | localhost:6379 | Cache and session store |

## API Keys

| Service | Required | Free Tier | Link |
|---------|----------|-----------|------|
| Anthropic | Yes | $5 credit | https://console.anthropic.com |
| SendGrid | Optional | 100/day | https://sendgrid.com |
| SerpAPI | Optional | 100/month | https://serpapi.com |
| GitHub Token | Optional | Free | https://github.com/settings/tokens |
| Product Hunt | Optional | Free | https://www.producthunt.com/v2/oauth/applications |

The app works without optional keys -- AI agents will use Claude's knowledge directly.

## Common Commands

```bash
npm run dev              # Start all services
npm run stop             # Stop all services
npm run logs             # Tail all logs
npm run db:migrate       # Run migrations
npm run db:seed          # Seed demo data
npm run db:reset         # Reset and re-seed DB
npm run test             # Run all tests
```

## Architecture

```
Browser -> Next.js (3000)
              |
         Express API (4000)
          /        \
    PostgreSQL    FastAPI Agents (8000)
    (5432)          |
    Redis          Claude AI
    (6379)
```

## Security Notes

- JWT secrets must be changed from default values before deployment
- Input validation is enforced on all API endpoints via Zod schemas
- Rate limiting is applied to all API routes (200 req/15min general, 20 req/15min for auth)
- CORS is restricted to the configured frontend URL
- Demo credentials should be changed in production environments

## License

MIT License. See [LICENSE](LICENSE) for details.
