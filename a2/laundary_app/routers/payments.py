from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from a2.laundary_app.database import get_db
from a2.laundary_app.models.payment import Payment
from a2.laundary_app.models.order import Order
from a2.laundary_app.core.dependencies import get_current_user

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/{order_id}")
def make_payment(
    order_id: int,
    payment_method: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(status_code=403, detail="not authorized for this order")

    payment = Payment(
        order_id=order.id,
        amount=order.total_price,
        payment_method=payment_method,
        payment_status="paid",
        paid_at=datetime.utcnow()
    )

    db.add(payment)
    db.commit()
    return {"message": "payment successful"}


@router.get("/{order_id}")
def get_payment_details(
    order_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    payment = (
        db.query(Payment)
        .join(Order)
        .filter(
            Order.id == order_id,
            Order.user_id == current_user.id
        )
        .first()
    )

    if not payment:
        raise HTTPException(status_code=404, detail="payment not found")

    return payment
