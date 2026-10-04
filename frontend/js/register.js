document.addEventListener("DOMContentLoaded", function () {

    const registerForm = document.getElementById("registerForm");
    const message = document.getElementById("message");

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const username =
            document.getElementById("username").value.trim();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const role =
            document.getElementById("role").value;

        // Check password match
        if (password !== confirmPassword) {
            message.textContent = "Passwords do not match.";
            message.style.color = "#ff6b6b";
            return;
        }

        // Minimum password length
        if (password.length < 6) {
            message.textContent =
                "Password must be at least 6 characters.";
            message.style.color = "#ff6b6b";
            return;
        }

        try {

            const response = await fetch(
                "/api/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password,
                        role: role
                    })
                }
            );

            const data = await response.json();

            if (data.status === "success") {

                message.textContent =
                    "Registration successful! Redirecting to login...";

                message.style.color = "#4ade80";

                setTimeout(function () {
                    window.location.href = "login.html";
                }, 1500);

            } else {

                message.textContent =
                    data.message || "Registration failed.";

                message.style.color = "#ff6b6b";
            }

        } catch (error) {

            console.error("Registration Error:", error);

            message.textContent =
                "Unable to connect to the server.";

            message.style.color = "#ff6b6b";
        }
    });
});