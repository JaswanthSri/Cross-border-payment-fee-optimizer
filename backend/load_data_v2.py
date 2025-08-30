# backend/load_data_v2.py

import os
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
import re

# Load environment variables from .env file
load_dotenv()

def get_db_connection():
    """Establishes a connection to the MongoDB database."""
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise Exception("MONGO_URI environment variable not set!")
    
    client = MongoClient(mongo_uri)
    db = client.get_database()
    return db

def clean_provider_name(name):
    """Cleans up provider names by removing legal suffixes."""
    return re.sub(r'[,]?\s*(Inc|Ltd|LLC|Corp|N\.A\.)\.?$', '', str(name), flags=re.IGNORECASE).strip()

def determine_provider_type(name):
    """Determines if a provider is a bank or a fintech/money transfer operator."""
    name_lower = str(name).lower()
    if 'bank' in name_lower:
        return 'bank'
    return 'fintech'

def standardize_col_name(col_name):
    """Converts a column name to a standardized format (lowercase_with_underscores)."""
    return str(col_name).lower().strip().replace(' ', '_')

def process_and_load_data(db):
    """
    Loads, processes, and structures remittance data from the official World Bank Excel file.
    """
    remittance_collection = db.remittance_corridors
    mappings_collection = db.country_mappings
    
    remittance_collection.delete_many({})
    mappings_collection.delete_many({})
    print("Cleared existing collections.")

    try:
        file_path = "official_data/world_bank_data.xlsx"
        sheet_to_load = 'Dataset (from Q2 2016)'
        print(f"Attempting to load data from sheet: '{sheet_to_load}'")
        
        df = pd.read_excel(file_path, sheet_name=sheet_to_load)
        
        # --- FIX: Standardize all column names first for consistency ---
        df.columns = [standardize_col_name(col) for col in df.columns]
        
        # Now use standardized keys for renaming
        column_rename_map = {
            'source_name': 'sending_country',
            'destination_name': 'receiving_country',
            'source_code': 'sending_currency',
            'destination_code': 'receiving_currency',
            'firm': 'provider_name',
            'cc1_fx_margin': 'fx_margin_percent',
            'cc1_total_cost_%': 'total_cost_percent',
        }
        df.rename(columns=column_rename_map, inplace=True)
        
        # Filter to only the columns we actually need
        required_cols = list(column_rename_map.values())
        df = df[required_cols]

        print(f"Successfully loaded and standardized columns. Total rows: {len(df)}")

        df.dropna(subset=['sending_country', 'receiving_country', 'provider_name'], inplace=True)
        
        df['fx_margin_percent'] = pd.to_numeric(df['fx_margin_percent'], errors='coerce').fillna(0)
        df['total_cost_percent'] = pd.to_numeric(df['total_cost_percent'], errors='coerce').fillna(0)

        df['base_fee_percent'] = df['total_cost_percent'] - df['fx_margin_percent']
        df['base_fee_percent'] = df['base_fee_percent'].apply(lambda x: max(x, 0))

        df['provider_name'] = df['provider_name'].apply(clean_provider_name)
        df['provider_type'] = df['provider_name'].apply(determine_provider_type)
        
        df['min_fee'] = 1.0 
        df['speed_hours'] = 24

        country_df = df[['sending_country', 'sending_currency']].drop_duplicates().rename(columns={'sending_country': 'country', 'sending_currency': 'currency_code'})
        country_df['currency_name'] = country_df['currency_code']
        
        mappings_data = country_df.to_dict(orient='records')
        if mappings_data:
            mappings_collection.insert_many(mappings_data)
            print(f"Loaded {len(mappings_data)} unique country mappings.")

        grouped = df.groupby(['sending_country', 'receiving_country'])
        
        corridors_to_insert = []
        for (sending_country, receiving_country), group in grouped:
            sending_currency = group['sending_currency'].iloc[0]
            receiving_currency = group['receiving_currency'].iloc[0]
            
            unique_providers = group.drop_duplicates(subset=['provider_name'])

            corridor_doc = {
                "corridor": f"{sending_currency}-{receiving_currency}",
                "sending_country": sending_country,
                "sending_currency": sending_currency,
                "receiving_country": receiving_country,
                "receiving_currency": receiving_currency,
                "providers": unique_providers[['provider_name', 'provider_type', 'base_fee_percent', 'fx_margin_percent', 'min_fee', 'speed_hours']].to_dict(orient='records')
            }
            corridors_to_insert.append(corridor_doc)
            
        if corridors_to_insert:
            remittance_collection.insert_many(corridors_to_insert)
            print(f"Successfully processed and loaded data for {len(corridors_to_insert)} corridors.")
        else:
            print("No remittance data was processed.")

    except FileNotFoundError:
        print(f"ERROR: The data file was not found at '{file_path}'. Please make sure it's there.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    print("Connecting to database...")
    db_connection = get_db_connection()
    print("Database connection successful.")
    
    print("\nStarting the advanced data loading process from World Bank Excel file...")
    process_and_load_data(db_connection)
    
    print("\nData loading process finished.")
