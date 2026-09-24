(function () {
    const isLoggedIn =
        sessionStorage.getItem("security_logged_in") === "true";

    if (!isLoggedIn) {
        window.location.href = "login.html";
    }
})();