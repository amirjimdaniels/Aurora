"""
Daily Engagement Aggregation DAG
Runs at 2 AM daily. Aggregates posts, likes, comments, reactions, active users,
and new users into the DailyEngagement table.
"""
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
import sys
import os

# Add plugins to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "plugins"))
from hooks.aurora_postgres_hook import get_connection, execute_query, execute_upsert

default_args = {
    "owner": "aurora",
    "depends_on_past": False,
    "email_on_failure": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
}

dag = DAG(
    "daily_engagement_aggregation",
    default_args=default_args,
    description="Aggregate daily engagement metrics into DailyEngagement table",
    schedule_interval="0 2 * * *",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["analytics", "engagement"],
)


def aggregate_daily_engagement(**context):
    """Aggregate engagement metrics for yesterday."""
    target_date = (context["execution_date"]).date()
    day_start = datetime.combine(target_date, datetime.min.time())
    day_end = day_start + timedelta(days=1)

    print(f"Aggregating engagement for {target_date}")

    # Count posts
    posts = execute_query(
        'SELECT COUNT(*) as cnt FROM "Post" WHERE "createdAt" >= %s AND "createdAt" < %s',
        (day_start, day_end),
    )
    total_posts = posts[0]["cnt"]

    # Count likes
    likes = execute_query(
        'SELECT COUNT(*) as cnt FROM "Like" WHERE "createdAt" >= %s AND "createdAt" < %s',
        (day_start, day_end),
    )
    total_likes = likes[0]["cnt"]

    # Count comments
    comments = execute_query(
        'SELECT COUNT(*) as cnt FROM "Comment" WHERE "createdAt" >= %s AND "createdAt" < %s',
        (day_start, day_end),
    )
    total_comments = comments[0]["cnt"]

    # Count reactions
    reactions = execute_query(
        'SELECT COUNT(*) as cnt FROM "Reaction" WHERE "createdAt" >= %s AND "createdAt" < %s',
        (day_start, day_end),
    )
    total_reactions = reactions[0]["cnt"]

    # Active users (posted or commented)
    active = execute_query(
        """
        SELECT COUNT(DISTINCT uid) as cnt FROM (
            SELECT "authorId" as uid FROM "Post" WHERE "createdAt" >= %s AND "createdAt" < %s
            UNION
            SELECT "authorId" as uid FROM "Comment" WHERE "createdAt" >= %s AND "createdAt" < %s
        ) sub
        """,
        (day_start, day_end, day_start, day_end),
    )
    active_users = active[0]["cnt"]

    # New users
    new_users_result = execute_query(
        'SELECT COUNT(*) as cnt FROM "User" WHERE "createdAt" >= %s AND "createdAt" < %s',
        (day_start, day_end),
    )
    new_users = new_users_result[0]["cnt"]

    # Upsert into DailyEngagement
    execute_upsert(
        """
        INSERT INTO "DailyEngagement" ("date", "totalPosts", "totalLikes", "totalComments",
            "totalReactions", "activeUsers", "newUsers", "createdAt", "updatedAt")
        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        ON CONFLICT ("date") DO UPDATE SET
            "totalPosts" = EXCLUDED."totalPosts",
            "totalLikes" = EXCLUDED."totalLikes",
            "totalComments" = EXCLUDED."totalComments",
            "totalReactions" = EXCLUDED."totalReactions",
            "activeUsers" = EXCLUDED."activeUsers",
            "newUsers" = EXCLUDED."newUsers",
            "updatedAt" = NOW()
        """,
        (target_date, total_posts, total_likes, total_comments, total_reactions, active_users, new_users),
    )

    print(
        f"Done: {total_posts} posts, {total_likes} likes, {total_comments} comments, "
        f"{total_reactions} reactions, {active_users} active users, {new_users} new users"
    )


aggregate_task = PythonOperator(
    task_id="aggregate_daily_engagement",
    python_callable=aggregate_daily_engagement,
    dag=dag,
)
