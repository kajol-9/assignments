from pydantic import BaseModel
from datetime import date
from typing import List

class OrderItemCreate(BaseModel):
    item_name: str
    service_id: int
    quantity: int

class OrderCreate(BaseModel):
    pickup_address: str
    pickup_date: date
    items: List[OrderItemCreate]
    
class OrderStatusUpdate(BaseModel):
    order_status: str

