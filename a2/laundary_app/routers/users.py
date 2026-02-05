from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from a2.laundary_app.database import get_db
from a2.laundary_app.models.user import User
from a2.laundary_app.schemas.user import UserResponse
from a2.laundary_app.core.dependencies import get_current_user
from a2.laundary_app.core.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me")
def update_my_profile(
    full_name: str | None = None,
    phone_number: str | None = None,
    password: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if full_name:
        current_user.full_name = full_name
    if phone_number:
        current_user.phone_number = phone_number
    if password:
        current_user.hashed_password = hash_password(password)

    db.commit()
    return {"message": "profile updated successfully"}


@router.delete("/me")
def delete_my_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.delete(current_user)
    db.commit()
    return {"message": "account deleted successfully"}
