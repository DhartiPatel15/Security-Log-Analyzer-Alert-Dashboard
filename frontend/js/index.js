const API_BASE = "";

let securityChart = null;
let eventBarChart = null;

let dashboardData = {};
let allLogs = [];
let allAlerts = [];


/* =========================================================
   LOAD COMPLETE DASHBOARD
   ========================================================= */

async function loadDashboard() {

    try {
        showDashboardLoading();

        const userData = JSON.parse(
            sessionStorage.getItem("security_user") || "{}"
        );

        const username = userData.username;

        if (!username) {
            window.location.href = "login.html";
            return;
        }

        const [
            dashboardResponse,
            logsResponse,
            alertsResponse
        ] = await Promise.all([

            fetch(
                `${API_BASE}/api/dashboard?username=${encodeURIComponent(username)}`
            ),

            fetch(
                `${API_BASE}/api/logs?username=${encodeURIComponent(username)}`
            ),

            fetch(
                `${API_BASE}/api/alerts?username=${encodeURIComponent(username)}`
            )

        ]);


        if (
            !dashboardResponse.ok ||
            !logsResponse.ok ||
            !alertsResponse.ok
        ) {

            throw new Error(
                "Backend API request failed."
            );

        }


        const dashboardResult =
            await dashboardResponse.json();

        const logsResult =
            await logsResponse.json();

        const alertsResult =
            await alertsResponse.json();


        if (
            dashboardResult.status !== "success" ||
            logsResult.status !== "success" ||
            alertsResult.status !== "success"
        ) {

            throw new Error(
                "Invalid API response."
            );

        }


        dashboardData =
            dashboardResult.dashboard || {};

        allLogs =
            logsResult.logs || [];

        allAlerts =
            alertsResult.alerts || [];


        /* Update cards */

        updateDashboardCards();


        /* Update charts */

        updateCharts();


        /* Update recent sections */

        renderRecentAlerts();

        renderRecentLogs();


        console.log(
            "Dashboard loaded successfully."
        );

    }


    catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

        showDashboardError();

    }

}


/* =========================================================
   UPDATE DASHBOARD CARDS
   ========================================================= */

function updateDashboardCards() {

    setElementText(
        "totalLogs",
        dashboardData.total_logs ?? 0
    );


    setElementText(
        "failedLogins",
        dashboardData.failed_logins ?? 0
    );


    setElementText(
        "accessDenied",
        dashboardData.access_denied ?? 0
    );


    setElementText(
        "totalAlerts",
        dashboardData.total_alerts ?? 0
    );


    setElementText(
        "highAlerts",
        dashboardData.high_alerts ?? 0
    );

}


/* =========================================================
   CHART DATA
   ========================================================= */

function getEventCounts() {

    const successfulLogins =
        allLogs.filter(
            log =>
                log.event_type === "LOGIN_SUCCESS"
        ).length;


    const failedLogins =
        allLogs.filter(
            log =>
                log.event_type === "LOGIN_FAILED"
        ).length;


    const accessDenied =
        allLogs.filter(
            log =>
                log.event_type === "ACCESS_DENIED"
        ).length;


    return {

        successfulLogins,

        failedLogins,

        accessDenied

    };

}


/* =========================================================
   UPDATE BOTH CHARTS
   ========================================================= */

function updateCharts() {

    const counts =
        getEventCounts();


    createPieChart(counts);

    createBarChart(counts);

}


/* =========================================================
   PIE CHART
   ========================================================= */

function createPieChart(counts) {

    const canvas =
        document.getElementById(
            "securityChart"
        );


    if (!canvas) {

        console.warn(
            "securityChart canvas not found."
        );

        return;

    }


    if (securityChart) {

        securityChart.destroy();

    }


    const ctx =
        canvas.getContext("2d");


    securityChart =
        new Chart(ctx, {

            type: "doughnut",


            data: {

                labels: [

                    "Successful Login",

                    "Failed Login",

                    "Access Denied"

                ],


                datasets: [

                    {

                        data: [

                            counts.successfulLogins,

                            counts.failedLogins,

                            counts.accessDenied

                        ],

                        backgroundColor: [

                            "#00e89a",

                            "#ff4d67",

                            "#ff9f43"

                        ],

                        borderColor:
                            "#0b111c",

                        borderWidth: 3,


                        hoverOffset: 8

                    }

                ]

            },


            options: {

                responsive: true,

                maintainAspectRatio: false,


                cutout: "65%",


                plugins: {

                    legend: {

                        display: true,

                        position: "bottom",

                        labels: {

                            color: "#aab4c3",

                            padding: 18,

                            usePointStyle: true,

                            pointStyle: "circle",

                            font: {

                                size: 10

                            }

                        }

                    },


                    tooltip: {

                        backgroundColor:
                            "#080d16",

                        borderColor:
                            "rgba(255,255,255,0.1)",

                        borderWidth: 1,

                        titleColor: "#ffffff",

                        bodyColor: "#aab4c3",

                        padding: 12

                    }

                }

            }

        });

}


/* =========================================================
   BAR CHART
   ========================================================= */

function createBarChart(counts) {

    const canvas =
        document.getElementById(
            "eventBarChart"
        );


    if (!canvas) {

        console.warn(
            "eventBarChart canvas not found."
        );

        return;

    }


    if (eventBarChart) {

        eventBarChart.destroy();

    }


    const ctx =
        canvas.getContext("2d");


    eventBarChart =
        new Chart(ctx, {

            type: "bar",


            data: {

                labels: [

                    "Successful Login",

                    "Failed Login",

                    "Access Denied"

                ],


                datasets: [

                    {

                        label:
                            "Security Events",

                        data: [

                            counts.successfulLogins,

                            counts.failedLogins,

                            counts.accessDenied

                        ],


                        backgroundColor: [

                            "#00e89a",

                            "#ff4d67",

                            "#ff9f43"

                        ],


                        borderRadius: 7,

                        borderSkipped: false,

                        maxBarThickness: 55

                    }

                ]

            },


            options: {

                responsive: true,

                maintainAspectRatio: false,


                scales: {

                    x: {

                        ticks: {

                            color: "#7e8a9e",

                            font: {

                                size: 9

                            }

                        },


                        grid: {

                            display: false

                        }

                    },


                    y: {

                        beginAtZero: true,

                        ticks: {

                            color: "#7e8a9e",

                            precision: 0,

                            font: {

                                size: 9

                            }

                        },


                        grid: {

                            color:
                                "rgba(255,255,255,0.05)"

                        }

                    }

                },


                plugins: {

                    legend: {

                        display: false

                    },


                    tooltip: {

                        backgroundColor:
                            "#080d16",

                        borderColor:
                            "rgba(255,255,255,0.1)",

                        borderWidth: 1,

                        titleColor: "#ffffff",

                        bodyColor: "#aab4c3",

                        padding: 12

                    }

                }

            }

        });

}


/* =========================================================
   RECENT ALERTS
   ========================================================= */

function renderRecentAlerts() {

    const container =
        document.getElementById(
            "recentAlertsBody"
        );


    if (!container) {

        return;

    }


    if (allAlerts.length === 0) {

        container.innerHTML = `

            <div class="loading-state">

                No security alerts found.

            </div>

        `;

        return;

    }


    const recentAlerts =
        allAlerts.slice(0, 5);


    container.innerHTML =
        recentAlerts.map(
            alert => {

                const severity =
                    String(
                        alert.severity || "Medium"
                    ).toLowerCase();


                return `

                    <div class="alert-item">

                        <span
                            class="alert-severity ${escapeHTML(severity)}">
                        </span>


                        <div class="alert-info">

                            <strong>
                                ${escapeHTML(
                                    alert.alert_type ||
                                    "Security Alert"
                                )}
                            </strong>


                            <small>

                                ${escapeHTML(
                                    alert.source_ip ||
                                    "Unknown source"
                                )}

                                •

                                ${formatDateTime(
                                    alert.detected_at
                                )}

                            </small>

                        </div>


                        <span class="alert-status">

                            ${escapeHTML(
                                alert.status ||
                                "Open"
                            )}

                        </span>

                    </div>

                `;

            }
        ).join("");

}


/* =========================================================
   RECENT LOGS
   ========================================================= */

function renderRecentLogs() {

    const tableBody =
        document.getElementById(
            "recentLogsBody"
        );


    if (!tableBody) {

        return;

    }


    if (allLogs.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="loading-state">

                    No security logs found.

                </td>

            </tr>

        `;

        return;

    }


    const recentLogs =
        allLogs.slice(0, 8);


    tableBody.innerHTML =
        recentLogs.map(
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

                            ${formatDateTime(
                                log.log_time
                            )}

                        </td>


                        <td>

                            ${escapeHTML(
                                log.username || "-"
                            )}

                        </td>


                        <td>

                            <span class="ip-address">

                                ${escapeHTML(
                                    log.ip_address || "-"
                                )}

                            </span>

                        </td>


                        <td>

                            <span
                                class="event-badge ${eventClass}">

                                ${escapeHTML(
                                    log.event_type || "-"
                                )}

                            </span>

                        </td>


                        <td>

                            <span
                                class="status-badge ${statusClass}">

                                ${escapeHTML(
                                    log.status || "-"
                                )}

                            </span>

                        </td>


                        <td>

                            <span
                                class="severity-badge ${severityClass}">

                                ${escapeHTML(
                                    log.severity || "-"
                                )}

                            </span>

                        </td>


                    </tr>

                `;

            }
        ).join("");

}


/* =========================================================
   EVENT CLASS
   ========================================================= */

function getEventClass(eventType) {

    switch (eventType) {

        case "LOGIN_SUCCESS":

            return "success";


        case "LOGIN_FAILED":

            return "failed";


        case "ACCESS_DENIED":

            return "denied";


        default:

            return "";

    }

}


/* =========================================================
   STATUS CLASS
   ========================================================= */

function getStatusClass(status) {

    if (!status) {

        return "";

    }


    return String(status)
        .toLowerCase()
        .replace(/\s+/g, "-");

}


/* =========================================================
   SEVERITY CLASS
   ========================================================= */

function getSeverityClass(severity) {

    if (!severity) {

        return "";

    }


    return String(severity)
        .toLowerCase()
        .replace(/\s+/g, "-");

}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDateTime(dateValue) {

    if (!dateValue) {

        return "-";

    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return escapeHTML(
            String(dateValue)
        );

    }


    return date.toLocaleString(
        "en-IN",
        {

            day: "2-digit",

            month: "short",

            year: "numeric",

            hour: "2-digit",

            minute: "2-digit"

        }
    );

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   SET TEXT
   ========================================================= */

function setElementText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent = value;

    }

}


/* =========================================================
   LOADING STATE
   ========================================================= */

function showDashboardLoading() {

    setElementText(
        "totalLogs",
        "..."
    );

    setElementText(
        "failedLogins",
        "..."
    );

    setElementText(
        "accessDenied",
        "..."
    );

    setElementText(
        "totalAlerts",
        "..."
    );

    setElementText(
        "highAlerts",
        "..."
    );

}


/* =========================================================
   ERROR STATE
   ========================================================= */

function showDashboardError() {

    setElementText(
        "totalLogs",
        "!"
    );

    setElementText(
        "failedLogins",
        "!"
    );

    setElementText(
        "accessDenied",
        "!"
    );

    setElementText(
        "totalAlerts",
        "!"
    );

    setElementText(
        "highAlerts",
        "!"
    );


    const alertContainer =
        document.getElementById(
            "recentAlertsBody"
        );


    if (alertContainer) {

        alertContainer.innerHTML = `

            <div class="loading-state">

                Unable to connect to Flask backend.

                <br>

                Please make sure
                <strong>app.py</strong>
                is running.

            </div>

        `;

    }


    const logsContainer =
        document.getElementById(
            "recentLogsBody"
        );


    if (logsContainer) {

        logsContainer.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="loading-state">

                    Unable to load security logs.

                </td>

            </tr>

        `;

    }

}


/* =========================================================
   AUTO REFRESH
   ========================================================= */

setInterval(
    loadDashboard,
    30000
);


/* =========================================================
   START DASHBOARD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadDashboard();

    }
);
document.querySelectorAll("#logoutButton").forEach(function (logoutButton) {
    logoutButton.addEventListener("click", function () {
        sessionStorage.removeItem("security_logged_in");
        sessionStorage.removeItem("security_user");

        window.location.href = "login.html";
    });
});
/* ================================
   MOBILE MENU
================================ */

document.addEventListener("DOMContentLoaded", function () {

    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const sidebar = document.querySelector(".sidebar");

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