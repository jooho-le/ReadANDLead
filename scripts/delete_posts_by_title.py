#!/usr/bin/env python3
import os
import sqlite3

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'server', 'app', 'db.sqlite3'))

def main():
    titles = {"Test", "test2"}
    if not os.path.exists(DB_PATH):
        print(f"DB not found: {DB_PATH}")
        return 1
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.execute("SELECT id, title FROM neighbor_posts WHERE title IN (%s)" % ",".join(["?"]*len(titles)), tuple(titles))
        rows = cur.fetchall()
        if not rows:
            print("No matching posts found.")
            return 0
        ids = [r["id"] for r in rows]
        conn.execute("DELETE FROM neighbor_posts WHERE id IN (%s)" % ",".join(["?"]*len(ids)), tuple(ids))
        conn.commit()
        print(f"Deleted {len(ids)} posts: {[r['title'] for r in rows]}")
        return 0
    finally:
        conn.close()

if __name__ == '__main__':
    raise SystemExit(main())

