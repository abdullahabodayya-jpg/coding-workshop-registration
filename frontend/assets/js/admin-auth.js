
const AUTH_API = "../../backend/api/auth";

async function checkAdminAccess() {
    try {
        const response = await fetch(`${AUTH_API}/me.php`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        });

        const result = await response.json();

        if (!response.ok || result.success !== true) {
            window.location.replace("../login.html");
            return;
        }

        if (result.data?.role !== "admin") {
            window.location.replace("../index.html");
            return;
        }

        document.body.hidden = false;

    } catch (error) {
        console.error("Admin authentication check failed:", error);
        document.body.hidden = false;

        alert("Unable to verify your admin session. Please try again.");
    }
}

document.body.hidden = true;
checkAdminAccess();

const logoutButton = document.getElementById("logoutBtn");

logoutButton?.addEventListener("click", async () => {
    logoutButton.disabled = true;

    try {
        const response = await fetch(`${AUTH_API}/logout.php`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        });

        const result = await response.json();

        if (!response.ok || result.success !== true) {
            throw new Error(result.message || "Logout failed.");
        }

        window.location.replace("../login.html");

    } catch (error) {
        console.error("Logout failed:", error);
        alert("Unable to log out. Please try again.");
        logoutButton.disabled = false;
    }
});
