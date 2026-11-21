from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..deps import get_db, require_roles
from ..models import User
from ..schemas.agent import ServiceDuJour, ServirCodeRequest, ServirRequest, ServirResponse
from ..services.comptoir import service_du_jour, servir, servir_par_code

router = APIRouter(prefix="/agent", tags=["agent"])
agent = require_roles("agent", "admin")


@router.post("/servir", response_model=ServirResponse)
def post_servir(body: ServirRequest, _: User = Depends(agent), db: Session = Depends(get_db)):
    result = servir(db, body.ticket, datetime.now())
    db.commit()
    return result


@router.post("/servir-code", response_model=ServirResponse)
def post_servir_code(body: ServirCodeRequest, user: User = Depends(agent), db: Session = Depends(get_db)):
    result = servir_par_code(db, body.code, user.id, datetime.now())
    db.commit()
    return result


@router.get("/service-du-jour", response_model=ServiceDuJour)
def get_service(_: User = Depends(agent), db: Session = Depends(get_db)):
    return service_du_jour(db, datetime.now())
