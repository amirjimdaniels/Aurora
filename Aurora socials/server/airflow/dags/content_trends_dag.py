"""
Content Trends DAG
Runs at 4 AM daily. Aggregates hashtag popularity and engagement scores
into the HashtagTrend table.
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
    "content_trends",
    default_args=default_args,
    description="Aggregate daily hashtag trends and engagement scores",
    schedule_interval="0 4 * * *",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["analytics", "content"],
)


def compute_hashtag_trends(**context):
    """Compute hashtag post counts and engagement for yesterday."""
    target_date = context["execution_date"].date()
    day_start = datetime.combine(target_date, datetime.min.time())
    day_end = day_start + timedelta(days=1)

    print(f"Computing hashtag trends for {target_date}")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Get hashtag usage and engagement for the day
            cur.execute(
                """
                SELECT
                    ph."hashtagId",
                    COUNT(DISTINCT ph."postId") as post_count,
                    COALESCE(SUM(engagement.total), 0) as engagement_score
                FROM "PostHashtag" ph
                JOIN "Post" p ON p.id = ph."postId"
                LEFT JOIN (
                    SELECT
                        p2.id as post_id,
                        (
                            (SELECT COUNT(*) FROM "Like" l WHERE l."postId" = p2.id) +
                            (SELECT COUNT(*) FROM "Comment" c WHERE c."postId" = p2.id) +
                            (SELECT COUNT(*) FROM "Reaction" r WHERE r."postId" = p2.id)
                        ) as total
                    FROM "Post" p2
                    WHERE p2."createdAt" >= %s AND p2."createdAt" < %s
                ) engagement ON engagement.post_id = ph."postId"
                WHERE p."createdAt" >= %s AND p."createdAt" < %s
                GROUP BY ph."hashtagId"
                """,
                (day_start, day_end, day_start, day_end),
            )

            rows = cur.fetchall()
            print(f"Found {len(rows)} hashtags with activity")

            for hashtag_id, post_count, engagement_score in rows:
                cur.execute(
                    """
                    INSERT INTO "HashtagTrend" ("date", "hashtagId", "postCount",
                        "engagementScore", "createdAt")
                    VALUES (%s, %s, %s, %s, NOW())
                    ON CONFLICT ("date", "hashtagId") DO UPDATE SET
                        "postCount" = EXCLUDED."postCount",
                        "engagementScore" = EXCLUDED."engagementScore"
                    """,
                    (target_date, hashtag_id, post_count, float(engagement_score)),
                )

            conn.commit()
            print(f"Updated trends for {len(rows)} hashtags")
    finally:
        conn.close()


trends_task = PythonOperator(
    task_id="compute_hashtag_trends",
    python_callable=compute_hashtag_trends,
    dag=dag,
)
