import sqlite3
import json
import time
import uuid

def generate_id():
    return uuid.uuid4().hex[:16]

def main():
    n = int(input("Number of cards to generate: "))

    # Generate a single session ID for all cards
    session_id = f"session_{generate_id()}"

    print(f"Generating {n} cards...")
    print(f"Session ID: {session_id}")

    # Create SQLite database
    conn = sqlite3.connect("cards.sqlite")
    cur = conn.cursor()

    # Create table exactly matching your app's format
    cur.execute("""
        CREATE TABLE IF NOT EXISTS cards (
            id TEXT PRIMARY KEY,
            front TEXT,
            back TEXT,
            extra TEXT,
            media TEXT,
            allowReversed TEXT,
            createdAt TEXT,
            lastReviewedAt TEXT,
            sessions TEXT,
            tags TEXT,
            frequency TEXT,
            bucket TEXT,
            height TEXT
        )
    """)

    now = int(time.time() * 1000)

    for i in range(1, n + 1):
        card_id = generate_id()

        front = f"front{i}"
        back = f"back{i}"
        extra = f"extra{i}"

        sessions_value = json.dumps([session_id])
        tags_value = "[]"

        cur.execute("""
            INSERT INTO cards
            (id, front, back, extra, media, allowReversed, createdAt, lastReviewedAt,
             sessions, tags, frequency, bucket, height)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            card_id,
            front,
            back,
            extra,
            "[]",            # media
            "0",             # allowReversed
            str(now),
            None,            # lastReviewedAt
            sessions_value,
            tags_value,
            "normal",
            "0",             # bucket
            "141"
        ))

    conn.commit()
    conn.close()

    print("\n✔ Database created: cards.sqlite")
    print(f"✔ Session used: {session_id}")

if __name__ == "__main__":
    main()
