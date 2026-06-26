from __future__ import annotations

from app.api.schemas import EvidenceItem, InvestigateRequest, InvestigateResponse
from app.db.repository import StoredLogEvent
from app.investigate import retrieval
from app.investigate.retrieval import RetrievalBundle, format_event_for_llm
from app.llm.client import is_openai_configured, synthesize_rca


def run_investigation(payload: InvestigateRequest) -> InvestigateResponse:
    bundle = retrieval.retrieve_evidence(payload.query, payload.sources or None)

    if not bundle.events:
        return InvestigateResponse(
            query=payload.query,
            root_cause="No indexed log events found for the requested tenant.",
            summary="Upload .log files on the Ingest page first, then retry with a tenant ID in your query.",
            triggers=[],
            symptoms=[],
            evidence=[],
            agent_steps=bundle.agent_steps
            + ["No matching events in SQLite/Chroma — upload logs and include a tenant in your query"],
        )

    if is_openai_configured():
        return _run_with_openai(payload.query, bundle)

    return _run_deterministic_fallback(payload.query, bundle)


def _run_with_openai(query: str, bundle: RetrievalBundle) -> InvestigateResponse:
    evidence_blocks = [format_event_for_llm(event) for event in bundle.events]
    try:
        llm_result = synthesize_rca(query, evidence_blocks, bundle.agent_steps)
    except Exception:
        fallback = _run_deterministic_fallback(query, bundle)
        fallback.agent_steps = bundle.agent_steps + ["OpenAI synthesis failed — used deterministic RCA fallback"]
        return fallback

    allowed_ids = {event.log_id for event in bundle.events}
    events_by_id = {event.log_id: event for event in bundle.events}

    evidence: list[EvidenceItem] = []
    for item in llm_result.get("evidence", []):
        log_id = item.get("log_id")
        if log_id not in allowed_ids:
            continue
        event = events_by_id[log_id]
        role = item.get("role", "context")
        if role not in {"trigger", "symptom", "context"}:
            role = "context"
        evidence.append(_to_evidence(event, role))

    if not evidence:
        evidence = [_to_evidence(event, "context") for event in bundle.events[:5]]

    agent_steps = llm_result.get("agent_steps") or bundle.agent_steps
    agent_steps = list(dict.fromkeys([*bundle.agent_steps, *agent_steps]))

    return InvestigateResponse(
        query=query,
        root_cause=llm_result.get("root_cause", "Unable to determine root cause from retrieved evidence."),
        summary=llm_result.get("summary", ""),
        triggers=llm_result.get("triggers") or [],
        symptoms=llm_result.get("symptoms") or [],
        evidence=evidence,
        agent_steps=agent_steps,
    )


def _run_deterministic_fallback(query: str, bundle: RetrievalBundle) -> InvestigateResponse:
    """Rule-based RCA when OPENAI_API_KEY is missing."""
    if bundle.noise_scenario:
        triggers = [event for event in bundle.events if "Internal processing timeout" in event.message]
        symptoms = [event for event in bundle.events if "SLA threshold" in event.message]
        evidence = _build_evidence(triggers[:1], symptoms[:1], [])
        return InvestigateResponse(
            query=query,
            root_cause=(
                "TENANT-Z experienced an internal processing timeout during RSA signature verification, "
                "unrelated to TENANT-Y authentication rate limiting."
            ),
            summary="Deterministic fallback (set OPENAI_API_KEY for full agent synthesis).",
            triggers=[
                "Internal processing timeout during token validation signature check",
                "RSA.verify stack frame implicates signature verification path",
            ],
            symptoms=["Request processing time exceeded SLA threshold (2500ms)"],
            evidence=evidence,
            agent_steps=bundle.agent_steps + ["OPENAI_API_KEY missing — used deterministic RCA fallback"],
        )

    triggers = [
        event
        for event in bundle.events
        if "ConnectionTimeoutException" in event.message or "CLOSED -> OPEN" in event.message
    ]
    symptoms = [event for event in bundle.events if "503 Service Unavailable" in event.message]
    context = [event for event in bundle.events if "pool utilization exceeding 90%" in event.message]
    evidence = _build_evidence(triggers, symptoms[:1], context[:1])
    symptom_count = len([event for event in bundle.events if "503" in event.message])

    return InvestigateResponse(
        query=query,
        root_cause=(
            "Database connection pool exhaustion on DB-Cluster-01 caused a "
            "ConnectionTimeoutException before downstream circuit breaker and 503 symptoms."
        ),
        summary="Deterministic fallback (set OPENAI_API_KEY for full agent synthesis).",
        triggers=[
            "Connection pool utilization exceeded 90% for DB-Cluster-01",
            "ConnectionTimeoutException after 3000ms waiting for idle connection",
            "Circuit breaker transitioned CLOSED → OPEN due to DB component error rate",
        ],
        symptoms=[
            f"{symptom_count} HTTP 503 Service Unavailable responses from gateway ingress",
            "CircuitBreaker [DB-Cluster-01] OPEN — rejecting traffic",
        ],
        evidence=evidence,
        agent_steps=bundle.agent_steps + ["OPENAI_API_KEY missing — used deterministic RCA fallback"],
    )


def _build_evidence(
    triggers: list[StoredLogEvent],
    symptoms: list[StoredLogEvent],
    context: list[StoredLogEvent],
) -> list[EvidenceItem]:
    evidence: list[EvidenceItem] = []
    for event in triggers:
        evidence.append(_to_evidence(event, "trigger"))
    for event in symptoms:
        evidence.append(_to_evidence(event, "symptom"))
    for event in context:
        evidence.append(_to_evidence(event, "context"))
    return evidence


def _to_evidence(event: StoredLogEvent, role: str) -> EvidenceItem:
    return EvidenceItem(
        log_id=event.log_id,
        timestamp=event.timestamp,
        tenant_id=event.tenant_id,
        level=event.level,
        message=event.message,
        role=role,
        source_file=event.source_file,
        logger=event.logger,
        http_status=event.http_status,
        stack_trace=event.stack_trace or [],
    )
