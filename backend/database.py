#!/usr/bin/env python3
"""
Blocket Analytics Web Backend - Database Connectivity Engine
Executes SQL queries directly on the remote DuckDB database over Tailscale SSH in real-time.
"""

import subprocess
import json
import os
from typing import List, Dict, Any, Tuple

# Path to the primary scraped database on the remote server
REMOTE_DB_PATH = "/home/101010_0001/blocket-webscraper/data/scraped_listings.duckdb"

def execute_remote_sql(sql_query: str) -> Tuple[bool, List[str], List[Dict[str, Any]], str]:
    """
    Executes an SQL query against the remote DuckDB database over Tailscale SSH.
    Returns: (success_boolean, columns_list, rows_list_of_dicts, error_message_string)
    """
    print(f"📡 [Database Engine] Dispatching remote SQL: {sql_query.strip()}")
    
    # Python code executed on the remote host to read DuckDB safely and output clean JSON
    remote_python_code = f"""
import duckdb
import json
import shutil
import os
import sys

temp_db = '/tmp/scraped_listings_web_query.duckdb'
db_source = '{REMOTE_DB_PATH}'

if not os.path.exists(db_source):
    print(json.dumps({{"error": "Database source file not found on remote node."}}))
    sys.exit(0)

try:
    # Copy file to temp space to prevent any read-write locks with the active scraper daemon
    shutil.copyfile(db_source, temp_db)
    conn = duckdb.connect(temp_db, read_only=True)
    
    res = conn.execute(\"\"\"{sql_query}\"\"\").fetchall()
    
    # Get column names
    cols = [desc[0] for desc in conn.description]
    
    # Zip column names and rows into lists of dicts
    data = [dict(zip(cols, row)) for row in res]
    
    print(json.dumps({{"success": True, "columns": cols, "rows": data}}, default=str))
except Exception as e:
    print(json.dumps({{"error": str(e)}}))
finally:
    if os.path.exists(temp_db):
        try:
            os.remove(temp_db)
        except:
            pass
"""

    ssh_cmd = [
        "ssh", "-o", "StrictHostKeyChecking=no", "101010_remote",
        "source ~/blocket-webscraper/venv/bin/activate && python3"
    ]
    
    try:
        result = subprocess.run(ssh_cmd, input=remote_python_code, capture_output=True, text=True, timeout=12)
        if result.returncode != 0:
            err_msg = result.stderr.strip() or f"SSH returned exit code {result.returncode}"
            return False, [], [], err_msg
            
        stdout_clean = result.stdout.strip()
        if not stdout_clean:
            return False, [], [], "Remote execution returned empty output."
            
        # Parse output JSON payload
        res_data = json.loads(stdout_clean)
        if "error" in res_data:
            return False, [], [], res_data["error"]
            
        return True, res_data["columns"], res_data["rows"], ""
    except subprocess.TimeoutExpired:
        return False, [], [], "Query timeout: The remote server took too long to respond."
    except Exception as e:
        return False, [], [], f"Internal connector error: {str(e)}"

if __name__ == "__main__":
    # Rapid local test verification
    success, cols, rows, err = execute_remote_sql("SELECT count(*) FROM blocket_listings;")
    print(f"Success: {success} | Columns: {cols} | Err: {err}")
    if rows:
        print(f"Sample row: {rows[0]}")
