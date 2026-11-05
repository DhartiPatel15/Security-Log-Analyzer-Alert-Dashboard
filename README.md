# Security Log Analyzer & Alert Dashboard

A Flask + MySQL web application for reviewing security events, monitoring authentication activity, and highlighting repeated failed-login patterns.

> **Project status:** Security hardening has been added: private APIs use signed Flask sessions and derive data ownership from the authenticated session. Public deployment is still pending a hosted database, rate limiting, CSRF review, and end-to-end testing.

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
│   ├── schema.sql
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

Run the included schema script against the `security_dashboard` database to create the required `users`, `security_logs`, and `alerts` tables:

```bash
mysql -u root -p security_dashboard < backend/schema.sql
```

For XAMPP with an empty root password, omit `-p` and run the command from Command Prompt using the MySQL executable, or import `backend/schema.sql` through phpMyAdmin.

### 5. Configure environment variables

Copy `backend/.env.example` to `backend/.env` and set the values for your own XAMPP database:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=security_dashboard
SECRET_KEY=replace_with_a_long_random_secret
COOKIE_SECURE=false
```

Use the actual MySQL username and password configured on your computer. Never commit `.env` or publish real database credentials.

### 6. Start the application

From the repository root:

```bash
python backend/app.py
```

Open the local address printed by Flask in your browser (normally `http://127.0.0.1:5000/`).

## Deployment configuration

A root `Procfile` and `render.yaml` deployment blueprint are included. The blueprint sets the build/start commands and asks you to enter database credentials as private environment variables in Render. It does **not** create a hosted database for you.

A root `Procfile` is included:

```text
web: gunicorn --chdir backend app:app
```

The backend also includes a `requirements.txt` and `.env.example`. A hosted deployment still requires a reachable hosted MySQL-compatible database and correctly configured environment variables. XAMPP running on a personal laptop is not a hosted database for Render.

## Security controls added

- Flask signed-cookie sessions are issued only after successful password verification.
- Session cookies are HTTP-only and use SameSite=Lax; Render is configured to enable the Secure cookie flag.
- Dashboard, logs, alerts, and database diagnostics require an authenticated session.
- Private data APIs derive the username from the server session, not a client-supplied username.
- Logout clears the server session.
- Public registration always assigns the standard Security Analyst role.
- CORS has been removed because the frontend and API are served from the same Flask origin.
- API error responses return generic messages; diagnostic details remain in server logs.

These changes improve the security baseline, but do not make the project production-ready by themselves. CSRF tokens/origin validation, login rate limiting, monitoring, backups, and full security testing are still required before handling real data.

## Deployment status

- [x] GitHub documentation and deployment configuration
- [x] Signed server-side session authentication
- [x] Protected private APIs and session-based data ownership
- [x] Server logout endpoint
- [x] Safer public registration role handling
- [x] HTTP-only / SameSite session cookie settings
- [x] CORS removed for same-origin hosting
- [ ] Hosted MySQL-compatible database and schema migration
- [ ] Render environment variables and deployment
- [ ] Login rate limiting and CSRF protection review
- [ ] End-to-end tests on the hosted service
- [ ] Public live demo

## Repository

[View the source code on GitHub](https://github.com/DhartiPatel15/Security-Log-Analyzer-Alert-Dashboard)
