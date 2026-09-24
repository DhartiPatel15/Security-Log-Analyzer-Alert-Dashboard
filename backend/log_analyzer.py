from database import get_db_connection
from datetime import datetime
from collections import Counter


LOG_FILE = "../logs/sample.log"


def get_severity(event_type):
    if event_type == "LOGIN_SUCCESS":
        return "Low"

    elif event_type == "LOGIN_FAILED":
        return "Medium"

    elif event_type == "ACCESS_DENIED":
        return "Medium"

    return "Low"


def analyze_logs():

    print("Starting Log Analyzer...")

    db = get_db_connection()
    cursor = db.cursor()

    # Sample data માટે જૂના test records clear કરીએ છીએ
    cursor.execute("DELETE FROM alerts")
    cursor.execute("DELETE FROM security_logs")

    failed_ips = []
    failed_log_ids = {}

    with open(LOG_FILE, "r") as file:

        for line in file:

            line = line.strip()

            if not line:
                continue

            parts = line.split(" | ")

            if len(parts) != 5:
                print("Invalid log line:", line)
                continue

            log_time = datetime.strptime(
                parts[0],
                "%Y-%m-%d %H:%M:%S"
            )

            username = parts[1]
            ip_address = parts[2]
            event_type = parts[3]
            message = parts[4]

            severity = get_severity(event_type)

            status = "Success"

            if event_type == "LOGIN_FAILED":
                status = "Failed"
                failed_ips.append(ip_address)

            elif event_type == "ACCESS_DENIED":
                status = "Denied"

            # Security log database માં insert
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
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                log_time,
                username,
                ip_address,
                event_type,
                status,
                message,
                severity
            ))

            log_id = cursor.lastrowid

            # દરેક IP માટે છેલ્લું failed login ID રાખીએ
            if event_type == "LOGIN_FAILED":
                failed_log_ids[ip_address] = log_id

    # Failed login count
    failed_count = Counter(failed_ips)

    # Suspicious IP detect
    for ip_address, count in failed_count.items():

        if count >= 3:

            log_id = failed_log_ids[ip_address]

            alert_description = (
                f"Multiple failed login attempts detected "
                f"from IP {ip_address}. "
                f"Total failed attempts: {count}"
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
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                log_id,
                "Brute Force Attempt",
                alert_description,
                "High",
                "Open",
                ip_address
            ))

            print(
                f"ALERT CREATED: {ip_address} "
                f"has {count} failed login attempts"
            )

    db.commit()

    cursor.close()
    db.close()

    print("Log analysis completed successfully!")


if __name__ == "__main__":
    analyze_logs()