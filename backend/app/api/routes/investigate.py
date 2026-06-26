from fastapi import APIRouter

from app.api.schemas import InvestigateRequest, InvestigateResponse
from app.investigate.service import run_investigation

router = APIRouter(prefix="/investigate", tags=["investigate"])


@router.post(
    "",
    response_model=InvestigateResponse,
    summary="Investigate an incident",
    description=(
        "Accepts a natural-language query and returns a structured root-cause analysis "
        "with triggers, symptoms, cited log evidence, and agent reasoning steps."
    ),
)
def investigate(payload: InvestigateRequest) -> InvestigateResponse:
    return run_investigation(payload)
