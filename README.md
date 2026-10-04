# Security Log Analyzer & Alert Dashboard

## 📌 Project Overview

Security Log Analyzer & Alert Dashboard is a web-based cybersecurity monitoring system designed to analyze security logs, detect suspicious activities, generate alerts, and provide a centralized security dashboard.

The system helps security analysts monitor login activities, failed authentication attempts, unauthorized access events, suspicious IP addresses, and security alerts through an interactive dashboard.

## 🎯 Project Objectives

- Analyze security log files automatically
- Detect failed login attempts
- Detect unauthorized access events
- Identify possible brute-force attacks
- Generate security alerts
- Display security statistics through charts
- Provide IP-based threat information
- Provide AI-assisted security analysis
- Maintain security logs and alerts in MySQL database
- Provide secure administrator login

## 🛠️ Technologies Used

### Frontend
- HTML5
- CSS3
- JavaScript
- Chart.js

### Backend
- Python
- Flask
- Flask-CORS

### Database
- MySQL / MariaDB

### Security
- Password hashing using Werkzeug
- Environment variables using `.env`
- Session-based frontend authentication

## 🔐 Main Features

### 1. Secure Login
Administrator login with password verification using hashed passwords.

### 2. Security Dashboard
Displays:
- Total Events
- Failed Logins
- Access Denied
- Active Alerts
- High Threats
- Security Event Charts

### 3. Security Log Analyzer
Analyzes security log files and stores detected events in the database.

### 4. Alert Detection
Detects repeated failed login attempts and generates security alerts.

### 5. Security Logs
Displays analyzed security events including:
- Username
- IP Address
- Event Type
- Status
- Severity
- Message
- Time

### 6. Alerts
Displays generated security alerts with severity and source IP information.

### 7. Threat Intelligence
Provides IP-based security information and identifies suspicious activity patterns.

### 8. AI Security Analysis
Provides automated analysis of security events and generates security recommendations based on detected patterns.

## 🗄️ Database

Database name:

`security_dashboard`

Main tables:

- `users`
- `security_logs`
- `alerts`

## 📁 Project Structure

```text
security project/
│
├── backend/
│   ├── app.py
│   ├── database.py
│   ├── log_analyzer.py
│   ├── mysql_test.py
│   ├── test_database.py
│   └── .env
│
├── frontend/
│   ├── css/
│   ├── js/
│   ├── index.html
│   ├── login.html
│   ├── logs.html
│   ├── alerts.html
│   ├── threat-intelligence.html
│   └── ai-analysis.html
│
├── logs/
│   └── sample.log
│
├── venv/
│
├── .gitignore
└── README.md