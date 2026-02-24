"""
User Activity Metrics DAG
Runs at 3 AM daily. Computes per-user activity metrics (posts, likes, comments,
reactions given) and stores in UserActivityMetric table.
"""
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "plugins"))
from hooks.aurora_postgres_hook import get_connection

default_args = {
    "owner": "aurora",
    "depends_on_past": False,
    "email_on_failure": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
}

dag = DAG(
    "user_activity_metrics",
    default_args=default_args,
    description="Compute per-user daily activity metrics",
    schedule_interval="0 3 * * *",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["analytics", "users"],
)


def compute_user_activity(**context):
    """Compute activity metrics for each user for yesterday."""
    target_date = context["execution_date"].date()
    day_start = datetime.combine(target_date, datetime.min.time())
    day_end = day_start + timedelta(days=1)

    print(f"Computing user activity for {target_date}")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Get all users with any activity on target date
            cur.execute(
                """
                SELECT DISTINCT uid FROM (
                    SELECT "authorId" as uid FROM "Post" WHERE "createdAt" >= %s AND "createdAt" < %s
                    UNION
                    SELECT l."userId" as uid FROM "Like" l JOIN "Post" p ON p.id = l."postId" WHERE p."createdAt" >= %s AND p."createdAt" < %s
                    UNION
                    SELECT "authorId" as uid FROM "Comment" WHERE "createdAt" >= %s AND "createdAt" < %s
                    UNION
                    SELECT "userId" as uid FROM "Reaction" WHERE "createdAt" >= %s AND "createdAt" < %s
                ) active_users
                """,
                (day_start, day_end) * 4,
            )
            active_user_ids = [row[0] for row in cur.fetchall()]

            print(f"Found {len(active_user_ids)} active users")

            for user_id in active_user_ids:
                # Count each metric
                cur.execute(
                    'SELECT COUNT(*) FROM "Post" WHERE "authorId" = %s AND "createdAt" >= %s AND "createdAt" < %s',
                    (user_id, day_start, day_end),
                )
                posts = cur.fetchone()[0]

                cur.execute(
                    'SELECT COUNT(*) FROM "Like" l JOIN "Post" p ON p.id = l."postId" WHERE l."userId" = %s AND p."createdAt" >= %s AND p."createdAt" < %s',
                    (user_id, day_start, day_end),
                )
                likes = cur.fetchone()[0]

                cur.execute(
                    'SELECT COUNT(*) FROM "Comment" WHERE "authorId" = %s AND "createdAt" >= %s AND "createdAt" < %s',
                    (user_id, day_start, day_end),
                )
                comments = cur.fetchone()[0]

                cur.execute(
                    'SELECT COUNT(*) FROM "Reaction" WHERE "userId" = %s AND "createdAt" >= %s AND "createdAt" < %s',
                    (user_id, day_start, day_end),
                )
                reactions = cur.fetchone()[0]

                # Upsert
                cur.execute(
                    """
                    INSERT INTO "UserActivityMetric" ("date", "userId", "postsCreated", "likesGiven",
                        "commentsGiven", "reactionsGiven", "createdAt")
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
                    ON CONFLICT ("date", "userId") DO UPDATE SET
                        "postsCreated" = EXCLUDED."postsCreated",
                        "likesGiven" = EXCLUDED."likesGiven",
                        "commentsGiven" = EXCLUDED."commentsGiven",
                        "reactionsGiven" = EXCLUDED."reactionsGiven"
                    """,
                    (target_date, user_id, posts, likes, comments, reactions),
                )

            conn.commit()
            print(f"Updated metrics for {len(active_user_ids)} users")
    finally:
        conn.close()


activity_task = PythonOperator(
    task_id="compute_user_activity",
    python_callable=compute_user_activity,
    dag=dag,
)
