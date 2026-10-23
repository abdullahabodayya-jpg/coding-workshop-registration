const PROFILE_API =
    "http://localhost/code%20registration%20workshop%20website/athar/backend/api/users/profile.php";

const LOGOUT_API =
    "http://localhost/code%20registration%20workshop%20website/athar/backend/api/auth/logout.php";

let originalProfile = null;

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("profileForm");
    const saveButton = document.getElementById("saveButton");
    const resetButton = document.getElementById("resetButton");
    const birthDate = document.getElementById("birth_date");

    const languageSelect = document.getElementById("languageSelect");
    const themeSelect = document.getElementById("themeSelect");
    const logoutButton = document.getElementById("settingsLogout");

    if (birthDate) {
        birthDate.max = new Date().toLocaleDateString("en-CA");
    }

    // Load saved preferences
    const savedLanguage =
        localStorage.getItem("athar-language") || "en";

    const savedTheme =
        localStorage.getItem("athar-theme") || "light";

    languageSelect.value = savedLanguage;
    themeSelect.value = savedTheme;

    applyLanguage(savedLanguage);
    applyTheme(savedTheme);

    // Preference events
    languageSelect.addEventListener("change", () => {
        const language = languageSelect.value;

        localStorage.setItem("athar-language", language);
        applyLanguage(language);
    });

    themeSelect.addEventListener("change", () => {
        const theme = themeSelect.value;

        localStorage.setItem("athar-theme", theme);
        applyTheme(theme);
    });

    // Load profile
    loadProfile();

    // Save profile
    form.addEventListener("submit", async event => {
        event.preventDefault();
        hideMessage();

        if (!form.reportValidity()) return;

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        const data = Object.fromEntries(
            new FormData(form).entries()
        );

        try {
            const response = await fetch(PROFILE_API, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.status === 401) {
                window.location.href = "login.html";
                return;
            }

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Could not save your settings."
                );
            }

            fillProfile(result.data);

            showMessage(
                result.message || "Settings saved successfully.",
                "success"
            );
        } catch (error) {
            showMessage(
                error.message || "Unable to connect to the server.",
                "error"
            );
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = "Save Changes";
        }
    });

    // Reset form to the last successfully loaded profile
    resetButton.addEventListener("click", () => {
        setTimeout(() => {
            if (originalProfile) {
                fillProfile(originalProfile);
            }

            hideMessage();
        }, 0);
    });

    // Logout
    logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;
        logoutButton.textContent = "Logging out...";

        try {
            const response = await fetch(LOGOUT_API, {
                method: "POST",
                credentials: "include"
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Logout failed.");
            }

            window.location.href = "index.html";
        } catch (error) {
            alert(error.message || "Unable to log out.");

            logoutButton.disabled = false;
            logoutButton.textContent = "Log out";
        }
    });
});

async function loadProfile() {
    try {
        const response = await fetch(PROFILE_API, {
            method: "GET",
            credentials: "include"
        });

        const result = await response.json();

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Could not load your settings."
            );
        }

        fillProfile(result.data);
    } catch (error) {
        showMessage(
            error.message || "Unable to load your settings.",
            "error"
        );

        document.getElementById("saveButton").disabled = true;
    }
}

function fillProfile(user) {
    originalProfile = { ...user };

    const form = document.getElementById("profileForm");
    const date = user.created_at
    ? new Date(user.created_at.replace(" ", "T"))
    : null;

        document.getElementById("createdAt").textContent =
            date && !Number.isNaN(date.getTime())
                ? date.toLocaleDateString()
                : "—";

    [
        "first_name",
        "last_name",
        "email",
        "phone",
        "gender",
        "birth_date",
        "location"
    ].forEach(field => {
        const input = form.elements.namedItem(field);

        if (input) {
            input.value = user[field] ?? "";
        }
    });

    document.getElementById("accountStatus").textContent =
        user.status || "Unknown";
}

function applyLanguage(language) {
    document.documentElement.lang = language;
    document.documentElement.dir =
        language === "ar" ? "rtl" : "ltr";
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
}

function showMessage(text, type) {
    const message = document.getElementById("profileMessage");

    message.textContent = text;
    message.className = `profile-message ${type}`;
    message.hidden = false;
}

function hideMessage() {
    const message = document.getElementById("profileMessage");

    message.hidden = true;
    message.textContent = "";
}
