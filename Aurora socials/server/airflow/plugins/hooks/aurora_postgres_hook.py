"""
Shared PostgreSQL connection helper for Aurora Social Airflow DAGs.
Reads DATABASE_URL from environment or uses Airflow connection 'aurora_postgres'.
"""
import os
import psycopg2
from urllib.parse import urlparse


def get_connection():
    """Get a psycopg2 connection to the Aurora Social PostgreSQL database."""
    database_url = os.environ.get("DATABASE_URL")

    if database_url:
        parsed = urlparse(database_url)
        return psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            dbname=parsed.path.lstrip("/").split("?")[0],
            user=parsed.username,
            password=parsed.password,
        )

    # Fallback: individual env vars (for Docker Compose setup)
    return psycopg2.connect(
        host=os.environ.get("POSTGRES_HOST", "host.docker.internal"),
        port=int(os.environ.get("POSTGRES_PORT", "5433")),
        dbname=os.environ.get("POSTGRES_DB", "aurora_social"),
        user=os.environ.get("POSTGRES_USER", "postgres"),
        password=os.environ.get("POSTGRES_PASSWORD", ""),
    )


def execute_query(query, params=None, fetch=True):
    """Execute a query and optionally return results."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(query, params)
            if fetch:
                columns = [desc[0] for desc in cur.description]
                rows = cur.fetchall()
                return [dict(zip(columns, row)) for row in rows]
            conn.commit()
            return cur.rowcount
    finally:
        conn.close()


def execute_upsert(query, params=None):
    """Execute an upsert/insert query and commit."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(query, params)
            conn.commit()
            return cur.rowcount
    finally:
        conn.close()
