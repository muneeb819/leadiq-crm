# LeadIQ CRM 🚀

> **AI-Powered Business Development CRM** — Automatically discover, enrich, score, and engage leads using Claude AI.

---

## ⚡ Up and Running in 5 Commands

```bash
# 1. Clone and enter
git clone https://github.com/your-org/leadiq-crm.git && cd leadiq-crm

# 2. Set up environment
cp .env.example .env
# Edit .env — add your API keys (Anthropic required, others optional)

# 3. Start all Docker services
docker-compose up -d

# 4. Run database migrations
npm run db:migrate

# 5. Seed demo data
npm run db:seed
```

Open **http://localhost:3000**

**Default login:**
| Field | Value |
|-------|-------|
| Email | `admin@leadiq.com` |
| Password | `Admin1234!` |

---

## 🌐 Port Reference

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Next.js web app |
| **Backend API** | http://localhost:4000 | Express REST API |
| **AI Agents** | http://localhost:8000 | FastAPI Python agents |
| **API Docs** | http://localhost:8000/docs | Interactive Swagger UI |
| **PostgreSQL** | localhost:5432 | Primary database |
| **Redis** | localhost:6379 | Cache & session store |

---

## 🔑 API Keys

| Service | Required | Free Tier | Link |
|---------|----------|-----------|------|
| **Anthropic** | ✅ Yes | $5 credit | https://console.anthropic.com |
| **SendGrid** | Optional | 100/day | https://sendgrid.com |
| **SerpAPI** | Optional | 100/month | https://serpapi.com |
| **GitHub Token** | Optional | Free | https://github.com/settings/tokens |
| **Product Hunt** | Optional | Free | https://www.producthunt.com/v2/oauth/applications |

> The app works without optional keys — AI agents will use Claude's knowledge directly.

---

## 🛠️ VS Code Setup

Open the workspace file for the best experience:
```bash
code leadiq-crm.code-workspace
```

This gives you:
- Separate explorer panels for each service
- One-click tasks to start/stop Docker
- Recommended extensions pre-configured

---

## 📋 Common Commands

```bash
npm run dev              # Start all services
npm run stop             # Stop all services
npm run logs             # Tail all logs
npm run db:migrate       # Run migrations
npm run db:seed          # Seed demo data
npm run db:reset         # Reset & re-seed DB
npm run test             # Run all tests
npm run shell:backend    # Shell into backend
npm run shell:postgres   # psql session
```

---

## 🏗️ Architecture

```
Browser → Next.js (3000)
             ↓
        Express API (4000)
         ↙        ↘
   PostgreSQL    FastAPI Agents (8000)
   (5432)         ↓
   Redis         Claude AI
   (6379)
```

---

## 🔧 Troubleshooting

**Services won't start?**
```bash
docker-compose ps              # Check status
docker-compose logs postgres   # Check DB logs
docker-compose down && docker-compose up -d --build
```

**Migrations fail?**
```bash
# Ensure DATABASE_URL uses 'postgres' not 'localhost'
# DATABASE_URL=postgresql://leadiq_user:pass@postgres:5432/leadiq
docker-compose exec backend npm run migrate
```

**Frontend can't reach backend?**
```bash
# Check NEXT_PUBLIC_API_URL=http://localhost:4000 in .env
curl http://localhost:4000/api/health
```

**AI agents offline?**
```bash
# Check ANTHROPIC_API_KEY is set in .env
docker-compose logs ai-agents
curl http://localhost:8000/health
```

**Port conflict?**
```bash
# Change left-side port in docker-compose.yml
# e.g. "3001:3000" to use port 3001 for frontend
```
