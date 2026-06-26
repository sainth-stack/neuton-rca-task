"""OpenAPI / Swagger metadata for the RCA API."""

OPENAPI_TAGS = [
    {
        "name": "health",
        "description": "Check whether the API is running and OpenAI/SQLite are configured.",
    },
    {
        "name": "ingest",
        "description": "Upload `.log` files, list sources, and run the parse + index pipeline.",
    },
    {
        "name": "investigate",
        "description": "Agentic RCA query — structural SQLite retrieval + OpenAI embeddings/Chroma + LLM synthesis.",
    },
    {
        "name": "logs",
        "description": "Browse indexed log events with tenant/level/source filters.",
    },
]

API_DESCRIPTION = """
## Neuron7 RCA Engine

Hybrid ingest and agentic diagnostics aligned with the Solution Engineer assignment.

### Architecture
| Layer | Technology | Role |
|-------|------------|------|
| Deterministic parse | Regex parser | Normalize multi-tenant log lines |
| Structural store | SQLite | Tenant/level/time filtering |
| Semantic index | OpenAI embeddings + Chroma | Noise-resistant semantic retrieval |
| Agent synthesis | OpenAI chat (JSON) | Root cause from cited evidence only |

### Typical flow
1. **Upload** — `POST /api/ingest/upload` saves and parses your `.log` files
2. **Explore** — `GET /api/logs?tenant=TENANT-X&level=ERROR`
3. **Investigate** — `POST /api/investigate` runs the agent loop with cited evidence

Requires `OPENAI_API_KEY` in `.env` for embeddings and RCA synthesis.

Interactive docs: **/docs** · OpenAPI JSON: **/openapi.json**
"""
