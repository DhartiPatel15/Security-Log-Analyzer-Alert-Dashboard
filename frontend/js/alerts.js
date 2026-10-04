/* =========================================================
   SECURITY LOG ANALYZER
   ALERTS JAVASCRIPT
   ========================================================= */

const API_BASE = "";

let allAlerts = [];


/* =========================
   LOAD ALERTS
   ========================= */

async function loadAlerts() {

    const tableBody =
        document.getElementById("alertsTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="8" class="loading">
                Loading security alerts...
            </td>
        </tr>
    `;

    try {

        const userData = JSON.parse(
            sessionStorage.getItem("security_user") || "{}"
        );

        const username = userData.username;

        const response =
            await fetch(
                `${API_BASE}/api/alerts?username=${encodeURIComponent(username)}`
            );

        if (!response.ok) {
            throw new Error("Failed to fetch alerts");
        }

        const data =
            await response.json();

        if (data.status !== "success") {
            throw new Error(
                data.message || "Unable to load alerts"
            );
        }

        allAlerts =
            data.alerts || [];

        updateAlertSummary(allAlerts);

        renderAlerts(allAlerts);

    }

    catch (error) {

        console.error(
            "Alerts Error:",
            error
        );

        tableBody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="error-message">
                        Unable to connect to the backend server.
                        Please make sure Flask is running.
                    </div>
                </td>
            </tr>
        `;
    }
}


/* =========================
   UPDATE SUMMARY
   ========================= */

function updateAlertSummary(alerts) {

    const total =
        alerts.length;

    const critical =
        alerts.filter(
            alert => alert.severity === "Critical"
        ).length;

    const high =
        alerts.filter(
            alert => alert.severity === "High"
        ).length;

    const open =
        alerts.filter(
            alert =>
                String(alert.status || "")
                    .toLowerCase() === "open"
        ).length;


    setElementText(
        "totalAlerts",
        total
    );

    setElementText(
        "criticalAlerts",
        critical
    );

    setElementText(
        "highAlerts",
        high
    );

    setElementText(
        "openAlerts",
        open
    );
}


/* =========================
   RENDER ALERTS
   ========================= */

function renderAlerts(alerts) {

    const tableBody =
        document.getElementById("alertsTableBody");

    if (!tableBody) {
        return;
    }


    if (alerts.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="no-alerts">
                        <span class="no-alerts-icon">🛡️</span>
                        No security alerts found.
                    </div>
                </td>
            </tr>
        `;

        updateAlertCount(0);

        return;
    }


    tableBody.innerHTML =
        alerts.map(
            alert => {

                const severityClass =
                    getSeverityClass(
                        alert.severity
                    );

                const statusClass =
                    getStatusClass(
                        alert.status
                    );


                return `
                    <tr>

                        <td>
                            <span class="alert-id">
                                #${escapeHTML(alert.id)}
                            </span>
                        </td>

                        <td>
                            <span class="alert-type">
                                ${escapeHTML(
                                    alert.alert_type || "-"
                                )}
                            </span>
                        </td>

                        <td>
                            <div class="alert-description">
                                ${escapeHTML(
                                    alert.description || "-"
                                )}
                            </div>
                        </td>

                        <td>
                            <span class="alert-severity ${severityClass}">
                                ${escapeHTML(
                                    alert.severity || "-"
                                )}
                            </span>
                        </td>

                        <td>
                            <span class="alert-status ${statusClass}">
                                ${escapeHTML(
                                    alert.status || "-"
                                )}
                            </span>
                        </td>

                        <td>
                            <span class="alert-ip">
                                ${escapeHTML(
                                    alert.source_ip || "-"
                                )}
                            </span>
                        </td>

                        <td>
                            <span class="alert-time">
                                ${formatDateTime(
                                    alert.detected_at
                                )}
                            </span>
                        </td>

                        <td>
                            <button
                                class="alert-action"
                                onclick="showAlertDetails(${alert.id})"
                            >
                                View
                            </button>
                        </td>

                    </tr>
                `;
            }
        ).join("");


    updateAlertCount(
        alerts.length
    );
}


/* =========================
   FILTER ALERTS
   ========================= */

function filterAlerts() {

    const searchInput =
        document.getElementById("alertSearch");

    const severityFilter =
        document.getElementById("alertSeverityFilter");

    const statusFilter =
        document.getElementById("alertStatusFilter");


    const search =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const severity =
        severityFilter
            ? severityFilter.value
            : "";


    const status =
        statusFilter
            ? statusFilter.value
            : "";


    const filtered =
        allAlerts.filter(
            alert => {

                const searchableText =
                    [
                        alert.alert_type,
                        alert.description,
                        alert.source_ip,
                        alert.severity,
                        alert.status
                    ]
                        .join(" ")
                        .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchableText.includes(search);


                const matchesSeverity =
                    !severity ||
                    alert.severity === severity;


                const matchesStatus =
                    !status ||
                    alert.status === status;


                return (
                    matchesSearch &&
                    matchesSeverity &&
                    matchesStatus
                );
            }
        );


    renderAlerts(filtered);
}


/* =========================
   CLEAR FILTERS
   ========================= */

function clearAlertFilters() {

    const ids = [
        "alertSearch",
        "alertSeverityFilter",
        "alertStatusFilter"
    ];


    ids.forEach(
        id => {

            const element =
                document.getElementById(id);

            if (element) {
                element.value = "";
            }
        }
    );


    renderAlerts(allAlerts);
}


/* =========================
   VIEW ALERT DETAILS
   ========================= */

function showAlertDetails(alertId) {

    const alert =
        allAlerts.find(
            item =>
                Number(item.id) === Number(alertId)
        );


    if (!alert) {
        return;
    }


    const message =
        `Alert #${alert.id}\n\n` +
        `Type: ${alert.alert_type}\n` +
        `Severity: ${alert.severity}\n` +
        `Status: ${alert.status}\n` +
        `Source IP: ${alert.source_ip}\n\n` +
        `Description:\n${alert.description}`;


    window.alert(message);
}


/* =========================
   SEVERITY CLASS
   ========================= */

function getSeverityClass(severity) {

    if (!severity) {
        return "";
    }

    return severity
        .toLowerCase()
        .replace(/\s+/g, "-");
}


/* =========================
   STATUS CLASS
   ========================= */

function getStatusClass(status) {

    if (!status) {
        return "";
    }

    return status
        .toLowerCase()
        .replace(/\s+/g, "-");
}


/* =========================
   DATE FORMAT
   ========================= */

function formatDateTime(dateValue) {

    if (!dateValue) {
        return "-";
    }


    const date =
        new Date(dateValue);


    if (Number.isNaN(date.getTime())) {
        return escapeHTML(
            String(dateValue)
        );
    }


    return date.toLocaleString(
        "en-IN",
        {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );
}


/* =========================
   UPDATE ALERT COUNT
   ========================= */

function updateAlertCount(count) {

    const elements = [
        "alertsCount",
        "alertCount"
    ];


    elements.forEach(
        id => {

            const element =
                document.getElementById(id);

            if (element) {

                element.textContent =
                    `${count} alert${count === 1 ? "" : "s"}`;
            }
        }
    );
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
   PAGE EVENTS
   ========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const searchInput =
            document.getElementById("alertSearch");

        const severityFilter =
            document.getElementById(
                "alertSeverityFilter"
            );

        const statusFilter =
            document.getElementById(
                "alertStatusFilter"
            );


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                filterAlerts
            );
        }


        if (severityFilter) {

            severityFilter.addEventListener(
                "change",
                filterAlerts
            );
        }


        if (statusFilter) {

            statusFilter.addEventListener(
                "change",
                filterAlerts
            );
        }


        loadAlerts();
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