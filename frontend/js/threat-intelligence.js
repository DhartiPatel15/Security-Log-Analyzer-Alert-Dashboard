/* =========================================================
   SECURITY LOG ANALYZER
   THREAT INTELLIGENCE JAVASCRIPT
   ========================================================= */

const API_BASE = "http://127.0.0.1:5000";

let securityLogs = [];


/* =========================
   LOAD SECURITY DATA
   ========================= */

async function loadThreatData() {

    try {

        const response =
            await fetch(`${API_BASE}/api/logs`);

        if (!response.ok) {
            throw new Error("Failed to load security logs");
        }

        const data =
            await response.json();

        if (data.status !== "success") {
            throw new Error(
                data.message || "Unable to load logs"
            );
        }

        securityLogs =
            data.logs || [];


        updateThreatSummary(
            securityLogs
        );


    }

    catch (error) {

        console.error(
            "Threat Intelligence Error:",
            error
        );

        const message =
            document.getElementById(
                "threatError"
            );

        if (message) {

            message.textContent =
                "Unable to connect to the backend server.";
        }
    }
}


/* =========================
   UPDATE SUMMARY
   ========================= */

function updateThreatSummary(logs) {

    const total =
        logs.length;


    const failed =
        logs.filter(
            log =>
                log.event_type === "LOGIN_FAILED"
        ).length;


    const denied =
        logs.filter(
            log =>
                log.event_type === "ACCESS_DENIED"
        ).length;


    const suspicious =
        failed + denied;


    const uniqueIPs =
        new Set(
            logs
                .map(log => log.ip_address)
                .filter(Boolean)
        ).size;


    setElementText(
        "totalThreatLogs",
        total
    );

    setElementText(
        "failedThreats",
        failed
    );

    setElementText(
        "deniedThreats",
        denied
    );

    setElementText(
        "uniqueThreatIPs",
        uniqueIPs
    );


    const suspiciousElement =
        document.getElementById(
            "suspiciousThreats"
        );

    if (suspiciousElement) {

        suspiciousElement.textContent =
            suspicious;
    }
}


/* =========================
   LOOKUP IP
   ========================= */

function lookupIP() {

    const input =
        document.getElementById(
            "ipLookup"
        );

    if (!input) {
        return;
    }


    const ip =
        input.value.trim();


    if (!ip) {

        showLookupResult(
            "Please enter an IP address."
        );

        return;
    }


    const ipLogs =
        securityLogs.filter(
            log =>
                log.ip_address === ip
        );


    if (ipLogs.length === 0) {

        showIPResult({
            ip: ip,
            total: 0,
            failed: 0,
            denied: 0,
            risk: "LOW",
            message:
                "No matching activity was found in the available security logs."
        });

        return;
    }


    const failed =
        ipLogs.filter(
            log =>
                log.event_type === "LOGIN_FAILED"
        ).length;


    const denied =
        ipLogs.filter(
            log =>
                log.event_type === "ACCESS_DENIED"
        ).length;


    const total =
        ipLogs.length;


    let risk =
        "LOW";


    if (failed >= 5) {

        risk =
            "HIGH";

    }

    else if (
        failed >= 3 ||
        denied >= 2
    ) {

        risk =
            "MEDIUM";
    }


    let message;


    if (risk === "HIGH") {

        message =
            "High-risk activity detected. Multiple failed login attempts were observed from this IP.";

    }

    else if (risk === "MEDIUM") {

        message =
            "Suspicious activity detected. The IP has multiple failed or denied events.";

    }

    else {

        message =
            "No significant suspicious activity was detected for this IP.";
    }


    showIPResult({
        ip: ip,
        total: total,
        failed: failed,
        denied: denied,
        risk: risk,
        message: message
    });
}


/* =========================
   SHOW IP RESULT
   ========================= */

function showIPResult(result) {

    const resultBox =
        document.getElementById(
            "ipResult"
        );


    if (!resultBox) {
        return;
    }


    resultBox.classList.add("show");


    const ipElement =
        document.getElementById(
            "resultIP"
        );

    const totalElement =
        document.getElementById(
            "ipTotalEvents"
        );

    const failedElement =
        document.getElementById(
            "ipFailedEvents"
        );

    const deniedElement =
        document.getElementById(
            "ipDeniedEvents"
        );

    const riskElement =
        document.getElementById(
            "ipRisk"
        );

    const messageElement =
        document.getElementById(
            "ipRiskMessage"
        );


    if (ipElement) {

        ipElement.textContent =
            result.ip;
    }


    if (totalElement) {

        totalElement.textContent =
            result.total;
    }


    if (failedElement) {

        failedElement.textContent =
            result.failed;
    }


    if (deniedElement) {

        deniedElement.textContent =
            result.denied;
    }


    if (riskElement) {

        riskElement.textContent =
            result.risk;

        riskElement.className =
            "risk-level " +
            result.risk.toLowerCase();
    }


    if (messageElement) {

        messageElement.textContent =
            result.message;
    }
}


/* =========================
   SIMPLE LOOKUP MESSAGE
   ========================= */

function showLookupResult(message) {

    const resultBox =
        document.getElementById(
            "ipResult"
        );

    if (!resultBox) {
        return;
    }


    resultBox.classList.add("show");


    const messageElement =
        document.getElementById(
            "ipRiskMessage"
        );

    if (messageElement) {

        messageElement.textContent =
            message;
    }
}


/* =========================
   SET TEXT
   ========================= */

function setElementText(
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
   ENTER KEY FOR IP SEARCH
   ========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const input =
            document.getElementById(
                "ipLookup"
            );


        if (input) {

            input.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter"
                    ) {

                        lookupIP();
                    }
                }
            );
        }


        loadThreatData();
    }
);