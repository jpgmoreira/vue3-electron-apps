import sqlite3
import json
import time
import uuid
import os


def generate_session_id():
    return "session_" + uuid.uuid4().hex


def create_cards(count, db_path="cards.sqlite"):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Schema you provided
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      front TEXT NOT NULL,
      back TEXT NOT NULL DEFAULT '',
      extra TEXT NOT NULL DEFAULT '',
      media TEXT NOT NULL,
      allowReversed BOOLEAN NOT NULL DEFAULT FALSE,
      createdAt INTEGER NOT NULL,
      lastReviewedAt INTEGER NOT NULL,
      sessions TEXT NOT NULL,
      tags TEXT NOT NULL,
      frequency TEXT NOT NULL,
      bucket BOOLEAN NOT NULL DEFAULT FALSE,
      height INTEGER NOT NULL
    );
    """)

    session_id = generate_session_id()
    now = int(time.time() * 1000)

    for i in range(1, count + 1):
        card_id = uuid.uuid4().hex
        front = f"front{i}"
        back = f"back{i}"
        extra = f"extra{i}"

        cursor.execute(
            """
            INSERT INTO cards (
                id, front, back, extra, media, allowReversed, createdAt,
                lastReviewedAt, sessions, tags, frequency, bucket, height
            )
            VALUES (?, ?, ?, ?, '[]', 0, ?, ?, ?, '[]', 'normal', 0, 141)
        """,
            (card_id, front, back, extra, now, now, json.dumps([session_id])),
        )

    conn.commit()
    conn.close()

    return db_path, session_id


if __name__ == "__main__":
    n = int(input("How many cards to generate? "))
    db_path, session_id = create_cards(n)
    print(f"Database created: {os.path.abspath(db_path)}")
    print("Session ID:", session_id)
