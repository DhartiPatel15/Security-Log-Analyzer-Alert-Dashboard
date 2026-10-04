/* =========================================================
   SECURITY LOG ANALYZER
   SECURITY LOGS JAVASCRIPT
   ========================================================= */

const API_BASE = "";

let allLogs = [];


/* =========================
   LOAD LOGS
   ========================= */

async function loadLogs() {

    const tableBody =
        document.getElementById("logsTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="8" class="loading">
                Loading security logs...
            </td>
        </tr>
    `;

    try {

        const userData = JSON.parse(
            sessionStorage.getItem("security_user") || "{}"
        );

        const username = userData.username;

        if (!username) {
            window.location.href = "login.html";
            return;
        }

        const response = await fetch(
            `${API_BASE}/api/logs?username=${encodeURIComponent(username)}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch logs");
        }

        const data =
            await response.json();

        if (data.status !== "success") {
            throw new Error(
                data.message || "Unable to load logs"
            );
        }

        allLogs = data.logs || [];

        updateLogSummary(allLogs);

        renderLogs(allLogs);

    }

    catch (error) {

        console.error(
            "Logs Error:",
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

function updateLogSummary(logs) {

    const total =
        logs.length;

    const successful =
        logs.filter(
            log => log.event_type === "LOGIN_SUCCESS"
        ).length;

    const failed =
        logs.filter(
            log => log.event_type === "LOGIN_FAILED"
        ).length;

    const denied =
        logs.filter(
            log => log.event_type === "ACCESS_DENIED"
        ).length;


    setElementText(
        "totalLogs",
        total
    );

    setElementText(
        "successLogs",
        successful
    );

    setElementText(
        "failedLogs",
        failed
    );

    setElementText(
        "deniedLogs",
        denied
    );
}


/* =========================
   RENDER LOGS
   ========================= */

function renderLogs(logs) {

    const tableBody =
        document.getElementById("logsTableBody");

    if (!tableBody) {
        return;
    }


    if (logs.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="no-logs">
                        <span class="no-logs-icon">📄</span>
                        No security logs found.
                    </div>
                </td>
            </tr>
        `;

        updateLogCount(0);

        return;
    }


    tableBody.innerHTML =
        logs.map(
            log => {

                const eventClass =
                    getEventClass(
                        log.event_type
                    );

                const statusClass =
                    getStatusClass(
                        log.status
                    );

                const severityClass =
                    getSeverityClass(
                        log.severity
                    );

                return `
                    <tr>

                        <td>
                            <span class="log-id">
                                #${escapeHTML(log.id)}
                            </span>
                        </td>

                        <td>
                            <span class="log-time">
                                ${formatDateTime(log.log_time)}
                            </span>
                        </td>

                        <td>
                            <span class="log-user">
                                ${escapeHTML(log.username || "-")}
                            </span>
                        </td>

                        <td>
                            <span class="log-ip">
                                ${escapeHTML(log.ip_address || "-")}
                            </span>
                        </td>

                        <td>
                            <span class="event-type ${eventClass}">
                                ${escapeHTML(log.event_type || "-")}
                            </span>
                        </td>

                        <td>
                            <span class="log-status ${statusClass}">
                                ${escapeHTML(log.status || "-")}
                            </span>
                        </td>

                        <td>
                            <span class="log-severity ${severityClass}">
                                ${escapeHTML(log.severity || "-")}
                            </span>
                        </td>

                        <td>
                            <div class="log-message">
                                ${escapeHTML(log.message || "-")}
                            </div>
                        </td>

                    </tr>
                `;
            }
        ).join("");


    updateLogCount(logs.length);
}


/* =========================
   FILTER LOGS
   ========================= */

function filterLogs() {

    const searchInput =
        document.getElementById("logSearch");

    const eventFilter =
        document.getElementById("eventFilter");

    const severityFilter =
        document.getElementById("severityFilter");

    const statusFilter =
        document.getElementById("statusFilter");


    const search =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const event =
        eventFilter
            ? eventFilter.value
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
        allLogs.filter(
            log => {

                const matchesSearch =
                    !search ||
                    String(log.username || "")
                        .toLowerCase()
                        .includes(search) ||
                    String(log.ip_address || "")
                        .toLowerCase()
                        .includes(search) ||
                    String(log.event_type || "")
                        .toLowerCase()
                        .includes(search) ||
                    String(log.message || "")
                        .toLowerCase()
                        .includes(search);


                const matchesEvent =
                    !event ||
                    log.event_type === event;


                const matchesSeverity =
                    !severity ||
                    log.severity === severity;


                const matchesStatus =
                    !status ||
                    log.status === status;


                return (
                    matchesSearch &&
                    matchesEvent &&
                    matchesSeverity &&
                    matchesStatus
                );
            }
        );


    renderLogs(filtered);
}


/* =========================
   CLEAR FILTERS
   ========================= */

function clearFilters() {

    const ids = [
        "logSearch",
        "eventFilter",
        "severityFilter",
        "statusFilter"
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


    renderLogs(allLogs);
}


/* =========================
   EVENT CLASS
   ========================= */

function getEventClass(eventType) {

    switch (eventType) {

        case "LOGIN_SUCCESS":
            return "event-login-success";

        case "LOGIN_FAILED":
            return "event-login-failed";

        case "ACCESS_DENIED":
            return "event-access-denied";

        default:
            return "";
    }
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
   UPDATE COUNT
   ========================= */

function updateLogCount(count) {

    const elements = [
        "logsCount",
        "logCount"
    ];


    elements.forEach(
        id => {

            const element =
                document.getElementById(id);

            if (element) {

                element.textContent =
                    `${count} log${count === 1 ? "" : "s"}`;
            }
        }
    );
}


/* =========================
   SET TEXT SAFELY
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
   SEARCH EVENTS
   ========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const searchInput =
            document.getElementById("logSearch");

        const eventFilter =
            document.getElementById("eventFilter");

        const severityFilter =
            document.getElementById("severityFilter");

        const statusFilter =
            document.getElementById("statusFilter");


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                filterLogs
            );
        }


        if (eventFilter) {

            eventFilter.addEventListener(
                "change",
                filterLogs
            );
        }


        if (severityFilter) {

            severityFilter.addEventListener(
                "change",
                filterLogs
            );
        }


        if (statusFilter) {

            statusFilter.addEventListener(
                "change",
                filterLogs
            );
        }


        loadLogs();
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

        if (sidebar.classList.contains("mobile-open")) {
            sidebar.classList.remove("mobile-open");
        } else {
            sidebar.classList.add("mobile-open");
        }

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