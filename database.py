import sqlite3
from contextlib import contextmanager

from config import DB_PATH


@contextmanager
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    with get_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS agents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                photo_path TEXT,
                logo_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                beds INTEGER,
                baths INTEGER,
                sqft INTEGER,
                listing_price REAL,
                agent_id INTEGER REFERENCES agents(id),
                status TEXT DEFAULT 'uploading',
                intro_template TEXT DEFAULT 'A',
                outro_template TEXT DEFAULT '1',
                animation_style TEXT DEFAULT 'fade_in',
                music_track TEXT,
                music_volume REAL DEFAULT 0.5,
                photo_duration REAL DEFAULT 4.0,
                zoom_intensity REAL DEFAULT 1.2,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                file_path TEXT NOT NULL,
                room_type TEXT,
                confidence REAL,
                sequence_order INTEGER,
                zoom_direction TEXT DEFAULT 'in',
                is_visible INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
