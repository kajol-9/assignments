from sqlalchemy import Column, Integer, String, Float, Boolean
from a2.laundary_app.database import Base

class LaundryService(Base):
    __tablename__ = "laundry_services"

    id = Column(Integer, primary_key=True)
    service_name = Column(String, nullable=False)
    price_per_item = Column(Float, nullable=False)
    is_available = Column(Boolean, default=True)
