
## Prerequisites

- Python 3.9+
- Node.js 18+
- OpenAI API key

---

## Quick start

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set OPENAI_API_KEY=sk-...
uvicorn app.main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/api/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173


## Project structure

```
neuron7-rca/
├── DESIGN.md         
├── README.md
├── backend/
│   ├── app/
│   │   ├── ingest/     # Parser + upload pipeline
│   │   ├── investigate/# Retrieval + RCA agent
│   │   ├── vector/     # Chroma semantic index
│   │   ├── llm/        # OpenAI embeddings + synthesis
│   │   ├── db/         # SQLite storage
│   │   └── api/        # FastAPI routes
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    └── src/
        ├── pages/      # Dashboard, Ingest, Investigate, Logs
        └── lib/api/    # Axios client
```

---

## Pages

| Route | Screen | Purpose |
|-------|--------|---------|
| `/` | Dashboard | Index stats, OpenAI status, workflow links |
| `/ingest` | Data Ingest | Upload, parse, and embed `.log` files |
| `/investigate` | RCA Query | NL query → root cause + cited evidence |
| `/logs` | Log Explorer | Filter events by tenant, level, source |

---

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health check + index stats |
| GET | `/api/ingest/sources` | List log sources (`?scope=uploaded`) |
| POST | `/api/ingest/upload` | Upload `.log` files |
| DELETE | `/api/ingest/sources` | Delete file and all indexed data |
| POST | `/api/ingest` | Re-run embed pipeline |
| GET | `/api/logs` | Paginated log explorer |
| POST | `/api/investigate` | Root-cause query |

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | Required for embeddings and RCA synthesis |
| `CHAT_MODEL` | `gpt-4o-mini` | Model for query understanding + RCA |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | Embedding model |
| `SQLITE_PATH` | `./data/logs.sqlite` | Structural log store |
| `CHROMA_PATH` | `./data/chroma` | Vector index path |
| `UPLOAD_DIR` | `./data/uploads` | Uploaded log files |

---

## How it works (short)

1. **Parse (deterministic)** — regex extracts tenant, level, message, stack traces into SQLite.
2. **Index (hybrid)** — all lines in SQLite; ERROR/WARN embedded into Chroma per tenant.
3. **Investigate (agentic)** — structural retrieval finds triggers before symptoms; semantic search adds relevant lines; LLM synthesizes an answer citing only retrieved `log_id`s.
