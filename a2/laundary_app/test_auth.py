import os
from fastapi.testclient import TestClient
from main import app
from a2.laundary_app.database import Base, engine

# Drop and create tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_register_and_login():
    # Test user registration
    user_data = {
        "full_name": "John Doe",
        "email": "john@example.com",
        "password": "password123",
        "phone_number": "1234567890"
    }

    response = client.post("/auth/register", json=user_data)
    print("Register Response:", response.status_code, response.json())

    if response.status_code == 200:
        # Test login
        login_data = {
            "email": "john@example.com",
            "password": "password123"
        }

        response = client.post("/auth/login", data=login_data)
        print("Login Response:", response.status_code, response.json())

        if response.status_code == 200:
            token = response.json()["access_token"]
            print("Login successful, token:", token)
        else:
            print("Login failed")
    else:
        print("Registration failed")

if __name__ == "__main__":
    test_register_and_login()
