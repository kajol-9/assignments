
from dotenv import load_dotenv

load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from a2.laundary_app.database import Base, engine
from a2.laundary_app.routers import auth, users, services, orders, payments

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Online Laundry Service API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(services.router)
app.include_router(orders.router)
app.include_router(payments.router)

