from __future__ import annotations

import json
from typing import Any

from openai import OpenAI

from app.config import get_settings

RCA_SYSTEM_PROMPT = """You are an RCA (Root Cause Analysis) agent for a multi-tenant log platform.

Rules:
- Use ONLY the log evidence provided below. Never invent log lines or log_ids.
- Every evidence item MUST reference a log_id from the provided set.
- Classify each cited line as trigger (initiator), symptom (downstream effect), or context.
- Distinguish chronological triggers from symptom floods (e.g. one pool timeout vs hundreds of 503s).
- For noise scenarios, ignore unrelated tenants even if they appear in the query context.
- Return valid JSON matching the requested schema.
"""


def get_openai_client() -> OpenAI | None:
    settings = get_settings()
    key = settings.openai_api_key.strip()
    if not key or key.startswith("sk-your"):
        return None
    return OpenAI(api_key=key)


def is_openai_configured() -> bool:
    return get_openai_client() is not None


def embed_texts(texts: list[str]) -> list[list[float]]:
    client = get_openai_client()
    if client is None or not texts:
        return []

    settings = get_settings()
    try:
        response = client.embeddings.create(model=settings.embedding_model, input=texts)
        return [item.embedding for item in response.data]
    except Exception:
        return []


def parse_investigation_query(query: str) -> dict[str, Any]:
    client = get_openai_client()
    if client is None:
        return {}

    settings = get_settings()
    try:
        response = client.chat.completions.create(
            model=settings.chat_model,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Extract investigation parameters from the user query. "
                        'Return JSON: {"tenant_id": "TENANT-X or null", '
                        '"symptom_keywords": ["503", "timeout"], '
                        '"noise_scenario": true/false, '
                        '"summary_intent": "short phrase"}'
                    ),
                },
                {"role": "user", "content": query},
            ],
            temperature=0,
        )
        content = response.choices[0].message.content or "{}"
        return json.loads(content)
    except Exception:
        return {}


def synthesize_rca(query: str, evidence_blocks: list[str], agent_steps: list[str]) -> dict[str, Any]:
    client = get_openai_client()
    if client is None:
        raise RuntimeError("OPENAI_API_KEY is not configured.")

    settings = get_settings()
    evidence_text = "\n\n".join(evidence_blocks)
    steps_text = "\n".join(f"- {step}" for step in agent_steps)

    response = client.chat.completions.create(
        model=settings.chat_model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": RCA_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Query: {query}\n\n"
                    f"Retrieval steps already performed:\n{steps_text}\n\n"
                    "Available log evidence (cite only these log_ids):\n"
                    f"{evidence_text}\n\n"
                    "Return JSON with keys: root_cause, summary, triggers (string array), "
                    "symptoms (string array), evidence (array of {log_id, role}), "
                    "agent_steps (string array — include retrieval + reasoning steps)."
                ),
            },
        ],
        temperature=0.1,
    )
    content = response.choices[0].message.content or "{}"
    return json.loads(content)
