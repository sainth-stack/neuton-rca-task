# RCA Engine — Design

Ingest multi-tenant logs, index them, and answer outage questions in plain English — with cited log lines as proof.

---

## Problem

During incidents, engineers ask things like *"What caused 503s for TENANT-X?"*

Two cases we must handle:

1. **Symptom flood** — thousands of 503s hide one real trigger (pool timeout).
2. **Tenant noise** — TENANT-Y auth spam hides a quiet TENANT-Z failure.

We separate triggers from symptoms and cite real log_id values.

---

## Architecture

    INGEST                         INVESTIGATE
    -----                          -----------

    Upload .log
        |
        v
      Parse ----------------------> SQLite (all lines)
        |
        v
    Embed ERROR/WARN
        |
        v
      Chroma

    NL Query --> Retrieve (SQLite + Chroma) --> LLM summary --> Answer + citations

| Part | Tech | LLM? |
|------|------|------|
| Parse & store | Regex + SQLite | No |
| Semantic search | OpenAI embeddings + Chroma | Embeddings only |
| RCA answer | OpenAI chat | Yes |

**Rule:** retrieve first, summarize second. The LLM only sees matched lines — not the full log file.

---

## Task 1 — Ingest

**Log line format:**

    2026-05-26T12:02:58.661Z [TENANT-X] ERROR [com.example.Gateway] Status: 503
        at com.example.Pool.borrow(Pool.java:142)

**Stored per line:** log_id, tenant_id, timestamp, level, logger, message, http_status, stack_trace

**Tables:**
- log_sources — file name, line count, tenants, status
- log_events — parsed lines, indexed by tenant / level / time

**Flow:** upload → parse → SQLite → embed ERROR/WARN to Chroma (background)

Parsing is fully deterministic. Only embedding uses the LLM API.

---

## Task 2 — Investigation

**Steps:**
1. Get tenant from query
2. Retrieve evidence (SQLite filters + Chroma search, tenant-scoped)
3. LLM writes root cause from retrieved lines only
4. Validate citations — drop any log_id not in the retrieved set

**Scenario 1** — *503 errors for TENANT-X*
- Find first 503, walk back for pool timeout / circuit breaker
- Treat 503 flood as symptoms, not root cause

**Scenario 2** — *failures for TENANT-Z during auth spike*
- Filter to TENANT-Z only, ignore TENANT-Y noise
- Surface quiet errors: processing timeout, signature failure

**Output:** root cause, triggers, symptoms, evidence (log_id + role), agent steps

---

## Trade-offs

| Choice | Good for | Limit |
|--------|----------|-------|
| SQLite | Simple local demo | Not for huge scale |
| Regex parser | Fast, reproducible | New formats need updates |
| ERROR/WARN only in Chroma | Lower cost | INFO not in vector search |
| Retrieve-then-summarize | No hallucinations | Extra step vs raw chat |

---

## API

| Path | What it does |
|------|--------------|
| POST /api/ingest/upload | Upload logs |
| GET /api/logs | Browse with filters |
| POST /api/investigate | Run RCA query |
| GET /api/health | Status check |

Full docs: http://127.0.0.1:8000/api/docs
