from fastapi import APIRouter

from app.api.schemas import InvestigateRequest, InvestigateResponse
from app.investigate.service import run_investigation

router = APIRouter(prefix="/investigate", tags=["investigate"])


@router.post("", response_model=InvestigateResponse)
def investigate(payload: InvestigateRequest) -> InvestigateResponse:
    return run_investigation(payload)
