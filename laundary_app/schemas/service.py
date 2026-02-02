from pydantic import BaseModel

class ServiceCreate(BaseModel):
    service_name: str
    price_per_item: float

class ServiceResponse(ServiceCreate):
    id: int

    class Config:
        from_attributes = True
