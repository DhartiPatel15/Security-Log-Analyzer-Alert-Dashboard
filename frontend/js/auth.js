// Server-side session validation. Browser storage is never used as authorization.
document.addEventListener("DOMContentLoaded", async function () {
    try {
        const response = await fetch("/api/me", {
            method: "GET",
            headers: { "Accept": "application/json" },
            cache: "no-store"
        });
        if (!response.ok) {
            sessionStorage.removeItem("security_logged_in");
            sessionStorage.removeItem("security_user");
            window.location.replace("login.html");
            return;
        }
        const data = await response.json();
        if (data.status !== "success" || !data.user) {
            window.location.replace("login.html");
            return;
        }
        sessionStorage.setItem("security_logged_in", "true");
        sessionStorage.setItem("security_user", JSON.stringify(data.user));
    } catch (error) {
        console.error("Session validation failed:", error);
        window.location.replace("login.html");
    }
});

document.addEventListener("click", async function (event) {
    const button = event.target.closest("#logoutButton, .user-more");
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
        await fetch("/api/logout", { method: "POST", cache: "no-store" });
    } finally {
        sessionStorage.removeItem("security_logged_in");
        sessionStorage.removeItem("security_user");
        localStorage.removeItem("security_last_user");
        window.location.replace("login.html");
    }
}, true);
