document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const loginMessage = document.getElementById("loginMessage");
    const loginButton = document.getElementById("loginButton");

    // Show / hide password
    if (togglePassword) {
        togglePassword.addEventListener("click", function () {

            if (passwordInput.type === "password") {
                passwordInput.type = "text";
            } else {
                passwordInput.type = "password";
            }

        });
    }


    // Login
    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const username =
            document.getElementById("username").value.trim();

        const password =
            passwordInput.value;

        loginMessage.textContent = "";
        loginMessage.className = "login-message";


        // Empty fields
        if (!username || !password) {

            loginMessage.textContent =
                "Please enter username and password.";

            loginMessage.classList.add("error");

            return;
        }


        // Loading
        loginButton.disabled = true;

        loginButton.querySelector(
            ".button-text"
        ).textContent = "Checking...";


        try {

            const response = await fetch(
                "/api/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                }
            );


            const data = await response.json();


            if (data.status === "success") {

                loginMessage.textContent =
                    "Login successful! Opening dashboard...";

                loginMessage.classList.add("success");


                sessionStorage.setItem(
                    "security_logged_in",
                    "true"
                );


                sessionStorage.setItem(
                    "security_user",
                    JSON.stringify(data.user)
                );

                localStorage.setItem(
                    "security_last_user",
                    JSON.stringify(data.user)
                );


                loginButton.querySelector(
                    ".button-text"
                ).textContent = "Access Granted";


                setTimeout(function () {

                    window.location.href = "index.html";

                }, 500);


            } else {

                loginMessage.textContent =
                    data.message || "Invalid username or password.";

                loginMessage.classList.add("error");

                loginButton.disabled = false;

                loginButton.querySelector(
                    ".button-text"
                ).textContent = "Sign In";

            }


        } catch (error) {

            console.error("Login Error:", error);

            loginMessage.textContent =
                "Unable to connect to the backend server.";

            loginMessage.classList.add("error");

            loginButton.disabled = false;

            loginButton.querySelector(
                ".button-text"
            ).textContent = "Sign In";

        }

    });

});