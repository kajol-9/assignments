from sqlalchemy import Column, Integer, String, Float, ForeignKey
from a2.laundary_app.database import Base

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    item_name = Column(String, nullable=False)
    service_id = Column(Integer, ForeignKey("laundry_services.id"))
    quantity = Column(Integer, default=1)
    item_price = Column(Float)
