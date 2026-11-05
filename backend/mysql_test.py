from database import get_db_connection


if __name__ == "__main__":
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT DATABASE()")
        row = cursor.fetchone()
        print("Database connection successful.")
        print("Database:", row[0] if row else "unknown")
        cursor.close()
    except Exception as exc:
        print("Database connection failed:", type(exc).__name__)
        raise
    finally:
        if connection is not None:
            connection.close()
