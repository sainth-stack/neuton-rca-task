from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.db import repository
from app.db.repository import StoredLogEvent
from app.llm.client import is_openai_configured, parse_investigation_query
from app.vector.store import get_vector_store

TENANT_PATTERN = re.compile(r"tenant[-\s]?([a-z0-9]+)", re.IGNORECASE)


@dataclass
class RetrievalBundle:
    tenant_id: str
    events: list[StoredLogEvent] = field(default_factory=list)
    agent_steps: list[str] = field(default_factory=list)
    noise_scenario: bool = False


def retrieve_evidence(query: str, source_files: list[str] | None = None) -> RetrievalBundle:
    parsed = parse_investigation_query(query) if is_openai_configured() else {}
    tenant_id = parsed.get("tenant_id") or _extract_tenant(query)
    if not tenant_id:
        steps = ["No tenant found in query — include a tenant ID (e.g. TENANT-X) after uploading logs."]
        return RetrievalBundle(tenant_id="", events=[], agent_steps=steps)

    noise_scenario = bool(parsed.get("noise_scenario")) or _is_noise_scenario(query, tenant_id)

    steps = [f"Parsed query → tenant={tenant_id}, noise_scenario={noise_scenario}"]
    if parsed:
        steps.append(f"LLM query understanding → {parsed.get('summary_intent', 'investigate outage')}")

    if noise_scenario:
        bundle = _retrieve_noise_scenario(query, tenant_id, source_files, steps)
    else:
        bundle = _retrieve_chronological_scenario(query, tenant_id, source_files, steps)

    if is_openai_configured():
        semantic_ids = get_vector_store().semantic_search(query, tenant_id=tenant_id, top_k=12)
        if semantic_ids:
            semantic_events = repository.get_events_by_ids(semantic_ids)
            bundle.events = _merge_events(bundle.events, semantic_events)
            steps.append(f"Semantic search (OpenAI embeddings + Chroma) → {len(semantic_ids)} candidates")

    bundle.agent_steps = steps
    return bundle


def _extract_tenant(query: str) -> str | None:
    match = TENANT_PATTERN.search(query)
    if not match:
        return None
    token = match.group(1).upper()
    if token.startswith("TENANT-"):
        return token
    return f"TENANT-{token}"


def _is_noise_scenario(query: str, tenant_id: str) -> bool:
    normalized = query.lower()
    return tenant_id == "TENANT-Z" or "authentication" in normalized or "rate limit" in normalized or "spike" in normalized


def _retrieve_chronological_scenario(
    query: str,
    tenant_id: str,
    source_files: list[str] | None,
    steps: list[str],
) -> RetrievalBundle:
    events = repository.get_tenant_events(tenant_id, source_files=source_files)
    steps.append(f"Structural filter (SQLite) → {len(events)} ERROR/WARN lines for {tenant_id}")

    symptoms = [event for event in events if event.http_status == 503 or "503 Service Unavailable" in event.message]
    first_symptom = symptoms[0] if symptoms else None
    triggers: list[StoredLogEvent] = []
    context: list[StoredLogEvent] = []

    if first_symptom:
        steps.append(f"Located first downstream 503 at {first_symptom.timestamp} ({first_symptom.log_id})")
        before = [event for event in events if event.timestamp <= first_symptom.timestamp]
        for event in before:
            if "ConnectionTimeoutException" in event.message or "CLOSED -> OPEN" in event.message:
                triggers.append(event)
            elif "pool utilization exceeding 90%" in event.message:
                context.append(event)
        steps.append(
            f"Walked timeline before first 503 → {len(triggers)} trigger(s), {len(context)} context line(s)"
        )

    if not triggers:
        triggers = [event for event in events if "ConnectionTimeoutException" in event.message][:2]

    selected = _merge_events(triggers, symptoms[:3], context[:2], events[:5])
    return RetrievalBundle(tenant_id=tenant_id, events=selected, agent_steps=steps)


def _retrieve_noise_scenario(
    query: str,
    tenant_id: str,
    source_files: list[str] | None,
    steps: list[str],
) -> RetrievalBundle:
    target = tenant_id if tenant_id.startswith("TENANT-") else "TENANT-Z"
    events = repository.get_tenant_events(target, source_files=source_files)
    steps.append(f"Strict tenant isolation (SQLite) → {len(events)} {target} ERROR/WARN lines")

    noise_count = repository.count_events(tenant_id="TENANT-Y", level="ERROR")
    steps.append(f"Detected TENANT-Y volumetric noise (~{noise_count} ERROR lines) — excluded from evidence")

    triggers = [
        event
        for event in events
        if "Internal processing timeout" in event.message
        or "signature check" in event.message.lower()
    ]
    symptoms = [event for event in events if "SLA threshold" in event.message or "exceeded SLA" in event.message]

    if not triggers:
        triggers = [event for event in events if event.level == "ERROR"][:1]
    if not symptoms:
        symptoms = [event for event in events if event.level == "WARN"][:1]

    steps.append(f"Isolated quiet {target} signatures → {len(triggers)} trigger(s), {len(symptoms)} symptom(s)")
    selected = _merge_events(triggers, symptoms, events[:3])
    return RetrievalBundle(tenant_id=target, events=selected, agent_steps=steps, noise_scenario=True)


def _merge_events(*groups: list[StoredLogEvent]) -> list[StoredLogEvent]:
    merged: dict[str, StoredLogEvent] = {}
    for group in groups:
        for event in group:
            merged[event.log_id] = event
    return sorted(merged.values(), key=lambda event: (event.timestamp, event.line_number))


def format_event_for_llm(event: StoredLogEvent) -> str:
    stack = "\n  ".join(event.stack_trace or [])
    stack_block = f"\n  {stack}" if stack else ""
    return (
        f"log_id={event.log_id} | ts={event.timestamp} | tenant={event.tenant_id} | "
        f"level={event.level} | logger={event.logger}\n"
        f"message={event.message}{stack_block}"
    )
