from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from datetime import datetime
from a2.laundary_app.database import Base

ORDER_STATUSES = (
    "requested",
    "picked_up",
    "in_progress",
    "delivered",
    "cancelled"
)

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    order_status = Column(String, default="requested")
    pickup_address = Column(String, nullable=False)
    pickup_date = Column(Date)
    delivery_date = Column(Date)
    total_price = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
