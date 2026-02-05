from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from a2.laundary_app.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    payment_status = Column(String, default="pending")
    payment_method = Column(String)
    amount = Column(Float)
    paid_at = Column(DateTime, default=datetime.utcnow)
