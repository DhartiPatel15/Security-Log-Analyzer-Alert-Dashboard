from flask import Flask, jsonify, send_from_directory, request
from werkzeug.security import check_password_hash, generate_password_hash
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
# HOME
# =========================================================

@app.route("/")
def home():
    return send_from_directory(
        FRONTEND_DIR,
        "index.html"
    )


@app.route("/<path:filename>")
def frontend_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)


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

        cursor.execute("SELECT DATABASE()")
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
# CREATE ACCESS DENIED SECURITY LOG
# =========================================================

@app.route("/api/access-denied", methods=["POST"])
def create_access_denied():

    db = None
    cursor = None

    try:
        data = request.get_json(silent=True) or {}

        username = data.get("username", "").strip()

        if not username:
            return jsonify({
                "status": "error",
                "message": "Username is required."
            }), 400

        ip_address = request.remote_addr or "127.0.0.1"

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            INSERT INTO security_logs
            (
                log_time,
                username,
                ip_address,
                event_type,
                status,
                message,
                severity
            )
            VALUES (
                NOW(),
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """, (
            username,
            ip_address,
            "ACCESS_DENIED",
            "Denied",
            "Unauthorized access attempt detected",
            "Medium"
        ))

        db.commit()

        return jsonify({
            "status": "success",
            "message": "Access denied event logged successfully."
        }), 201

    except Exception as e:

        print(
            "ACCESS DENIED API ERROR:",
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
# GET SECURITY LOGS
# =========================================================

@app.route("/api/logs")
def get_logs():

    db = None
    cursor = None

    try:
        username = request.args.get("username")

        if not username:
            return jsonify({
                "status": "error",
                "message": "Username is required."
            }), 400

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        # Automatically detect brute-force activity
        ensure_bruteforce_alerts(
            db,
            cursor,
            username
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
            WHERE username = %s
            ORDER BY log_time DESC
        """, (username,))

        logs = cursor.fetchall()

        return jsonify({
            "status": "success",
            "username": username,
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
# AUTOMATIC BRUTE FORCE ALERT DETECTION
# =========================================================

def ensure_bruteforce_alerts(db, cursor, username=None):

    if username:

        cursor.execute("""
            SELECT
                username,
                ip_address,
                COUNT(*) AS failed_count,
                MAX(id) AS latest_log_id
            FROM security_logs
            WHERE username = %s
            AND event_type = 'LOGIN_FAILED'
            GROUP BY username, ip_address
            HAVING COUNT(*) >= 3
        """, (username,))

    else:

        cursor.execute("""
            SELECT
                username,
                ip_address,
                COUNT(*) AS failed_count,
                MAX(id) AS latest_log_id
            FROM security_logs
            WHERE event_type = 'LOGIN_FAILED'
            GROUP BY username, ip_address
            HAVING COUNT(*) >= 3
        """)

    failed_groups = cursor.fetchall()

    for group in failed_groups:

        alert_username = group["username"]
        ip_address = group["ip_address"]
        failed_count = group["failed_count"]
        latest_log_id = group["latest_log_id"]

        cursor.execute("""
            SELECT a.id
            FROM alerts a
            INNER JOIN security_logs s
                ON a.log_id = s.id
            WHERE s.username = %s
            AND a.source_ip = %s
            AND a.alert_type = 'Brute Force Attempt'
            AND a.status = 'Open'
            LIMIT 1
        """, (
            alert_username,
            ip_address
        ))

        existing_alert = cursor.fetchone()

        if existing_alert:
            continue

        alert_description = (
            f"Multiple failed login attempts detected "
            f"for user {alert_username} from IP {ip_address}. "
            f"Total failed attempts: {failed_count}"
        )

        cursor.execute("""
            INSERT INTO alerts
            (
                log_id,
                alert_type,
                description,
                severity,
                status,
                source_ip
            )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """, (
            latest_log_id,
            "Brute Force Attempt",
            alert_description,
            "High",
            "Open",
            ip_address
        ))

        print(
            f"ALERT CREATED: {alert_username} - "
            f"{ip_address} - "
            f"{failed_count} failed attempts"
        )

    db.commit()
# GET ALERTS
# =========================================================

@app.route("/api/alerts")
def get_alerts():

    db = None
    cursor = None

    try:
        username = request.args.get("username")

        if not username:
            return jsonify({
                "status": "error",
                "message": "Username is required."
            }), 400

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        ensure_bruteforce_alerts(
            db,
            cursor,
            username
        )

        cursor.execute("""
            SELECT
                a.id,
                a.log_id,
                a.alert_type,
                a.description,
                a.severity,
                a.status,
                a.source_ip,
                a.detected_at
            FROM alerts a
            INNER JOIN security_logs s
                ON a.log_id = s.id
            WHERE s.username = %s
            ORDER BY a.detected_at DESC
        """, (username,))

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
# DASHBOARD
# =========================================================

@app.route("/api/dashboard")
def dashboard():

    db = None
    cursor = None

    try:
        username = request.args.get("username")

        if not username:
            return jsonify({
                "status": "error",
                "message": "Username is required."
            }), 400

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        ensure_bruteforce_alerts(
            db,
            cursor,
            username
        )

        # Total Logs
        cursor.execute("""
            SELECT COUNT(*) AS total_logs
            FROM security_logs
            WHERE username = %s
        """, (username,))

        total_logs = cursor.fetchone()["total_logs"]

        # Failed Logins
        cursor.execute("""
            SELECT COUNT(*) AS failed_logins
            FROM security_logs
            WHERE username = %s
            AND event_type = 'LOGIN_FAILED'
        """, (username,))

        failed_logins = cursor.fetchone()["failed_logins"]

        # Access Denied
        cursor.execute("""
            SELECT COUNT(*) AS access_denied
            FROM security_logs
            WHERE username = %s
            AND event_type = 'ACCESS_DENIED'
        """, (username,))

        access_denied = cursor.fetchone()["access_denied"]

        # Total Alerts
        cursor.execute("""
            SELECT COUNT(*) AS total_alerts
            FROM alerts a
            INNER JOIN security_logs s
                ON a.log_id = s.id
            WHERE s.username = %s
        """, (username,))

        total_alerts = cursor.fetchone()["total_alerts"]

        # High + Critical Alerts
        cursor.execute("""
            SELECT COUNT(*) AS high_alerts
            FROM alerts a
            INNER JOIN security_logs s
                ON a.log_id = s.id
            WHERE s.username = %s
            AND a.severity IN ('High', 'Critical')
        """, (username,))

        high_alerts = cursor.fetchone()["high_alerts"]

        return jsonify({
            "status": "success",
            "dashboard": {
                "username": username,
                "total_logs": total_logs,
                "failed_logins": failed_logins,
                "access_denied": access_denied,
                "total_alerts": total_alerts,
                "high_alerts": high_alerts
            }
        })

    except Exception as e:

        print("DASHBOARD API ERROR:", repr(e))

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
# USER REGISTRATION
# =========================================================

@app.route("/api/register", methods=["POST"])
def register():

    db = None
    cursor = None

    try:
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({
                "status": "error",
                "message": "JSON body is required"
            }), 400

        username = data.get("username", "").strip()
        password = data.get("password", "")
        role = data.get(
            "role",
            "Security Analyst"
        ).strip()

        # Check required fields
        if not username or not password:
            return jsonify({
                "status": "error",
                "message": "Username and password are required"
            }), 400

        # Check password length
        if len(password) < 6:
            return jsonify({
                "status": "error",
                "message": "Password must be at least 6 characters"
            }), 400

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        # Check existing username
        cursor.execute("""
            SELECT id
            FROM users
            WHERE username = %s
        """, (username,))

        existing_user = cursor.fetchone()

        if existing_user:
            return jsonify({
                "status": "error",
                "message": "Username already exists"
            }), 409

        # Hash password
        hashed_password = generate_password_hash(password)

        # Insert new user
        cursor.execute("""
            INSERT INTO users
            (
                username,
                password,
                role
            )
            VALUES
            (
                %s,
                %s,
                %s
            )
        """, (
            username,
            hashed_password,
            role
        ))

        # Create security log for new user
        cursor.execute("""
            INSERT INTO security_logs
            (
                log_time,
                username,
                ip_address,
                event_type,
                status,
                message,
                severity
            )
            VALUES (
                NOW(),
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """, (
            username,
            "127.0.0.1",
            "ACCOUNT_CREATED",
            "Success",
            "New user account created successfully",
            "Low"
        ))

        db.commit()

        return jsonify({
            "status": "success",
            "message": "Registration successful"
        }), 201

    except Exception as e:

        if db:
            db.rollback()

        print("REGISTRATION API ERROR:", repr(e))

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
# USER LOGIN
# =========================================================

@app.route("/api/login", methods=["POST"])
def login():

    db = None
    cursor = None

    try:
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({
                "status": "error",
                "message": "JSON body is required"
            }), 400

        username = data.get("username", "").strip()
        password = data.get("password", "")

        # Check required fields
        if not username or not password:
            return jsonify({
                "status": "error",
                "message": "Username and password are required"
            }), 400

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        # Automatically detect brute-force activity
        ensure_bruteforce_alerts(
            db,
            cursor,
            username
        )

        cursor.execute("""
            SELECT
                id,
                username,
                password,
                role
            FROM users
            WHERE username = %s
        """, (username,))

        user = cursor.fetchone()

        # Check password
        if user and check_password_hash(
            user["password"],
            password
        ):

            # Create security log for successful login
            cursor.execute("""
                INSERT INTO security_logs
                (
                    log_time,
                    username,
                    ip_address,
                    event_type,
                    status,
                    message,
                    severity
                )
                VALUES (
                    NOW(),
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
            """, (
                username,
                "127.0.0.1",
                "LOGIN_SUCCESS",
                "Success",
                "User logged in successfully",
                "Low"
            ))

            db.commit()

            return jsonify({
                "status": "success",
                "message": "Login successful",
                "user": {
                    "id": user["id"],
                    "username": user["username"],
                    "role": user["role"]
                }
            })

        # Get client IP address
        ip_address = request.remote_addr or "127.0.0.1"

        # Create security log for failed login
        cursor.execute("""
            INSERT INTO security_logs
            (
                log_time,
                username,
                ip_address,
                event_type,
                status,
                message,
                severity
            )
            VALUES (
                NOW(),
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """, (
            username,
            ip_address,
            "LOGIN_FAILED",
            "Failed",
            "Invalid username or password",
            "Medium"
        ))

        # Get the newly created log ID
        failed_log_id = cursor.lastrowid

        # Count failed attempts for this user and IP
        cursor.execute("""
            SELECT COUNT(*) AS failed_count
            FROM security_logs
            WHERE username = %s
            AND ip_address = %s
            AND event_type = 'LOGIN_FAILED'
        """, (
            username,
            ip_address
        ))

        failed_count = cursor.fetchone()["failed_count"]

               # Create brute-force alert after 3 failed attempts
        if failed_count >= 3:

            # Check if an open brute-force alert
            # already exists for this user and IP
            cursor.execute("""
                SELECT
                    a.id
                FROM alerts a
                INNER JOIN security_logs s
                    ON a.log_id = s.id
                WHERE s.username = %s
                AND a.source_ip = %s
                AND a.alert_type = 'Brute Force Attempt'
                AND a.status = 'Open'
                LIMIT 1
            """, (
                username,
                ip_address
            ))

            existing_alert = cursor.fetchone()

            # Create only one open alert
            if existing_alert is None:

                alert_description = (
                    f"Multiple failed login attempts detected "
                    f"for user {username} from IP {ip_address}. "
                    f"Total failed attempts: {failed_count}"
                )

                cursor.execute("""
                    INSERT INTO alerts
                    (
                        log_id,
                        alert_type,
                        description,
                        severity,
                        status,
                        source_ip
                    )
                    VALUES (
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s
                    )
                """, (
                    failed_log_id,
                    "Brute Force Attempt",
                    alert_description,
                    "High",
                    "Open",
                    ip_address
                ))

                print(
                    f"ALERT CREATED: {username} - "
                    f"{ip_address} - "
                    f"{failed_count} failed attempts"
                )

        return jsonify({
            "status": "error",
            "message": "Invalid username or password"
        }), 401

    except Exception as e:

        print("LOGIN API ERROR:", repr(e))

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
# ACCESS DENIED LOGGING
# =========================================================

@app.route("/api/access-denied", methods=["POST"])
def access_denied():

    db = None
    cursor = None

    try:
        data = request.get_json(silent=True) or {}

        username = data.get("username", "").strip()
        message = data.get(
            "message",
            "Unauthorized access attempt"
        )

        if not username:
            return jsonify({
                "status": "error",
                "message": "Username is required."
            }), 400

        ip_address = request.remote_addr or "127.0.0.1"

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            INSERT INTO security_logs
            (
                log_time,
                username,
                ip_address,
                event_type,
                status,
                message,
                severity
            )
            VALUES (
                NOW(),
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """, (
            username,
            ip_address,
            "ACCESS_DENIED",
            "Denied",
            message,
            "Medium"
        ))

        db.commit()

        return jsonify({
            "status": "success",
            "message": "Access denied event logged successfully"
        }), 201

    except Exception as e:

        if db:
            db.rollback()

        print("ACCESS DENIED API ERROR:", repr(e))

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

if __name__ == "__main__":

    print()
    print("=" * 55)
    print("   SECURITY LOG ANALYZER & ALERT DASHBOARD")
    print("=" * 55)
    print()

    print("Flask Backend Starting...")
    print()

    print("Frontend:")
    print("http://10.157.219.237:5000/")
    print()

    print("Health Check:")
    print("http://10.157.219.237:5000/api/health")
    print()

    print("Database Test:")
    print("http://10.157.219.237:5000/api/db-test")
    print()

    print("Dashboard API:")
    print("http://10.157.219.237:5000/api/dashboard")
    print()

    print("Registration API:")
    print("POST http://10.157.219.237:5000/api/register")
    print()

    print("Login API:")
    print("POST http://10.157.219.237:5000/api/login")
    print()

    print("=" * 55)
    print()

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False,
        use_reloader=False
    )