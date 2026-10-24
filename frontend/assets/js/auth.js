const AUTH_API =
    "http://localhost/code%20registration%20workshop%20website/athar/backend/api/auth";

document.addEventListener("DOMContentLoaded", async () => {
    updateYear();
    setupMobileNavigation();
    setupAuthForms();

    const user = await getCurrentUser();
    updateHeader(user);
});

// Check whether the user has an active PHP session.
async function getCurrentUser() {
    try {
        const response = await fetch(`${AUTH_API}/me.php`, {
            method: "GET",
            credentials: "include"
        });

        const result = await readApiResponse(response);

        if (response.ok && result.success) {
            return result.data;
        }
    } catch (error) {
        console.error("Session check failed:", error);
    }

    return null;
}

// Change navigation based on authentication state.
function updateHeader(user) {
    const navLinks = document.getElementById("navLinks");
    const navActions = document.getElementById("authActions");

    if (!navLinks || !navActions) return;

    // Remove previous authentication controls.
    navActions.replaceChildren();

    const oldMenu = document.getElementById("accountMenu");
    if (oldMenu) oldMenu.remove();

    const homeLink = navLinks.querySelector('a[href="index.html"]');

    if (homeLink) {
        homeLink.hidden = Boolean(user);
    }

    // Guest navigation.
    if (!user) {
        addAuthLink(navActions, "login.html", "Log in", "login-link");
        addAuthLink(
            navActions,
            "register.html",
            "Join ATHAR",
            "btn btn-primary"
        );
        return;
    }

    // Logged-in user's avatar and account dropdown.
    const name = user.name || "ATHAR User";
    const initials = name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join("");

    const account = document.createElement("div");
    account.className = "account-menu";
    account.id = "accountMenu";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "avatar-trigger";
    trigger.setAttribute("aria-label", "Open account menu");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", "accountDropdown");

    const avatar = document.createElement("span");
    avatar.className = "user-avatar";
    avatar.textContent = initials || "U";

    const chevron = document.createElement("span");
    chevron.className = "avatar-chevron";
    chevron.textContent = "⌄";

    trigger.append(avatar, chevron);

    const dropdown = document.createElement("div");
    dropdown.className = "account-dropdown";
    dropdown.id = "accountDropdown";
    dropdown.hidden = true;

    const accountHeader = document.createElement("div");
    accountHeader.className = "account-dropdown-header";

    const accountName = document.createElement("strong");
    accountName.textContent = name;

    const accountLabel = document.createElement("span");
    accountLabel.textContent = "Your ATHAR account";

    accountHeader.append(accountName, accountLabel);

    const menuItems = [
        { label: "Profile", href: "profile.html", icon: "♙" },
        {
            label: "My Accomplishments",
            href: "accomplishments.html",
            icon: "✦"
        },
        
        { label: "Support", href: "support.html", icon: "?" }
    ];

    dropdown.appendChild(accountHeader);

    const divider = document.createElement("div");
    divider.className = "account-menu-divider";
    dropdown.appendChild(divider);

    menuItems.forEach(item => {
        const link = document.createElement("a");
        link.className = "account-menu-item";
        link.href = item.href;

        const icon = document.createElement("span");
        icon.className = "account-menu-icon";
        icon.textContent = item.icon;
        icon.setAttribute("aria-hidden", "true");

        const label = document.createElement("span");
        label.textContent = item.label;

        link.append(icon, label);
        dropdown.appendChild(link);
    });

    const logoutDivider = document.createElement("div");
    logoutDivider.className = "account-menu-divider";
    dropdown.appendChild(logoutDivider);

    const logout = document.createElement("button");
    logout.type = "button";
    logout.id = "logoutButton";
    logout.className = "account-menu-item account-logout";

    const logoutIcon = document.createElement("span");
    logoutIcon.className = "account-menu-icon";
    logoutIcon.textContent = "↪";

    const logoutLabel = document.createElement("span");
    logoutLabel.textContent = "Log out";

    logout.append(logoutIcon, logoutLabel);

    logout.addEventListener("click", async () => {
        logout.disabled = true;
        logoutLabel.textContent = "Logging out...";

        try {
            const response = await fetch(`${AUTH_API}/logout.php`, {
                method: "POST",
                credentials: "include"
            });

            const result = await readApiResponse(response);

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Logout failed.");
            }

            window.location.href = "index.html";
        } catch (error) {
            alert(error.message || "Unable to log out.");
            logout.disabled = false;
            logoutLabel.textContent = "Log out";
        }
    });

    dropdown.appendChild(logout);

    trigger.addEventListener("click", () => {
        const isOpening = dropdown.hidden;
        dropdown.hidden = !isOpening;
        trigger.setAttribute("aria-expanded", String(isOpening));
    });

    document.addEventListener("click", event => {
        if (!account.contains(event.target)) {
            dropdown.hidden = true;
            trigger.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            dropdown.hidden = true;
            trigger.setAttribute("aria-expanded", "false");
        }
    });

    account.append(trigger, dropdown);
    navActions.appendChild(account);
}

function addAuthLink(container, href, text, className = "") {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    link.className = className;
    container.appendChild(link);
}

function updateYear() {
    const year = document.getElementById("currentYear");
    if (year) year.textContent = new Date().getFullYear();
}

function setupMobileNavigation() {
    const toggle = document.getElementById("menuToggle");
    const links = document.getElementById("navLinks");

    if (!toggle || !links) return;

    toggle.addEventListener("click", () => {
        const open = links.classList.toggle("active");
        toggle.setAttribute("aria-expanded", String(open));
    });
}

function setupAuthForms() {
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

        registerForm.addEventListener("submit", async event => {
            event.preventDefault();
            if (message) message.hidden = true;

            if (!registerForm.checkValidity()) {
                registerForm.reportValidity();
                return;
            }

            if (password.value !== confirmPassword.value) {
                showMessage(message, "Passwords do not match.", "error");
                confirmPassword.focus();
                return;
            }

            if (birthDate?.value && birthDate.value > birthDate.max) {
                showMessage(message, "Birth date cannot be in the future.", "error");
                birthDate.focus();
                return;
            }

            button.disabled = true;
            button.textContent = "Creating Account...";

            try {
                const response = await fetch(`${AUTH_API}/register.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(
                        Object.fromEntries(new FormData(registerForm).entries())
                    )
                });

                const result = await readApiResponse(response);

                if (!response.ok || !result.success) {
                    throw new Error(result.message || "Registration failed.");
                }

                registerForm.reset();
                showMessage(message, "Account created. Redirecting to login...", "success");

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 800);
            } catch (error) {
                showMessage(message, error.message, "error");
            } finally {
                button.disabled = false;
                button.textContent = "Create Account";
            }
        });
    }

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        const message = document.getElementById("loginMessage");
        const button = document.getElementById("loginButton");

        loginForm.addEventListener("submit", async event => {
            event.preventDefault();
            if (message) message.hidden = true;

            if (!loginForm.checkValidity()) {
                loginForm.reportValidity();
                return;
            }

            button.disabled = true;
            button.textContent = "Logging In...";

            try {
                const response = await fetch(`${AUTH_API}/login.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(
                        Object.fromEntries(new FormData(loginForm).entries())
                    )
                });

                const result = await readApiResponse(response);

                if (!response.ok || !result.success) {
                    throw new Error(result.message || "Login failed.");
                }

                showMessage(message, result.message || "Login successful.", "success");

                
                setTimeout(() => {
                    const user = result.data;

                    if (user?.role === "admin") {
                        window.location.href = "admin/dashboard.html";
                        return;
                    }

                    const params = new URLSearchParams(window.location.search);
                    const returnTo = params.get("returnTo");

                    if (
                        returnTo &&
                        returnTo.startsWith("workshop-details.html")
                    ) {
                        window.location.href = returnTo;
                    } else {
                        window.location.href = "index.html";
                    }
                }, 300);

            } catch (error) {
                showMessage(message, error.message || "Unable to connect to the server.", "error");
            } finally {
                button.disabled = false;
                button.textContent = "Log In";
            }
        });
    }
}

function showMessage(element, message, type = "error") {
    if (!element) return;

    element.textContent = message;
    element.className = `form-message ${type}`;
    element.hidden = false;
}

async function readApiResponse(response) {
    const text = await response.text();

    try {
        return JSON.parse(text);
    } catch {
        throw new Error("The server returned an invalid response.");
    }
}