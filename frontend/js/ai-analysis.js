/* =========================================================
   SECURITY LOG ANALYZER
   AI ANALYSIS JAVASCRIPT
   ========================================================= */

const API_BASE = "";

let aiLogs = [];
let aiAlerts = [];


/* =========================
   START AI ANALYSIS
   ========================= */

async function runAnalysis() {

    try {

        showLoadingState();

        const userData = JSON.parse(
            sessionStorage.getItem("security_user") || "{}"
        );

        const username = userData.username;

        if (!username) {
            window.location.href = "login.html";
            return;
        }

        const logsResponse =
            await fetch(
                `${API_BASE}/api/logs?username=${encodeURIComponent(username)}`
            );

        const alertsResponse =
            await fetch(
                `${API_BASE}/api/alerts?username=${encodeURIComponent(username)}`
            );


        if (!logsResponse.ok ||
            !alertsResponse.ok) {

            throw new Error(
                "Backend API request failed"
            );
        }


        const logsData =
            await logsResponse.json();

        const alertsData =
            await alertsResponse.json();


        if (
            logsData.status !== "success" ||
            alertsData.status !== "success"
        ) {

            throw new Error(
                "Invalid API response"
            );
        }


        aiLogs =
            logsData.logs || [];

        aiAlerts =
            alertsData.alerts || [];


        analyzeSecurityData();


        updateLastUpdated();


    }

    catch (error) {

        console.error(
            "AI Analysis Error:",
            error
        );

        showErrorState();
    }
}


/* =========================
   ANALYZE SECURITY DATA
   ========================= */

function analyzeSecurityData() {

    const failedLogins =
        aiLogs.filter(
            log =>
                log.event_type === "LOGIN_FAILED"
        ).length;


    const accessDenied =
        aiLogs.filter(
            log =>
                log.event_type === "ACCESS_DENIED"
        ).length;


    const successfulLogins =
        aiLogs.filter(
            log =>
                log.event_type === "LOGIN_SUCCESS"
        ).length;


    const highAlerts =
        aiAlerts.filter(
            alert =>
                alert.severity === "High" ||
                alert.severity === "Critical"
        ).length;


    const suspiciousEvents =
        failedLogins +
        accessDenied;


    /*
    --------------------------------
    CALCULATE RISK
    --------------------------------
    */

    let risk = "LOW";


    if (
        highAlerts >= 2 ||
        failedLogins >= 5
    ) {

        risk = "HIGH";

    }

    else if (
        highAlerts >= 1 ||
        failedLogins >= 3 ||
        accessDenied >= 2
    ) {

        risk = "MEDIUM";
    }


    /*
    --------------------------------
    UPDATE SUMMARY
    --------------------------------
    */

    updateElement(
        "riskLevel",
        risk
    );


    updateElement(
        "suspiciousEvents",
        suspiciousEvents
    );


    updateElement(
        "detectedAlerts",
        aiAlerts.length
    );


    /*
    --------------------------------
    RISK COLOR
    --------------------------------
    */

    const riskElement =
        document.getElementById(
            "riskLevel"
        );


    if (riskElement) {

        riskElement.className =
            "ai-number " +
            getRiskClass(risk);
    }


    /*
    --------------------------------
    THREAT ASSESSMENT
    --------------------------------
    */

    generateThreatAssessment(
        risk,
        failedLogins,
        accessDenied,
        highAlerts
    );


    /*
    --------------------------------
    ATTACK PATTERN
    --------------------------------
    */

    generateAttackPattern(
        failedLogins,
        accessDenied,
        successfulLogins
    );


    /*
    --------------------------------
    RECOMMENDATIONS
    --------------------------------
    */

    generateRecommendations(
        failedLogins,
        accessDenied,
        highAlerts,
        risk
    );
}


/* =========================
   THREAT ASSESSMENT
   ========================= */

function generateThreatAssessment(
    risk,
    failedLogins,
    accessDenied,
    highAlerts
) {

    const element =
        document.getElementById(
            "threatAssessment"
        );


    if (!element) {
        return;
    }


    let message = "";


    if (risk === "HIGH") {

        message =
            "The current security data indicates a high-risk " +
            "environment. Multiple suspicious activities and " +
            "high-severity alerts require immediate investigation.";

    }

    else if (risk === "MEDIUM") {

        message =
            "The system has detected several suspicious security " +
            "events. The activity should be investigated and " +
            "continuously monitored.";

    }

    else {

        message =
            "The available security logs show relatively low-risk " +
            "activity. Continuous monitoring is recommended to " +
            "identify future abnormal behaviour.";
    }


    if (failedLogins > 0) {

        message +=
            ` ${failedLogins} failed login attempt(s) were detected.`;
    }


    if (accessDenied > 0) {

        message +=
            ` ${accessDenied} access-denied event(s) were detected.`;
    }


    if (highAlerts > 0) {

        message +=
            ` ${highAlerts} high-severity alert(s) require review.`;
    }


    element.textContent =
        message;
}


/* =========================
   ATTACK PATTERN
   ========================= */

function generateAttackPattern(
    failedLogins,
    accessDenied,
    successfulLogins
) {

    const element =
        document.getElementById(
            "attackPattern"
        );


    if (!element) {
        return;
    }


    let pattern = "";


    if (failedLogins >= 3) {

        pattern =
            `Repeated failed-login activity was detected. ` +
            `${failedLogins} failed attempts were found, ` +
            `which may indicate a possible brute-force pattern.`;

    }

    else if (accessDenied >= 2) {

        pattern =
            `Multiple access-denied events were detected. ` +
            `This pattern should be reviewed for possible ` +
            `unauthorized access attempts.`;

    }

    else if (failedLogins > 0) {

        pattern =
            `Some failed login activity was detected, but the ` +
            `available data does not show a strong repeated pattern.`;

    }

    else {

        pattern =
            "No significant attack pattern was detected in the " +
            "currently available security logs.";
    }


    if (successfulLogins > 0) {

        pattern +=
            ` ${successfulLogins} successful login event(s) ` +
            `were also recorded.`;
    }


    element.textContent =
        pattern;
}


/* =========================
   RECOMMENDATIONS
   ========================= */

function generateRecommendations(
    failedLogins,
    accessDenied,
    highAlerts,
    risk
) {

    const container =
        document.getElementById(
            "recommendations"
        );


    if (!container) {
        return;
    }


    const recommendations = [];


    if (failedLogins >= 3) {

        recommendations.push(
            "Investigate repeated failed login attempts and review their source IP addresses."
        );

        recommendations.push(
            "Consider account protection measures such as rate limiting and multi-factor authentication."
        );
    }


    if (accessDenied > 0) {

        recommendations.push(
            "Review access-denied events and verify whether the affected users had valid permissions."
        );
    }


    if (highAlerts > 0) {

        recommendations.push(
            "Review High and Critical alerts first and investigate the related logs."
        );
    }


    if (risk === "HIGH") {

        recommendations.push(
            "Prioritize investigation of high-risk activity and preserve relevant security logs."
        );
    }


    recommendations.push(
        "Continue monitoring security logs and regularly review unusual authentication activity."
    );


    container.innerHTML =
        recommendations
            .map(
                recommendation => `
                    <div class="recommendation">
                        ✓ ${escapeHTML(recommendation)}
                    </div>
                `
            )
            .join("");
}


/* =========================
   LOADING STATE
   ========================= */

function showLoadingState() {

    updateElement(
        "riskLevel",
        "..."
    );


    updateElement(
        "suspiciousEvents",
        "..."
    );


    updateElement(
        "detectedAlerts",
        "..."
    );


    const assessment =
        document.getElementById(
            "threatAssessment"
        );


    const pattern =
        document.getElementById(
            "attackPattern"
        );


    if (assessment) {

        assessment.textContent =
            "Analyzing security logs...";
    }


    if (pattern) {

        pattern.textContent =
            "Detecting suspicious activity patterns...";
    }


    const recommendations =
        document.getElementById(
            "recommendations"
        );


    if (recommendations) {

        recommendations.innerHTML = `
            <div class="recommendation">
                AI engine is analyzing the latest security data...
            </div>
        `;
    }
}


/* =========================
   ERROR STATE
   ========================= */

function showErrorState() {

    updateElement(
        "riskLevel",
        "N/A"
    );


    updateElement(
        "suspiciousEvents",
        "N/A"
    );


    updateElement(
        "detectedAlerts",
        "N/A"
    );


    const assessment =
        document.getElementById(
            "threatAssessment"
        );


    const pattern =
        document.getElementById(
            "attackPattern"
        );


    if (assessment) {

        assessment.textContent =
            "Unable to connect to the Flask backend. " +
            "Please start the backend server and try again.";
    }


    if (pattern) {

        pattern.textContent =
            "Security pattern analysis requires backend data.";
    }


    const recommendations =
        document.getElementById(
            "recommendations"
        );


    if (recommendations) {

        recommendations.innerHTML = `
            <div class="recommendation">
                Please start the backend server before running AI analysis.
            </div>
        `;
    }
}


/* =========================
   RISK CLASS
   ========================= */

function getRiskClass(risk) {

    switch (risk) {

        case "HIGH":
            return "risk-high";

        case "MEDIUM":
            return "risk-medium";

        case "CRITICAL":
            return "risk-critical";

        default:
            return "risk-low";
    }
}


/* =========================
   UPDATE ELEMENT
   ========================= */

function updateElement(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;
    }
}


/* =========================
   LAST UPDATED
   ========================= */

function updateLastUpdated() {

    const element =
        document.getElementById(
            "aiLastUpdated"
        );


    if (!element) {
        return;
    }


    const now =
        new Date();


    element.textContent =
        "Last analysis: " +
        now.toLocaleString(
            "en-IN"
        );
}


/* =========================
   HTML ESCAPE
   ========================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================
   PAGE LOAD
   ========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        runAnalysis();
    }
);
/* ================================
   MOBILE MENU
================================ */

document.addEventListener("DOMContentLoaded", function () {

    const mobileMenuBtn =
        document.getElementById("mobileMenuBtn");

    const sidebar =
        document.querySelector(".sidebar");

    if (!mobileMenuBtn || !sidebar) {
        return;
    }

    mobileMenuBtn.addEventListener("click", function () {

        sidebar.classList.toggle("mobile-open");

    });

});
/* ================================
   LOGOUT
================================ */

document.addEventListener("DOMContentLoaded", function () {

    const logoutButton =
        document.querySelector(".user-more");

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener("click", function () {

        sessionStorage.removeItem("security_logged_in");
        sessionStorage.removeItem("security_user");

        window.location.href = "login.html";

    });

});