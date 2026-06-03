#!/usr/bin/env python3
"""
Blocket Analytics Web Backend - FastAPI Gateway
Exposes asynchronous endpoints for AI SQL Translation, dynamic appraisals,
live deals retrieval, and geographic pricing insights.
"""

import warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)

import uvicorn
from fastapi import FastAPI, HTTPException, Request, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from collections import defaultdict
import time
import os

# Local modules
from database import execute_remote_sql
from translator import translate_query_to_sql

app = FastAPI(
    title="🇸🇪 Blocket Analytics Web Backend",
    description="Asynchronous API broker for motorcycle market intelligence & cohort ML appraisal",
    version="1.0.0"
)

# Configure CORS dynamically based on environment configuration
CORS_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3005")
ALLOWED_ORIGINS = [origin.strip() for origin in CORS_ORIGINS_RAW.split(",") if origin.strip()]

if os.getenv("NODE_ENV") == "production":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# --- Pydantic Schema Definitions ---
class QueryRequest(BaseModel):
    user_query: str = Field(..., json_schema_extra={"example": "Show the average price of Yamaha MT-07 by year"})
    model_choice: str = Field("gemini-2.5-flash", json_schema_extra={"example": "gemini-2.5-flash"})

class AppraisalRequest(BaseModel):
    brand: str = Field(..., json_schema_extra={"example": "Yamaha"})
    vehicle_type: str = Field(..., json_schema_extra={"example": "Touring"})
    year: int = Field(..., json_schema_extra={"example": 2021})
    mileage: int = Field(..., json_schema_extra={"example": 12000})
    cc: int = Field(..., json_schema_extra={"example": 700})

# Bucketing algorithms to match frontend requests with SQL cohorts
def get_year_bucket(year: int) -> str:
    if year < 1990: return "<1990"
    elif year <= 1999: return "1990-1999"
    elif year <= 2005: return "2000-2005"
    elif year <= 2010: return "2006-2010"
    elif year <= 2015: return "2011-2015"
    elif year <= 2020: return "2016-2020"
    elif year <= 2023: return "2021-2023"
    else: return "2024+"

def get_mileage_bucket(km: int) -> str:
    if km <= 5000: return "0-5k"
    elif km <= 15000: return "5k-15k"
    elif km <= 30000: return "15k-30k"
    else: return "30k+"

def get_cc_bucket(cc: int) -> str:
    if cc <= 125: return "<125cc"
    elif cc <= 300: return "126-300cc"
    elif cc <= 650: return "301-650cc"
    elif cc <= 1000: return "651-1000cc"
    else: return ">1000cc"

def cohort_key_to_sql_conditions(cohort_key: str) -> str:
    parts = [p.strip() for p in cohort_key.split("|")]
    conditions = []
    
    if len(parts) == 1:
        conditions.append(f"vehicle_type ILIKE '{parts[0]}'")
    else:
        # Brand (parts[0])
        conditions.append(f"brand ILIKE '{parts[0]}'")
        # Style (parts[1])
        conditions.append(f"vehicle_type ILIKE '{parts[1]}'")
        
        # Year Bucket (parts[2])
        if len(parts) >= 3:
            y_bucket = parts[2]
            if y_bucket == "<1990":
                conditions.append("model_year < 1990")
            elif y_bucket == "2024+":
                conditions.append("model_year >= 2024")
            elif "-" in y_bucket:
                y1, y2 = y_bucket.split("-")
                conditions.append(f"model_year BETWEEN {y1} AND {y2}")
                
        # CC Bucket (parts[3])
        if len(parts) >= 4:
            cc_bucket = parts[3]
            if cc_bucket == "<125cc":
                conditions.append("engine_cc <= 125")
            elif cc_bucket == ">1000cc":
                conditions.append("engine_cc > 1000")
            elif "-300cc" in cc_bucket:
                conditions.append("engine_cc BETWEEN 126 AND 300")
            elif "-650cc" in cc_bucket:
                conditions.append("engine_cc BETWEEN 301 AND 650")
            elif "-1000cc" in cc_bucket:
                conditions.append("engine_cc BETWEEN 651 AND 1000")
                
        # Mileage Bucket (parts[4])
        if len(parts) >= 5:
            m_bucket = parts[4]
            if m_bucket == "0-5k":
                conditions.append("mileage_km <= 5000")
            elif m_bucket == "5k-15k":
                conditions.append("mileage_km BETWEEN 5001 AND 15000")
            elif m_bucket == "15k-30k":
                conditions.append("mileage_km BETWEEN 15001 AND 30000")
            elif m_bucket == "30k+":
                conditions.append("mileage_km > 30000")
                
    return " AND ".join(conditions)

import re

def is_safe_read_only_sql(sql_query: str) -> bool:
    """
    Validates that a SQL query is strictly a read-only query.
    Blocks write commands, data exports, file actions, and stacked queries.
    """
    # 1. Clean the query comments
    cleaned = re.sub(r'--.*$', '', sql_query, flags=re.MULTILINE)
    cleaned = re.sub(r'/\*.*?\*/', '', cleaned, flags=re.DOTALL)
    cleaned = cleaned.strip()
    
    if not cleaned:
        return False
        
    # 2. Block stacked queries (semicolon query injection)
    if ';' in cleaned:
        parts = [p.strip() for p in cleaned.split(';') if p.strip()]
        if len(parts) > 1:
            return False
            
    # 3. Verify it starts with a safe read-only instruction
    first_word_match = re.match(r'^([a-zA-Z]+)', cleaned)
    if not first_word_match:
        return False
    first_word = first_word_match.group(1).upper()
    
    SAFE_START_KEYWORDS = {"SELECT", "WITH", "DESCRIBE", "SHOW", "EXPLAIN"}
    if first_word not in SAFE_START_KEYWORDS:
        return False
        
    # 4. Search for forbidden write and admin keywords with word boundaries
    forbidden_pattern = r'\b(insert|update|delete|drop|alter|create|replace|truncate|grant|revoke|execute|exec|merge|upsert|load|copy|attach|detach)\b'
    if re.search(forbidden_pattern, cleaned.lower()):
        return False
        
    return True

# API key for production authorization
API_KEY = os.getenv("BLOCKET_API_KEY", "dev-secret-key-101010")

# In-memory sliding-window rate limiter: max 15 requests per minute per IP
ip_request_timestamps = defaultdict(list)

def enforce_security_policies(request: Request, x_api_key: str = Header(None)):
    # 1. API Token Verification (if enabled in env or in production)
    require_auth = os.getenv("REQUIRE_API_KEY", "false").lower() == "true" or os.getenv("NODE_ENV") == "production"
    if require_auth:
        if not x_api_key or x_api_key != API_KEY:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid or missing X-API-Key header.")

    # 2. Rate Limiting (15 calls / minute / IP)
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    
    # Filter older timestamps
    ip_request_timestamps[client_ip] = [t for t in ip_request_timestamps[client_ip] if now - t < 60]
    
    if len(ip_request_timestamps[client_ip]) >= 15:
        raise HTTPException(
            status_code=429, 
            detail="Too Many Requests: Rate limit exceeded (15 queries per minute per client IP)."
        )
    ip_request_timestamps[client_ip].append(now)

# --- REST Endpoints ---

@app.get("/api/health")
def health_check():
    """Verify backend and SSH database connector health."""
    success, _, _, err = execute_remote_sql("SELECT count(*) FROM blocket_listings;")
    if success:
        return {"status": "healthy", "database": "connected", "ssh": "active"}
    else:
        return {"status": "degraded", "database": "disconnected", "error": err}

@app.post("/api/query", dependencies=[Depends(enforce_security_policies)])
def run_natural_language_query(payload: QueryRequest):
    """Translates a natural language search query into SQL, runs it, and formats the charts data."""
    # 1. Translate via Gemini
    translation = translate_query_to_sql(payload.user_query, payload.model_choice)
    
    # 2. Programmatic SQL Security Sanitization
    if not is_safe_read_only_sql(translation.sql_query):
        raise HTTPException(
            status_code=403,
            detail=f"Security Policy Violation: The compiled SQL statement is classified as unsafe or contains forbidden write operations. SQL: {translation.sql_query}"
        )
        
    # 3. Run remote SQL
    success, cols, rows, err = execute_remote_sql(translation.sql_query)
    
    if not success:
        # If the translated SQL was invalid, raise a clean HTTP warning
        raise HTTPException(
            status_code=400, 
            detail=f"Translated SQL failed to execute on remote database. SQL: {translation.sql_query}. Error: {err}"
        )
        
    return {
        "success": True,
        "sql_query": translation.sql_query,
        "explanation": translation.explanation,
        "columns": cols,
        "rows": rows,
        "visualization": {
            "recommended_chart": translation.recommended_chart,
            "x_axis_key": translation.x_axis_key,
            "y_axis_key": translation.y_axis_key,
            "series_key": translation.series_key
        }
    }

@app.post("/api/appraise", dependencies=[Depends(enforce_security_policies)])
def dynamic_cohort_appraisal(payload: AppraisalRequest):
    """Calculates fair market value dynamically using the hierarchical cohort medians."""
    brand_upper = payload.brand.upper()
    v_type_cap = payload.vehicle_type.capitalize()
    
    y_bucket = get_year_bucket(payload.year)
    m_bucket = get_mileage_bucket(payload.mileage)
    cc_bucket = get_cc_bucket(payload.cc)
    
    # Create the hierarchical keys (from specific to broad fallback)
    k1 = f"{brand_upper} | {v_type_cap} | {y_bucket} | {cc_bucket} | {m_bucket}"
    k2 = f"{brand_upper} | {v_type_cap} | {y_bucket} | {cc_bucket}"
    k3 = f"{brand_upper} | {v_type_cap} | {y_bucket}"
    k4 = f"{brand_upper} | {v_type_cap}"
    k5 = f"{v_type_cap}"
    
    # Sequence of fallbacks
    keys_hierarchy = [
        (k1, "Level 1 (Specific Specification)"),
        (k2, "Level 2 (Model Vintage & Engine)"),
        (k3, "Level 3 (Brand & Vintage)"),
        (k4, "Level 4 (Brand & Style)"),
        (k5, "Level 5 (Style Class Fallback)")
    ]
    
    # Search DB for cohort
    for key, lvl_desc in keys_hierarchy:
        query = f"SELECT cohort_size, cohort_median_price, cohort_median_duration_hours FROM market_clusters_analysis WHERE cohort_key = '{key}' LIMIT 1;"
        success, _, rows, _ = execute_remote_sql(query)
        
        if success and rows:
            cohort_data = rows[0]
            # Convert median duration to days
            days_to_sell = round(float(cohort_data["cohort_median_duration_hours"]) / 24.0, 1)
            
            # Fetch cohort listings for visualization
            sql_conds = cohort_key_to_sql_conditions(key)
            listings_query = f"SELECT title, brand, model, price_sek, mileage_km, model_year, location, url, is_active FROM listings_analytics WHERE {sql_conds} ORDER BY published_at DESC LIMIT 150;"
            list_success, _, listings_rows, _ = execute_remote_sql(listings_query)
            
            return {
                "success": True,
                "cohort_key": key,
                "cohort_level": lvl_desc,
                "cohort_size": cohort_data["cohort_size"],
                "fair_market_value": cohort_data["cohort_median_price"],
                "average_days_to_sell": days_to_sell,
                "listings": listings_rows if list_success else []
            }
            
    # Absolute fallback if somehow nothing matches
    return {
        "success": False,
        "error": "No matching statistical cohort found for this vehicle profile."
    }

@app.get("/api/deals", dependencies=[Depends(enforce_security_policies)])
def fetch_top_market_deals():
    """Fetches high-probability deals and stale, highly negotiable postings."""
    # 1. Underpriced deals
    deals_query = """
        SELECT 
            brand, model, model_year, listed_price, fair_market_value, 
            round(discount_pct) as discount_pct, round(days_on_market, 1) as days_on_market, 
            location, url
        FROM listings_deal_finder 
        WHERE market_segment_tag = '🔥 Underpriced Deal' 
          AND listed_price > 20000 
          AND discount_pct BETWEEN -45 AND -15
        ORDER BY discount_pct ASC 
        LIMIT 10;
    """
    
    # 2. Negotiable listings
    neg_query = """
        SELECT 
            brand, model, model_year, listed_price, fair_market_value, 
            round(discount_pct) as discount_pct, round(days_on_market, 1) as days_on_market, 
            location, negotiability_score, url
        FROM listings_deal_finder 
        WHERE market_segment_tag LIKE '%Negotiable%' 
          AND listed_price > 20000 
        ORDER BY negotiability_score DESC 
        LIMIT 10;
    """
    
    success_deals, _, deals_rows, err_deals = execute_remote_sql(deals_query)
    success_neg, _, neg_rows, err_neg = execute_remote_sql(neg_query)
    
    if not (success_deals and success_neg):
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch deals. Errors: Deals: {err_deals} | Negotiable: {err_neg}"
        )
        
    return {
        "success": True,
        "deals": deals_rows,
        "negotiation_targets": neg_rows
    }

@app.get("/api/geo-insights", dependencies=[Depends(enforce_security_policies)])
def fetch_geo_insights():
    """Fetches location-tier analysis and municipal listing distributions."""
    tier_query = """
        SELECT 
            location_tier, 
            count(*) as volume, 
            round(avg(listing_duration_hours)/24.0, 2) as avg_days_on_market, 
            round(avg(price_deviation_pct), 1) as avg_price_dev 
        FROM market_clusters_analysis 
        GROUP BY location_tier
        ORDER BY avg_price_dev DESC;
    """
    
    city_query = """
        SELECT 
            location as city, 
            count(*) as volume, 
            round(avg(price_deviation_pct), 1) as avg_price_dev
        FROM listings_deal_finder 
        GROUP BY location 
        ORDER BY volume DESC 
        LIMIT 15;
    """
    
    success_tier, _, tier_rows, err_tier = execute_remote_sql(tier_query)
    success_city, _, city_rows, err_city = execute_remote_sql(city_query)
    
    if not (success_tier and success_city):
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch geo insights. Errors: Tiers: {err_tier} | Cities: {err_city}"
        )
        
    return {
        "success": True,
        "tiers": tier_rows,
        "cities": city_rows
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
