# Security Log Analyzer & Alert Dashboard

A Flask + MySQL web application for reviewing security events, monitoring authentication activity, and highlighting repeated failed-login patterns.

> **Project status:** Local-development project. The repository includes a Flask backend, HTML/CSS/JavaScript frontend, MySQL configuration, and a Gunicorn start command. It is **not yet ready for public production deployment**. Before exposing it to the internet, server-side authentication/authorization must replace the current browser-only login flag and username-based API access.

## Features in the current codebase

- User registration with passwords hashed by Werkzeug.
- Login password verification and login success/failure event logging.
- Security dashboard with event summary cards and Chart.js visualizations.
- Security log and alert views.
- Brute-force alert generation after repeated failed login attempts.
- Access-denied event logging.
- Threat Intelligence and AI Analysis frontend pages.
- MySQL/MariaDB persistence.

Some pages and integrations may require configuration or further implementation. Do not treat the presence of a page as proof that an external intelligence or AI service is connected.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Charts | Chart.js |
| Backend | Python, Flask |
| Database | MySQL / MariaDB |
| Password hashing | Werkzeug |
| Local configuration | python-dotenv |
| WSGI server | Gunicorn |

## Project structure

```text
Security-Log-Analyzer-Alert-Dashboard/
├── backend/
│   ├── app.py
│   ├── database.py
│   ├── log_analyzer.py
│   ├── mysql_test.py
│   ├── test_database.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── css/
│   ├── js/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── logs.html
│   ├── alerts.html
│   ├── threat-intelligence.html
│   └── ai-analysis.html
├── logs/
├── Procfile
└── README.md
```

## Run locally on Windows 11

### 1. Prerequisites

- Python 3.10 or newer
- XAMPP with MySQL/MariaDB
- VS Code (recommended)

### 2. Create and activate a virtual environment

Open a terminal in the repository root:

```powershell
py -m venv venv
.\venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, use Command Prompt:

```bat
venv\Scripts\activate
```

### 3. Install Python packages

```bash
pip install -r backend/requirements.txt
```

### 4. Create the database

Start **MySQL** from XAMPP, open phpMyAdmin, and create a database named:

```sql
CREATE DATABASE security_dashboard;
```

The application expects the database tables `users`, `security_logs`, and `alerts`. Use the project's database schema/setup SQL if supplied with your local copy. This repository README does not invent a schema migration.

### 5. Configure environment variables

Copy `backend/.env.example` to `backend/.env` and set the values for your own XAMPP database:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=security_dashboard
```

Use the actual MySQL username and password configured on your computer. Never commit `.env` or publish real database credentials.

### 6. Start the application

From the repository root:

```bash
python backend/app.py
```

Open the local address printed by Flask in your browser (normally `http://127.0.0.1:5000/`).

## Deployment configuration

A root `Procfile` is included:

```text
web: gunicorn --chdir backend app:app
```

The backend also includes a `requirements.txt` and `.env.example`. A hosted deployment still requires a reachable hosted MySQL-compatible database and correctly configured environment variables. XAMPP running on a personal laptop is not a hosted database for Render.

## Important security work before public deployment

The current frontend stores a login indicator and user details in browser storage. The data APIs also accept a username from the request rather than deriving the identity from a server-validated session. **These are not secure server-side access controls.** CORS is currently permissive, and some error responses expose exception details.

Before public deployment:
1. Implement server-side session authentication (or another verified token mechanism).
2. Require authentication on every private API and derive the username from the authenticated identity, never a query parameter.
3. Add a real logout endpoint and server-side session invalidation.
4. Restrict CORS to the exact deployed origin, or remove cross-origin access when frontend and API are same-origin.
5. Return generic error messages to clients and keep detailed exceptions only in server logs.
6. Add CSRF protection for cookie-authenticated state-changing requests, login rate limiting, secure cookie settings, and HTTPS.
7. Configure a managed database, least-privilege database user, backups, and production environment secrets.
8. Test registration, login, logout, authorization, database failures, and all dashboard APIs before launch.

## Current deployment status

- [x] GitHub repository structure documented
- [x] Python dependency manifest added
- [x] Gunicorn Procfile added
- [x] Environment-variable example added
- [ ] Server-side authentication and authorization hardening
- [ ] Hosted MySQL database configuration
- [ ] End-to-end testing on the hosted service
- [ ] Public live demo

## Repository

[View the source code on GitHub](https://github.com/DhartiPatel15/Security-Log-Analyzer-Alert-Dashboard)
