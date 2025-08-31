# backend/main.py

import os
import requests # Import the new library
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo import MongoClient
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Optional
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
import secrets

# --- Password hashing setup ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- JWT settings ---
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# --- Pydantic Models for User Management ---
class UserCreate(BaseModel):
    username: str
    password: str
    name: str
    country_of_residence: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    username: str
    name: str
    country_of_residence: str

class TransferHistory(BaseModel):
    transfer_id: str
    amount: float
    source_country: str
    destination_country: str
    best_provider: str
    total_cost: float
    timestamp: datetime

# --- Pydantic Models (No changes here) ---
class CostBreakdown(BaseModel):
    provider_name: str
    provider_type: str
    fee_cost: float
    fx_cost: float
    total_cost: float
    amount_after_costs: float
    live_exchange_rate: Optional[float] = None # Add field for the live rate

class Recommendation(BaseModel):
    best_provider_name: str
    total_cost: float
    savings_over_provider: Optional[str] = None
    savings_amount: Optional[float] = None

class AnalysisResponse(BaseModel):
    costs: List[CostBreakdown]
    recommendation: Recommendation
    sending_currency: str
    receiving_country: str
    transfer_amount: float

class TransferRequest(BaseModel):
    amount: float
    source_country: str
    destination_country: str

# --- Load Environment Variables & DB Connection (No changes here) ---
load_dotenv()

def get_db():
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise Exception("MONGO_URI environment variable not set!")
    try:
        client = MongoClient(mongo_uri)
        db = client.get_database()
        return db
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        return None

db = get_db()
if db is not None:
    print("Successfully connected to MongoDB.")

# --- JWT Token Functions ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# --- Password Functions ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# --- NEW: Function to get live exchange rates ---
def get_live_exchange_rate(source_currency: str, dest_currency: str) -> Optional[float]:
    api_key = os.getenv("EXCHANGE_RATE_API_KEY")
    if not api_key:
        print("Warning: EXCHANGE_RATE_API_KEY not set. Cannot fetch live rates.")
        return None
    
    url = f"https://v6.exchangerate-api.com/v6/{api_key}/pair/{source_currency}/{dest_currency}"
    try:
        response = requests.get(url)
        response.raise_for_status() # Raise an exception for bad status codes
        data = response.json()
        if data.get("result") == "success":
            return data.get("conversion_rate")
    except requests.exceptions.RequestException as e:
        print(f"Error fetching exchange rate: {e}")
    return None

# --- FastAPI App Initialization (No changes here) ---
app = FastAPI()
origins = ["http://localhost:3000", "https://cost-optimizer.vercel.app"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- User Management API Endpoints ---

@app.post("/api/auth/register", response_model=UserResponse)
def register_user(user: UserCreate):
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    # Check if username already exists
    if db.users.find_one({"username": user.username}):
        raise HTTPException(
            status_code=400, 
            detail=f"Username '{user.username}' is already taken. Please choose a different username."
        )
    
    # Hash password and create user
    hashed_password = get_password_hash(user.password)
    user_doc = {
        "username": user.username,
        "hashed_password": hashed_password,
        "name": user.name,
        "country_of_residence": user.country_of_residence,
        "created_at": datetime.utcnow()
    }
    
    db.users.insert_one(user_doc)
    
    return UserResponse(
        username=user.username,
        name=user.name,
        country_of_residence=user.country_of_residence
    )

@app.post("/api/auth/login")
def login_user(user: UserLogin):
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    # Find user and verify password
    user_doc = db.users.find_one({"username": user.username})
    if not user_doc or not verify_password(user.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            username=user_doc["username"],
            name=user_doc["name"],
            country_of_residence=user_doc["country_of_residence"]
        )
    }

@app.get("/api/auth/me", response_model=UserResponse)
def get_current_user(username: str = Depends(verify_token)):
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    user_doc = db.users.find_one({"username": username})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        username=user_doc["username"],
        name=user_doc["name"],
        country_of_residence=user_doc["country_of_residence"]
    )

@app.get("/api/transfer/history")
def get_transfer_history(username: str = Depends(verify_token)):
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    history = list(db.transfer_history.find(
        {"username": username},
        {"_id": 0, "username": 0}
    ).sort("timestamp", -1).limit(50))
    
    return {"history": history}

# --- API Endpoints ---

# ... (get_countries and get_destinations endpoints remain the same) ...
@app.get("/api/countries")
def get_countries():
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not available")
    try:
        sending_countries = db.remittance_corridors.distinct("sending_country")
        country_data = list(db.country_mappings.find({"country": {"$in": sending_countries}}, {'_id': 0}))
        if not country_data:
            raise HTTPException(status_code=404, detail="No sending countries found.")
        return country_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/destinations/{source_country}")
def get_destinations(source_country: str):
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not available")
    try:
        corridors = db.remittance_corridors.find({"sending_country": source_country}, {"receiving_country": 1, "receiving_currency": 1, '_id': 0})
        destinations = [{"country": c["receiving_country"], "currency_code": c["receiving_currency"]} for c in corridors]
        if not destinations:
            raise HTTPException(status_code=404, detail=f"No destination countries found for {source_country}")
        unique_destinations = [dict(t) for t in {tuple(d.items()) for d in destinations}]
        return unique_destinations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- UPDATED analyze_transfer endpoint with user tracking ---
@app.post("/api/transfer/analyze", response_model=AnalysisResponse)
def analyze_transfer(request: TransferRequest, username: str = Depends(verify_token)):
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not available")

    corridor = db.remittance_corridors.find_one({
        "sending_country": request.source_country,
        "receiving_country": request.destination_country
    })

    if not corridor:
        raise HTTPException(status_code=404, detail=f"No remittance providers found for the corridor.")

    # Fetch the live exchange rate for this corridor
    live_rate = get_live_exchange_rate(corridor['sending_currency'], corridor['receiving_currency'])
    if live_rate is None:
        # Fallback if the API fails
        live_rate = 83.0 

    calculated_costs: List[CostBreakdown] = []
    for provider in corridor.get("providers", []):
        amount = request.amount
        
        # Calculate fee cost (same as before)
        fee_percentage_cost = amount * (provider.get("base_fee_percent", 0) / 100)
        minimum_fee = provider.get("min_fee", 0)
        fee_cost = max(fee_percentage_cost, minimum_fee)
        
        # --- DYNAMIC FX COST CALCULATION ---
        # The provider's rate is the live rate minus their margin
        provider_rate = live_rate * (1 - (provider.get("fx_margin_percent", 0) / 100))
        # The FX cost is the difference between the live rate and the provider's rate, multiplied by the amount
        fx_cost = (live_rate - provider_rate) * (amount / live_rate) # Simplified calculation
        
        total_cost = fee_cost + fx_cost
        amount_after_costs = amount - total_cost

        calculated_costs.append(CostBreakdown(
            provider_name=provider.get("provider_name"),
            provider_type=provider.get("provider_type"),
            fee_cost=round(fee_cost, 2),
            fx_cost=round(fx_cost, 2),
            total_cost=round(total_cost, 2),
            amount_after_costs=round(amount_after_costs, 2),
            live_exchange_rate=round(provider_rate, 2) # Pass the provider's actual rate to the frontend
        ))

    if not calculated_costs:
        raise HTTPException(status_code=404, detail="No provider data available for this corridor.")

    calculated_costs.sort(key=lambda x: x.total_cost)
    best_option = calculated_costs[0]
    
    # Recommendation logic remains the same
    recommendation_data = Recommendation(best_provider_name=best_option.provider_name, total_cost=best_option.total_cost)
    comparison_provider = next((p for p in reversed(calculated_costs) if p.provider_type == 'bank' and p.provider_name != best_option.provider_name), None)
    if not comparison_provider and len(calculated_costs) > 1:
        comparison_provider = calculated_costs[-1]
    if comparison_provider:
        savings = comparison_provider.total_cost - best_option.total_cost
        if savings > 1:
            recommendation_data.savings_over_provider = comparison_provider.provider_name
            recommendation_data.savings_amount = round(savings, 2)

    # --- Save transfer history for the user ---
    transfer_history_doc = {
        "username": username,
        "transfer_id": f"transfer_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{username}",
        "amount": request.amount,
        "source_country": request.source_country,
        "destination_country": request.destination_country,
        "best_provider": best_option.provider_name,
        "total_cost": best_option.total_cost,
        "timestamp": datetime.utcnow()
    }
    
    db.transfer_history.insert_one(transfer_history_doc)

    return AnalysisResponse(
        costs=calculated_costs,
        recommendation=recommendation_data,
        sending_currency=corridor['sending_currency'],
        receiving_country=request.destination_country,
        transfer_amount=request.amount
    )
