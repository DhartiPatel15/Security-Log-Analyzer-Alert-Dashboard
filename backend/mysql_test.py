import mysql.connector

print("Starting direct MySQL test...")

try:
    db = mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="12345",
        connection_timeout=5,
        use_pure=True
    )

    print("MYSQL CONNECTION SUCCESSFUL!")

    db.close()
    print("MYSQL CONNECTION CLOSED!")

except Exception as e:
    print("MYSQL CONNECTION FAILED!")
    print("ERROR:", repr(e))