from flask import Flask, jsonify, send_from_directory, request
from werkzeug.security import check_password_hash
from flask_cors import CORS
from database import get_db_connection
from pathlib import Path


# =========================================================
# PATH CONFIGURATION
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"


# =========================================================
# FLASK APP
# =========================================================

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*"
        }
    }
)


# =========================================================
# HOME / FRONTEND
# =========================================================

@app.route("/")
def home():

    return send_from_directory(
        FRONTEND_DIR,
        "index.html"
    )


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route("/api/health")
def health():

    return jsonify({
        "status": "success",
        "message": "Security Log Analyzer & Alert Dashboard backend is running",
        "server": "127.0.0.1:5000"
    })


# =========================================================
# DATABASE TEST
# =========================================================

@app.route("/api/db-test")
def db_test():

    db = None
    cursor = None

    try:

        db = get_db_connection()

        cursor = db.cursor()

        cursor.execute(
            "SELECT DATABASE()"
        )

        result = cursor.fetchone()

        return jsonify({
            "status": "success",
            "message": "Database connected successfully",
            "database": result[0] if result else None
        })

    except Exception as e:

        print("DATABASE TEST ERROR:", repr(e))

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()


# =========================================================
# GET SECURITY LOGS
# =========================================================

@app.route("/api/logs")
def get_logs():

    db = None
    cursor = None

    try:

        db = get_db_connection()

        cursor = db.cursor(
            dictionary=True
        )

        cursor.execute("""
            SELECT
                id,
                log_time,
                username,
                ip_address,
                event_type,
                status,
                message,
                severity
            FROM security_logs
            ORDER BY log_time DESC
        """)

        logs = cursor.fetchall()

        return jsonify({
            "status": "success",
            "count": len(logs),
            "logs": logs
        })

    except Exception as e:

        print("LOGS API ERROR:", repr(e))

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()


# =========================================================
# GET SECURITY ALERTS
# =========================================================

@app.route("/api/alerts")
def get_alerts():

    db = None
    cursor = None

    try:

        db = get_db_connection()

        cursor = db.cursor(
            dictionary=True
        )

        cursor.execute("""
            SELECT
                id,
                log_id,
                alert_type,
                description,
                severity,
                status,
                source_ip,
                detected_at
            FROM alerts
            ORDER BY detected_at DESC
        """)

        alerts = cursor.fetchall()

        return jsonify({
            "status": "success",
            "count": len(alerts),
            "alerts": alerts
        })

    except Exception as e:

        print("ALERTS API ERROR:", repr(e))

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()


# =========================================================
# DASHBOARD STATISTICS
# =========================================================

@app.route("/api/dashboard")
def dashboard():

    db = None
    cursor = None

    try:

        db = get_db_connection()

        cursor = db.cursor(
            dictionary=True
        )


        # ---------------------------------------------
        # TOTAL LOGS
        # ---------------------------------------------

        cursor.execute("""
            SELECT COUNT(*) AS total_logs
            FROM security_logs
        """)

        total_logs = cursor.fetchone()[
            "total_logs"
        ]


        # ---------------------------------------------
        # FAILED LOGINS
        # ---------------------------------------------

        cursor.execute("""
            SELECT COUNT(*) AS failed_logins
            FROM security_logs
            WHERE event_type = 'LOGIN_FAILED'
        """)

        failed_logins = cursor.fetchone()[
            "failed_logins"
        ]


        # ---------------------------------------------
        # ACCESS DENIED
        # ---------------------------------------------

        cursor.execute("""
            SELECT COUNT(*) AS access_denied
            FROM security_logs
            WHERE event_type = 'ACCESS_DENIED'
        """)

        access_denied = cursor.fetchone()[
            "access_denied"
        ]


        # ---------------------------------------------
        # TOTAL ALERTS
        # ---------------------------------------------

        cursor.execute("""
            SELECT COUNT(*) AS total_alerts
            FROM alerts
        """)

        total_alerts = cursor.fetchone()[
            "total_alerts"
        ]


        # ---------------------------------------------
        # HIGH + CRITICAL ALERTS
        # ---------------------------------------------

        cursor.execute("""
            SELECT COUNT(*) AS high_alerts
            FROM alerts
            WHERE severity IN ('High', 'Critical')
        """)

        high_alerts = cursor.fetchone()[
            "high_alerts"
        ]


        # ---------------------------------------------
        # RESPONSE
        # ---------------------------------------------

        return jsonify({

            "status": "success",

            "dashboard": {

                "total_logs": total_logs,

                "failed_logins": failed_logins,

                "access_denied": access_denied,

                "total_alerts": total_alerts,

                "high_alerts": high_alerts

            }

        })


    except Exception as e:

        print(
            "DASHBOARD API ERROR:",
            repr(e)
        )

        return jsonify({

            "status": "error",

            "message": str(e)

        }), 500


    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()


# =========================================================
# START SERVER
# =========================================================
@app.route("/api/login", methods=["POST"])
def login():

    try:
        data = request.get_json()

        username = data.get("username", "").strip()
        password = data.get("password", "")

        if not username or not password:
            return jsonify({
                "status": "error",
                "message": "Username and password are required"
            }), 400

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, username, password, role
            FROM users
            WHERE username = %s
        """, (username,))

        user = cursor.fetchone()

        cursor.close()
        db.close()

        if user and check_password_hash(user["password"], password):

            return jsonify({
                "status": "success",
                "message": "Login successful",
                "user": {
                    "id": user["id"],
                    "username": user["username"],
                    "role": user["role"]
                }
            })

        return jsonify({
            "status": "error",
            "message": "Invalid username or password"
        }), 401

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
if __name__ == "__main__":

    print()
    print("=" * 55)
    print("   SECURITY LOG ANALYZER & ALERT DASHBOARD")
    print("=" * 55)
    print()
    print("Flask Backend Starting...")
    print()
    print("Frontend:")
    print("http://127.0.0.1:5000/")
    print()
    print("Health Check:")
    print("http://127.0.0.1:5000/api/health")
    print()
    print("Database Test:")
    print("http://127.0.0.1:5000/api/db-test")
    print()
    print("Dashboard API:")
    print("http://127.0.0.1:5000/api/dashboard")
    print()
    print("=" * 55)
    print()

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False,
        use_reloader=False
    )