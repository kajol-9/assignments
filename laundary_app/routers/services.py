from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from a2.laundary_app.database import get_db
from a2.laundary_app.models.service import LaundryService
from a2.laundary_app.schemas.service import ServiceCreate, ServiceResponse
from a2.laundary_app.core.dependencies import admin_only

router = APIRouter(prefix="/services", tags=["services"])


@router.post("/", response_model=ServiceResponse, dependencies=[Depends(admin_only)])
def create_service(service: ServiceCreate, db: Session = Depends(get_db)):
    new_service = LaundryService(**service.dict())
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return new_service


@router.put("/{service_id}", response_model=ServiceResponse, dependencies=[Depends(admin_only)])
def update_service(service_id: int, service: ServiceCreate, db: Session = Depends(get_db)):
    db_service = db.query(LaundryService).filter(
        LaundryService.id == service_id
    ).first()

    if not db_service:
        raise HTTPException(status_code=404, detail="service not found")

    db_service.service_name = service.service_name
    db_service.price_per_item = service.price_per_item
    db.commit()
    db.refresh(db_service)
    return db_service


@router.delete("/{service_id}", dependencies=[Depends(admin_only)])
def delete_service(service_id: int, db: Session = Depends(get_db)):
    service = db.query(LaundryService).filter(
        LaundryService.id == service_id
    ).first()

    if not service:
        raise HTTPException(status_code=404, detail="service not found")

    service.is_available = False
    db.commit()
    return {"message": "service disabled successfully"}


@router.get("/", response_model=list[ServiceResponse])
def get_all_services(db: Session = Depends(get_db)):
    return db.query(LaundryService).filter(
        LaundryService.is_available == True
    ).all()
