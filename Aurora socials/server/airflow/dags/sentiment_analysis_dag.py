"""
Sentiment Analysis DAG
Runs at 5 AM daily. Sends unanalyzed posts to an LLM for sentiment analysis
and stores results in the PostSentiment table.
"""
from datetime import datetime, timedelta
import json
import os
from airflow import DAG
from airflow.operators.python import PythonOperator
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "plugins"))
from hooks.aurora_postgres_hook import get_connection

default_args = {
    "owner": "aurora",
    "depends_on_past": False,
    "email_on_failure": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=10),
}

dag = DAG(
    "sentiment_analysis",
    default_args=default_args,
    description="LLM-powered sentiment analysis on unanalyzed posts",
    schedule_interval="0 5 * * *",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["analytics", "sentiment", "llm"],
)

BATCH_SIZE = 20
CHUNK_SIZE = 10


def call_openai_sentiment(posts_text):
    """Call OpenAI API for sentiment analysis."""
    import openai

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set")

    client = openai.OpenAI(api_key=api_key)
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

    response = client.chat.completions.create(
        model=model,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a sentiment analysis engine. Analyze the sentiment of social media posts. "
                    "For each post, return: sentiment (positive, negative, neutral, mixed), "
                    "score (-1.0 to 1.0), and confidence (0.0 to 1.0). Return valid JSON only."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Analyze sentiment for these posts:\n{posts_text}\n\n"
                    'Return JSON: { "results": [{ "index": 0, "sentiment": "positive|negative|neutral|mixed", '
                    '"score": 0.0, "confidence": 0.0 }, ...] }'
                ),
            },
        ],
    )

    return json.loads(response.choices[0].message.content)


def analyze_sentiment(**context):
    """Fetch unanalyzed posts and run sentiment analysis."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Find posts without sentiment
            cur.execute(
                """
                SELECT p.id, p.content
                FROM "Post" p
                LEFT JOIN "PostSentiment" ps ON ps."postId" = p.id
                WHERE ps.id IS NULL
                ORDER BY p."createdAt" DESC
                LIMIT %s
                """,
                (BATCH_SIZE,),
            )
            posts = cur.fetchall()

            if not posts:
                print("No unanalyzed posts found")
                return

            print(f"Analyzing {len(posts)} posts")
            total_analyzed = 0

            # Process in chunks
            for i in range(0, len(posts), CHUNK_SIZE):
                chunk = posts[i : i + CHUNK_SIZE]
                posts_text = "\n".join(
                    f'[{idx}] "{post[1]}"' for idx, post in enumerate(chunk)
                )

                try:
                    result = call_openai_sentiment(posts_text)
                    analyses = result.get("results", [])

                    for analysis in analyses:
                        idx = analysis.get("index", 0)
                        if idx >= len(chunk):
                            continue

                        post_id = chunk[idx][0]
                        cur.execute(
                            """
                            INSERT INTO "PostSentiment" ("postId", "sentiment", "score", "confidence", "analyzedAt")
                            VALUES (%s, %s, %s, %s, NOW())
                            ON CONFLICT ("postId") DO UPDATE SET
                                "sentiment" = EXCLUDED."sentiment",
                                "score" = EXCLUDED."score",
                                "confidence" = EXCLUDED."confidence",
                                "analyzedAt" = NOW()
                            """,
                            (
                                post_id,
                                analysis["sentiment"],
                                analysis["score"],
                                analysis["confidence"],
                            ),
                        )
                        total_analyzed += 1

                    conn.commit()
                except Exception as e:
                    print(f"Error analyzing chunk {i}: {e}")
                    conn.rollback()

            print(f"Successfully analyzed {total_analyzed} posts")
    finally:
        conn.close()


sentiment_task = PythonOperator(
    task_id="analyze_sentiment",
    python_callable=analyze_sentiment,
    dag=dag,
)
