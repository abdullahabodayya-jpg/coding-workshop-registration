const AUTH_API =
    "http://localhost/code%20registration%20workshop%20website/athar/backend/api/auth";

document.addEventListener("DOMContentLoaded", () => {

    fetch(`${AUTH_API}/me.php`, {
    credentials: "include"
})
    .then(response => response.json())
    .then(data => {
        console.log("Session test:", data);
        alert(JSON.stringify(data, null, 2));
    })
    .catch(error => {
        console.error(error);
        alert("Could not connect to the session API.");
    });
    // Update footer year.
    const yearElement = document.getElementById("currentYear");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Mobile navigation.
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            const isOpen = navLinks.classList.toggle("active");
            menuToggle.setAttribute("aria-expanded", String(isOpen));
        });
    }

    // Registration form.
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        const message = document.getElementById("formMessage");
        const button = document.getElementById("submitButton");
        const password = document.getElementById("password");
        const confirmPassword = document.getElementById("confirmPassword");
        const birthDate = document.getElementById("birthDate");

        if (birthDate) {
            birthDate.max = new Date().toISOString().split("T")[0];
        }

        registerForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            message.hidden = true;

            if (!registerForm.checkValidity()) {
                registerForm.reportValidity();
                return;
            }

            if (password.value !== confirmPassword.value) {
                showMessage(message, "Passwords do not match.", "error");
                confirmPassword.focus();
                return;
            }

            if (birthDate.value && birthDate.value > birthDate.max) {
                showMessage(
                    message,
                    "Birth date cannot be in the future.",
                    "error"
                );
                birthDate.focus();
                return;
            }

            const data = Object.fromEntries(
                new FormData(registerForm).entries()
            );

            button.disabled = true;
            button.textContent = "Creating Account...";

            try {
                const response = await fetch(`${AUTH_API}/register.php`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify(data)
                });

                const result = await readApiResponse(response);

                if (!response.ok || !result.success) {
                    throw new Error(result.message || "Registration failed.");
                }

                registerForm.reset();

                showMessage(
                    message,
                    `${result.message} Redirecting to login...`,
                    "success"
                );

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);
            } catch (error) {
                showMessage(
                    message,
                    error.message || "Unable to connect to the server.",
                    "error"
                );
            } finally {
                button.disabled = false;
                button.textContent = "Create Account";
            }
        });
    }

    // Login form.
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        const message = document.getElementById("loginMessage");
        const button = document.getElementById("loginButton");

        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            message.hidden = true;

            if (!loginForm.checkValidity()) {
                loginForm.reportValidity();
                return;
            }

            const data = Object.fromEntries(
                new FormData(loginForm).entries()
            );

            button.disabled = true;
            button.textContent = "Logging In...";

            try {
                const response = await fetch(`${AUTH_API}/login.php`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify(data)
                });

                const result = await readApiResponse(response);

                if (!response.ok || !result.success) {
                    throw new Error(result.message || "Login failed.");
                }

                showMessage(message, result.message, "success");
                loginForm.reset();

                setTimeout(() => {
                    window.location.href = "workshops.html";
                }, 700);
            } catch (error) {
                showMessage(
                    message,
                    error.message || "Unable to connect to the server.",
                    "error"
                );
            } finally {
                button.disabled = false;
                button.textContent = "Log In";
            }
        });
    }
});

// Display API messages.
function showMessage(element, message, type = "error") {
    if (!element) return;

    element.textContent = message;
    element.className = `form-message ${type}`;
    element.hidden = false;
}

// Read JSON safely and report unexpected server responses.
async function readApiResponse(response) {
    const text = await response.text();

    try {
        return JSON.parse(text);
    } catch {
        throw new Error(
            "The server returned an invalid response. Check the PHP backend for errors."
        );
    }
}