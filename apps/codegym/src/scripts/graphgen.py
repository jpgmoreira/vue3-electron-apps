"""
Generate a graph.sqlite database to test the LineChart component.
"""

import random
import sqlite3
from datetime import date, timedelta

DB_FILE = "graph.sqlite"


def create_table(conn: sqlite3.Connection):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS graph (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date INTEGER UNIQUE NOT NULL,
            cf INTEGER NOT NULL,
            neps INTEGER NOT NULL,
            leetcode INTEGER NOT NULL,
            timus INTEGER NOT NULL,
            uva INTEGER NOT NULL,
            kattis INTEGER NOT NULL,
            contests INTEGER NOT NULL
        );
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_graph_date ON graph (date);")
    conn.commit()


def insert_data(conn: sqlite3.Connection, num_days: int):
    today = date.today()
    cursor = conn.cursor()

    for i in range(num_days):
        d = today - timedelta(days=i)
        date_int = int(d.strftime("%Y%m%d"))
        values = (
            date_int,
            random.randint(0, 5),  # cf
            random.randint(0, 3),  # neps
            random.randint(0, 3),  # leetcode
            random.randint(0, 2),  # timus
            random.randint(0, 2),  # uva
            random.randint(0, 2),  # kattis
            random.randint(0, 1),  # contests
        )
        cursor.execute(
            """
            INSERT INTO graph (date, cf, neps, leetcode, timus, uva, kattis, contests)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
                cf = excluded.cf,
                neps = excluded.neps,
                leetcode = excluded.leetcode,
                timus = excluded.timus,
                uva = excluded.uva,
                kattis = excluded.kattis,
                contests = excluded.contests;
        """,
            values,
        )

    conn.commit()


def generate_data(num_days: int, db_file: str = DB_FILE):
    conn = sqlite3.connect(db_file)
    create_table(conn)
    insert_data(conn, num_days)
    conn.close()
    print(f"📈 Database '{db_file}' generated with {num_days} days of data.")


if __name__ == "__main__":
    N = int(input("How many days? "))
    generate_data(N)
