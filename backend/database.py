"""Database adapter.

SQLite is the zero-configuration default so the project runs after extraction.
Set DB_DRIVER=mysql to use the existing MySQL/MariaDB configuration.
"""
import os
import re
import sqlite3
from pathlib import Path

from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

DB_DRIVER = os.getenv("DB_DRIVER", "sqlite").strip().lower()
SQLITE_PATH = Path(os.getenv("SQLITE_PATH", str(BASE_DIR / "security_dashboard.db")))


class SQLiteCursor:
    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query, params=None):
        query = query.replace("%s", "?")
        query = re.sub(r"\bNOW\(\)", "CURRENT_TIMESTAMP", query, flags=re.I)
        query = re.sub(
            r"CURRENT_TIMESTAMP\s*-\s*INTERVAL\s+(\d+)\s+MINUTE",
            lambda m: f"datetime('now', '-{m.group(1)} minutes')",
            query,
            flags=re.I,
        )
        query = query.replace("SELECT DATABASE()", "SELECT 'security_dashboard'")
        self._cursor.execute(query, params or ())
        return self

    def fetchone(self):
        row = self._cursor.fetchone()
        return dict(row) if row is not None else None

    def fetchall(self):
        return [dict(row) for row in self._cursor.fetchall()]

    @property
    def lastrowid(self):
        return self._cursor.lastrowid

    def close(self):
        self._cursor.close()


class SQLiteConnection:
    def __init__(self, connection):
        self._connection = connection

    def cursor(self, dictionary=False):
        self._connection.row_factory = sqlite3.Row
        return SQLiteCursor(self._connection.cursor())

    def commit(self):
        self._connection.commit()

    def rollback(self):
        self._connection.rollback()

    def close(self):
        self._connection.close()


def _initialize_sqlite():
    SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(SQLITE_PATH)
    connection.executescript("""
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'Security Analyst',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS security_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            log_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            username TEXT NOT NULL,
            ip_address TEXT NOT NULL,
            event_type TEXT NOT NULL,
            status TEXT NOT NULL,
            message TEXT NOT NULL,
            severity TEXT NOT NULL DEFAULT 'Low'
        );
        CREATE INDEX IF NOT EXISTS idx_logs_username_time
            ON security_logs(username, log_time);
        CREATE INDEX IF NOT EXISTS idx_logs_failed_ip
            ON security_logs(event_type, username, ip_address);
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            log_id INTEGER NOT NULL,
            alert_type TEXT NOT NULL,
            description TEXT NOT NULL,
            severity TEXT NOT NULL DEFAULT 'Medium',
            status TEXT NOT NULL DEFAULT 'Open',
            source_ip TEXT NOT NULL,
            detected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(log_id) REFERENCES security_logs(id) ON DELETE CASCADE
        );
    """)
    # Local demo account shown on the login page. Override with environment variables.
    demo_user = os.getenv("ADMIN_USERNAME", "admin")
    demo_password = os.getenv("ADMIN_PASSWORD", "admin123")
    exists = connection.execute(
        "SELECT id FROM users WHERE username = ?", (demo_user,)
    ).fetchone()
    if not exists and DB_DRIVER == "sqlite":
        connection.execute(
            "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            (demo_user, generate_password_hash(demo_password), "Administrator"),
        )
    connection.commit()
    connection.close()


if DB_DRIVER == "sqlite":
    _initialize_sqlite()


def get_db_connection():
    if DB_DRIVER == "mysql":
        import mysql.connector
        return mysql.connector.connect(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME", "security_dashboard"),
            connection_timeout=5,
            use_pure=True,
        )

    connection = sqlite3.connect(SQLITE_PATH, timeout=15)
    connection.execute("PRAGMA foreign_keys = ON")
    return SQLiteConnection(connection)
