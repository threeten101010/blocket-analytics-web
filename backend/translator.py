#!/usr/bin/env python3
"""
Blocket Analytics Web Backend - Gemini Natural Language to SQL Engine
Translates English or Swedish natural language queries into optimized DuckDB SQL statements
and recommends interactive chart layouts using schema-aware generative prompt templates.
"""

import warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)

import os
import google.generativeai as genai
from pydantic import BaseModel, Field
from typing import Optional
from dotenv import load_dotenv

# Load local environment variables (.env file)
load_dotenv()

# ----------------- Configuration & Initialization -----------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("⚠️ [Translator] Warning: GEMINI_API_KEY environment variable is missing.")

# Pydantic schema for clean parsing in Python
class SQLTranslation(BaseModel):
    sql_query: str = Field(..., description="DuckDB SQL statement.")
    explanation: str = Field(..., description="Explanation of calculation.")
    recommended_chart: str = Field(..., description="Chart type.")
    x_axis_key: str = Field(..., description="X axis.")
    y_axis_key: str = Field(..., description="Y axis.")
    series_key: Optional[str] = Field(None, description="Optional series.")

# Direct JSON Schema definition to solve Pydantic v2 'default' field serialization issues in Gemini SDK
JSON_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "sql_query": {
            "type": "STRING",
            "description": "A valid, highly optimized DuckDB SQL query. Only SELECT statements are allowed. Never return write commands like UPDATE, DELETE, or DROP."
        },
        "explanation": {
            "type": "STRING",
            "description": "A concise one-sentence explanation of what the query calculates and what is displayed."
        },
        "recommended_chart": {
            "type": "STRING",
            "description": "The best chart type for visualizing these dimensions. Ranks as: 'bar', 'line', 'pie', 'scatter', or 'table' if a visual graph is inappropriate."
        },
        "x_axis_key": {
            "type": "STRING",
            "description": "The SQL result column name that maps to the X-axis coordinates (e.g. 'model_year')."
        },
        "y_axis_key": {
            "type": "STRING",
            "description": "The SQL result column name that maps to the Y-axis coordinates (e.g. 'avg_price' or 'count')."
        },
        "series_key": {
            "type": "STRING",
            "description": "Optional SQL result column name that divides the data into multiple series / colored chart lines (e.g. 'brand')."
        }
    },
    "required": ["sql_query", "explanation", "recommended_chart", "x_axis_key", "y_axis_key"]
}

# Strict DB Schema context passed to Gemini as a system instruction
DB_SCHEMA_PROMPT = """
You are an expert DuckDB SQL translator. Your job is to translate a natural language question (in Swedish or English) into a single optimized DuckDB SQL statement.

Target Table Schema (listings_analytics view):
- id: VARCHAR (Unique listing ID)
- title: VARCHAR (Ad title)
- url: VARCHAR (Source classified link)
- location: VARCHAR (City/municipality location in Sweden, e.g. Stockholm, Göteborg, Sundsvall)
- seller_type: VARCHAR ('private' or 'company')
- published_at: TIMESTAMP
- created_year: INTEGER (Year ad was posted)
- created_month: INTEGER (Month ad was posted)
- status: VARCHAR ('active' or 'removed')
- is_active: BOOLEAN (TRUE if listing is currently live, FALSE if sold/archived)
- removed_at: TIMESTAMP (Deactivation timestamp)
- price_sek: INTEGER (Listed price in Swedish Kronor)
- brand: VARCHAR (Motorcycle brand, e.g. YAMAHA, HONDA, KTM, BMW, DUCATI, CAN-AM)
- model: VARCHAR (Motorcycle model, e.g. MT-07, R1, GS)
- model_year: INTEGER (Manufacture year of the motorcycle)
- mileage_km: INTEGER (Total mileage)
- engine_cc: INTEGER (Engine size in cc)
- gearbox: VARCHAR ('Manuell' or 'Automat')
- fuel_type: VARCHAR ('Bensin', 'El', etc.)
- vehicle_type: VARCHAR (Style class, e.g. Touring, Sport, Custom, Veteran, Cross/enduro/trial)
- reg_number: VARCHAR (Swedish vehicle registration number)
- description: VARCHAR (Full ad description text containing comments on maintenance, tires, modifications, add-ons, or defects)
- dealer_name: VARCHAR (Dealer name, null if private seller)
- dealer_location: VARCHAR (Dealer city, null if private)
- price_update_count: INTEGER (Number of times seller modified the price)
- min_price_sek: INTEGER (Lowest recorded price in history)
- max_price_sek: INTEGER (Highest recorded price in history)

Query Guidelines & Core Constraints:
1. Ranks: Filter active ads only using `is_active = TRUE` unless the user explicitly requests historical/removed listings.
2. Wildcards & casing: Use string functions case-insensitively using ILIKE (e.g., brand ILIKE '%yamaha%').
3. Date operations: DuckDB supports standard ANSI timestamp handling.
4. Aggregations: ALWAYS alias aggregate calculations (e.g., count(*) as ad_count, avg(price_sek) as avg_price).
5. Size limits: ALWAYS append `LIMIT 100` (or smaller if asked) to prevent UI query rendering lag.
6. Safety constraint: Do NOT write statements with UPDATE, INSERT, DELETE, DROP, ALTER, or transactions. Only generate SELECT queries.
"""

def translate_query_to_sql(user_query: str, model_choice: str = "gemini-2.5-flash") -> SQLTranslation:
    """
    Translates a natural language user query into a clean SQL statement and graph suggestion.
    """
    print(f"🤖 [Gemini Engine] Translating via model: {model_choice}...")
    
    # Select requested model
    model_name = "gemini-2.5-pro" if model_choice == "gemini-2.5-pro" else "gemini-2.5-flash"
    
    prompt = f"""
Translate the following user question into a structured JSON response matching the database schema.
User Query: "{user_query}"
"""

    try:
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=DB_SCHEMA_PROMPT
        )
        
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=JSON_SCHEMA,
                temperature=0.1
            )
        )
        
        # Parse Pydantic object from response text
        import json
        clean_json = json.loads(response.text)
        return SQLTranslation(**clean_json)
        
    except Exception as e:
        print(f"❌ [Gemini Engine] SQL Translation failed: {e}")
        # Return fallback safe object on error
        return SQLTranslation(
            sql_query="SELECT brand, count(*) as volume FROM listings_analytics WHERE is_active = TRUE GROUP BY brand ORDER BY volume DESC LIMIT 10;",
            explanation="Failed to translate query. Displaying top 10 brands fallback query.",
            recommended_chart="bar",
            x_axis_key="brand",
            y_axis_key="volume"
        )

if __name__ == "__main__":
    # Rapid verification query
    res = translate_query_to_sql("Show me the average price of BMW motorcycles by year")
    print(f"SQL: {res.sql_query}")
    print(f"Chart: {res.recommended_chart} | X: {res.x_axis_key} | Y: {res.y_axis_key}")
