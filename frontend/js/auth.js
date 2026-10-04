(function () {

    const isLoggedIn =
        sessionStorage.getItem("security_logged_in") === "true";

    if (!isLoggedIn) {

        const userData = JSON.parse(
            localStorage.getItem("security_last_user") || "{}"
        );

        const username = userData.username;

        if (username) {

            fetch("/api/access-denied", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    message: "Unauthorized access attempt"
                })
            })
            .finally(function () {
                window.location.replace("login.html");
            });

        } else {

            window.location.replace("login.html");

        }
    }

})();