"""
Snowflake Cloud Sync Executor using SnowSQL.
Reads credentials securely from .env and executes sql/snowflake_complete_setup.sql.
"""

import os
import subprocess
import sys
from pathlib import Path

def run_sync():
    env_file = Path(".env")
    if not env_file.exists():
        print("[ERROR] .env file not found.")
        sys.exit(1)

    # Parse .env
    env_vars = {}
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env_vars[k.strip()] = v.strip().strip('"').strip("'")

    account = env_vars.get("SNOWFLAKE_ACCOUNT")
    user = env_vars.get("SNOWFLAKE_USER")
    password = env_vars.get("SNOWFLAKE_PASSWORD")
    database = env_vars.get("SNOWFLAKE_DATABASE", "CAP12_WAREHOUSE")
    schema = env_vars.get("SNOWFLAKE_SCHEMA", "CLEAN")
    warehouse = env_vars.get("SNOWFLAKE_WAREHOUSE", "CAP12_WH")

    if not account or not user or not password:
        print("[ERROR] Missing required SNOWFLAKE_ACCOUNT, SNOWFLAKE_USER, or SNOWFLAKE_PASSWORD in .env.")
        sys.exit(1)

    sql_file = Path("sql/snowflake_complete_setup.sql")
    if not sql_file.exists():
        print(f"[ERROR] SQL file not found: {sql_file}")
        sys.exit(1)

    snowsql_exe = Path(r"C:\Program Files\Snowflake SnowSQL\snowsql.exe")
    if not snowsql_exe.exists():
        print(f"[ERROR] snowsql.exe not found at {snowsql_exe}")
        sys.exit(1)

    print(f"Connecting to Snowflake account: {account} as user: {user}...")
    print(f"Target Database: {database} | Schema: {schema} | Warehouse: {warehouse}")
    print(f"Executing: {sql_file}...")

    # Pass password securely via environment variable
    proc_env = os.environ.copy()
    proc_env["SNOWSQL_PWD"] = password
    proc_env["SNOWSQL_ACCOUNT"] = account
    proc_env["SNOWSQL_USER"] = user
    proc_env["SNOWSQL_DATABASE"] = database
    proc_env["SNOWSQL_SCHEMA"] = schema
    proc_env["SNOWSQL_WAREHOUSE"] = warehouse

    cmd = [
        str(snowsql_exe),
        "-a", account,
        "-u", user,
        "-d", database,
        "-s", schema,
        "-w", warehouse,
        "-f", str(sql_file),
        "-o", "friendly=false",
        "-o", "header=true"
    ]

    res = subprocess.run(cmd, env=proc_env, capture_output=True, text=True)
    
    print("\n--- STDOUT ---")
    print(res.stdout)
    if res.stderr:
        print("--- STDERR ---")
        print(res.stderr)

    if res.returncode == 0:
        print("\n✅ Successfully synced all tables and views to Snowflake!")
    else:
        print(f"\n[ERROR] SnowSQL exited with code {res.returncode}")
        sys.exit(res.returncode)

if __name__ == "__main__":
    run_sync()

