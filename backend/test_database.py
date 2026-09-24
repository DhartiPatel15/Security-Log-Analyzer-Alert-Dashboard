from database import get_db_connection

print("Testing database connection...")

try:
    db = get_db_connection()
    print("DATABASE CONNECTED SUCCESSFULLY!")

    db.close()
    print("Database connection closed.")

except Exception as e:
    print("DATABASE CONNECTION FAILED!")
    print("Error:", repr(e))