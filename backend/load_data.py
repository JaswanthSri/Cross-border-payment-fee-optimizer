# backend/load_data.py

import os
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def get_db_connection():
    """Establishes a connection to the MongoDB database."""
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise Exception("MONGO_URI environment variable not set!")
    
    client = MongoClient(mongo_uri)
    # The database name is part of the MONGO_URI
    db = client.get_database() 
    return db

def load_country_currency_mappings(db):
    """Loads country-currency mapping data from CSV into MongoDB."""
    collection = db.country_mappings
    # Clear existing data to avoid duplicates on re-run
    collection.delete_many({})
    
    try:
        df = pd.read_csv("data/country_currency_mapping.csv")
        data = df.to_dict(orient="records")
        if data:
            collection.insert_many(data)
            print(f"Successfully loaded {len(data)} country mappings.")
        else:
            print("No data found in country_currency_mapping.csv")
    except FileNotFoundError:
        print("Error: data/country_currency_mapping.csv not found.")

def load_remittance_data(db):
    """
    Loads and structures remittance corridor data from CSV into MongoDB.
    Data is grouped by corridor (e.g., 'USD-INR').
    """
    remittance_collection = db.remittance_corridors
    mappings_collection = db.country_mappings
    
    # Clear existing data
    remittance_collection.delete_many({})
    
    try:
        df = pd.read_csv("data/remittance_data.csv")
        # Get currency codes for mapping
        country_mappings = {item['country']: item['currency_code'] for item in mappings_collection.find()}
        
        # Group providers by corridor
        grouped = df.groupby(['sending_country', 'receiving_country'])
        
        corridors_to_insert = []
        for (sending_country, receiving_country), group in grouped:
            sending_currency = country_mappings.get(sending_country, 'N/A')
            receiving_currency = country_mappings.get(receiving_country, 'N/A')
            
            corridor_doc = {
                "corridor": f"{sending_currency}-{receiving_currency}",
                "sending_country": sending_country,
                "sending_currency": sending_currency,
                "receiving_country": receiving_country,
                "receiving_currency": receiving_currency,
                "providers": group.drop(['sending_country', 'receiving_country'], axis=1).to_dict(orient='records')
            }
            corridors_to_insert.append(corridor_doc)
            
        if corridors_to_insert:
            remittance_collection.insert_many(corridors_to_insert)
            print(f"Successfully loaded data for {len(corridors_to_insert)} corridors.")
        else:
            print("No remittance data processed.")

    except FileNotFoundError:
        print("Error: data/remittance_data.csv not found.")
    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    print("Connecting to database...")
    db_connection = get_db_connection()
    print("Database connection successful.")
    
    print("\nLoading country-currency mappings...")
    load_country_currency_mappings(db_connection)
    
    print("\nLoading remittance corridor data...")
    load_remittance_data(db_connection)
    
    print("\nData loading process finished.")

