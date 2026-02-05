from fastapi import APIRouter, Depends, HTTPException, status,Query
from sqlalchemy.orm import Session
from datetime import date
from a2.laundary_app.database import get_db
from a2.laundary_app.schemas.order import OrderCreate, OrderStatusUpdate
from a2.laundary_app.models.order import Order, ORDER_STATUSES
from a2.laundary_app.models.order_item import OrderItem
from a2.laundary_app.models.service import LaundryService
from a2.laundary_app.core.dependencies import get_current_user, admin_only
route = APIRouter(prefix="/orders", tags=["orders"])



router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("/")
def create_order(
    order: OrderCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    new_order = Order(
        user_id=current_user.id,
        pickup_address=order.pickup_address,
        pickup_date=order.pickup_date,
        order_status="requested"
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    total_price = 0

    for item in order.items:
        service = db.query(LaundryService).get(item.service_id)
        if not service:
            raise HTTPException(status_code=404, detail="service not found")

        item_price = service.price_per_item * item.quantity
        total_price += item_price

        db.add(OrderItem(
            order_id=new_order.id,
            item_name=item.item_name,
            service_id=item.service_id,
            quantity=item.quantity,
            item_price=item_price
        ))

    new_order.total_price = total_price
    db.commit()

    return {
        "order_id": new_order.id,
        "order_status": new_order.order_status,
        "total_price": total_price
    }

@router.post("/{order_id}/reorder")
def reorder(order_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    old_order = db.query(Order).filter(Order.id == order_id).first()

    new_order = Order(
        user_id=current_user.id,
        pickup_address=old_order.pickup_address,
        order_status="requested"
    )
    db.add(new_order)
    db.commit()
    return {"message": "order reordered successfully", "new_order_id": new_order.id}

@router.get("/{order_id}/status")
def track_order_status(
    order_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="order not found")

    return {
        "order_id": order.id,
        "order_status": order.order_status
    }


@router.patch("/{order_id}/status", dependencies=[Depends(admin_only)])
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db)
):
    if status_update.order_status not in ORDER_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"invalid status. allowed: {ORDER_STATUSES}"
        )

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="order not found")

    # prevent invalid transitions
    if order.order_status == "delivered":
        raise HTTPException(
            status_code=400,
            detail="delivered order cannot be updated"
        )

    order.order_status = status_update.order_status

    # auto set delivery date
    if status_update.order_status == "delivered":
        order.delivery_date = date.today()

    db.commit()

    return {
        "order_id": order.id,
        "new_status": order.order_status
    }

@router.delete("/{order_id}")
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="order not found")

    if order.order_status != "requested":
        raise HTTPException(
            status_code=400,
            detail="only requested orders can be cancelled"
        )

    order.order_status = "cancelled"
    db.commit()

    return {"message": "order cancelled successfully"}

@router.get("/")
def filter_orders(
    status: str | None = Query(None, description="requested, picked_up, in_progress, delivered, cancelled"),
    service_type: str | None = Query(None, description="wash, dry_clean, iron"),
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Order).filter(Order.user_id == current_user.id)

    # filter by order status
    if status:
        query = query.filter(Order.order_status == status)

    # filter by date range
    if from_date and to_date:
        query = query.filter(
            Order.created_at.between(from_date, to_date)
        )
    elif from_date:
        query = query.filter(Order.created_at >= from_date)
    elif to_date:
        query = query.filter(Order.created_at <= to_date)

    # filter by service type
    if service_type:
        query = (
            query
            .join(OrderItem, OrderItem.order_id == Order.id)
            .join(LaundryService, LaundryService.id == OrderItem.service_id)
            .filter(LaundryService.service_name == service_type)
        )

    orders = query.distinct().all()

    return [
        {
            "order_id": order.id,
            "order_status": order.order_status,
            "total_price": order.total_price,
            "created_at": order.created_at
        }
        for order in orders
    ]

@router.get("/admin/all", dependencies=[Depends(admin_only)])
def admin_filter_orders(
    status: str | None = None,
    user_id: int | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Order)

    if status:
        query = query.filter(Order.order_status == status)

    if user_id:
        query = query.filter(Order.user_id == user_id)

    return query.all()



