# Security Log Analyzer & Alert Dashboard

A Flask web application for reviewing security events, monitoring authentication activity, and detecting repeated failed-login patterns.

## Quick start on Windows 11 (no XAMPP required)

1. Download the project ZIP from the green **Code** button on GitHub, or use the ZIP link below.
2. Extract the ZIP.
3. Open the extracted folder.
4. Double-click **START.bat**.
5. Wait for package installation to finish. The browser will open at `http://127.0.0.1:5000` (if it does not, open that address yourself).

The first run creates a Python virtual environment, installs packages, creates the SQLite database and adds a local demo administrator automatically. **You do not need to create a database, install XAMPP, or edit database credentials for local use.**

**Local demo login:** username `admin`, password `admin123`. Change these in `backend/.env` before using the app beyond a classroom demo.

To stop the app, press **CTRL+C** in the black command window.

## Features

- User registration with securely hashed passwords.
- Login and logout with signed server-side sessions.
- Security dashboard with event summary cards and Chart.js visualizations.
- Security logs and alert views.
- Brute-force alert generation after repeated failed login attempts.
- Access-denied event logging.
- Threat Intelligence and AI Analysis frontend pages (these pages do not imply an external threat-intelligence or AI service is connected).

## Technology stack

- Frontend: HTML5, CSS3, JavaScript, Chart.js
- Backend: Python, Flask
- Default local database: SQLite (created automatically)
- Optional database: MySQL / MariaDB
- Password hashing: Werkzeug
- Deployment server: Gunicorn

## Optional MySQL / MariaDB setup

SQLite is the default for a quick local run. If you specifically want to use XAMPP MySQL:

1. Start MySQL in XAMPP.
2. Create a database named `security_dashboard`.
3. Import `backend/schema.sql` into that database.
4. In `backend/.env`, set `DB_DRIVER=mysql` and configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`.
5. Restart the app.

Never commit `.env` or publish database credentials.

## Deployment status

The repository includes a Render blueprint and Gunicorn start command. A public Render deployment still needs a reachable hosted MySQL/MariaDB database, the database schema imported there, private Render environment variables, and an end-to-end deployment test. Your laptop's XAMPP database cannot be reached by Render. The current Render blueprint expects MySQL configuration; it does not provision the database itself.

Before using real user data, add full CSRF-token protection, backups, monitoring, and security testing. This is an educational portfolio project, not a production SOC platform.

## Repository files

```text
Security-Log-Analyzer-Alert-Dashboard/
├── START.bat
├── Procfile
├── render.yaml
├── backend/
│   ├── app.py
│   ├── database.py
│   ├── schema.sql
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── css/
    ├── js/
    ├── index.html
    ├── login.html
    ├── register.html
    ├── logs.html
    └── alerts.html
```

## Download and source

- [Download ZIP](https://github.com/DhartiPatel15/Security-Log-Analyzer-Alert-Dashboard/archive/refs/heads/main.zip)
- [Open GitHub repository](https://github.com/DhartiPatel15/Security-Log-Analyzer-Alert-Dashboard)
