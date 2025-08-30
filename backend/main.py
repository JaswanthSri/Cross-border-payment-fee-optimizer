# backend/main.py

import os
import requests # Import the new library
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Optional

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
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


# --- UPDATED analyze_transfer endpoint ---
@app.post("/api/transfer/analyze", response_model=AnalysisResponse)
def analyze_transfer(request: TransferRequest):
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

    return AnalysisResponse(
        costs=calculated_costs,
        recommendation=recommendation_data,
        sending_currency=corridor['sending_currency'],
        receiving_country=request.destination_country,
        transfer_amount=request.amount
    )
