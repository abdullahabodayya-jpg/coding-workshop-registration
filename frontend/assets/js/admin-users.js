
"use strict";

const API_BASE =
    "http://localhost/code%20registration%20workshop%20website/athar/backend/api";

const USERS_API = `${API_BASE}/users`;

const tableBody = document.getElementById("usersTableBody");
const searchInput = document.getElementById("searchInput");
const roleFilter = document.getElementById("roleFilter");
const statusFilter = document.getElementById("statusFilter");
const resultsCount = document.getElementById("resultsCount");
const pageMessage = document.getElementById("pageMessage");
const refreshBtn = document.getElementById("refreshBtn");
const adminModal = document.getElementById("adminModal");
const openAdminModalBtn = document.getElementById("openAdminModal");
const closeAdminModalBtn = document.getElementById("closeAdminModal");
const cancelAdminModalBtn = document.getElementById("cancelAdminModal");
const createAdminForm = document.getElementById("createAdminForm");
const adminFormMessage = document.getElementById("adminFormMessage");
const saveAdminBtn = document.getElementById("saveAdminBtn");

let searchTimer = null;
let requestController = null;
let requestVersion = 0;

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function showMessage(message, type = "success") {
    pageMessage.textContent = message;
    pageMessage.className = `page-message ${type}`;
    pageMessage.hidden = false;
}

function hideMessage() {
    pageMessage.hidden = true;
    pageMessage.textContent = "";
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
            ...(options.body
                ? { "Content-Type": "application/json" }
                : {}),
            ...(options.headers || {})
        }
    });

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error("The server returned an invalid response.");
    }

    if (!response.ok || result.success !== true) {
        if (response.status === 401 || response.status === 403) {
            throw new Error(
                result.message || "You do not have permission to perform this action."
            );
        }

        throw new Error(
            result.message || "Something went wrong. Please try again."
        );
    }

    return result;
}

function getInitials(firstName, lastName) {
    const first = String(firstName ?? "").trim();
    const last = String(lastName ?? "").trim();

    return (
        (first.charAt(0) || "") +
        (last.charAt(0) || "")
    ).toUpperCase() || "?";
}

function formatDate(dateValue) {
    if (!dateValue) return "—";

    const date = new Date(
        String(dateValue).replace(" ", "T")
    );

    if (Number.isNaN(date.getTime())) {
        return escapeHtml(dateValue);
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
}

function renderStats(stats = {}) {
    document.getElementById("totalUsers").textContent =
        Number(stats.total_users ?? 0).toLocaleString();

    document.getElementById("activeUsers").textContent =
        Number(stats.active_users ?? 0).toLocaleString();

    document.getElementById("suspendedUsers").textContent =
        Number(stats.suspended_users ?? 0).toLocaleString();

    document.getElementById("adminUsers").textContent =
        Number(stats.admin_users ?? 0).toLocaleString();
}

function renderUsers(users) {
    if (!Array.isArray(users) || users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    No users found.
                </td>
            </tr>
        `;

        resultsCount.textContent = "0 users found";
        return;
    }

    resultsCount.textContent =
        `${users.length} user${users.length === 1 ? "" : "s"} found`;

    tableBody.innerHTML = users.map(user => {
        const id = String(user.id ?? "");
        const firstName = String(user.first_name ?? "");
        const lastName = String(user.last_name ?? "");
        const fullName = `${firstName} ${lastName}`.trim() || "Unnamed user";

        const role = String(user.role ?? "participant");
        const status = String(user.status ?? "unknown");

        const isAdmin = role === "admin";
        const isActive = status === "active";

        const statusClass = isActive
            ? "badge-active"
            : status === "suspended"
                ? "badge-suspended"
                : "";

        const roleClass = isAdmin ? "badge-admin" : "badge-role";

        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar">
                            ${escapeHtml(getInitials(firstName, lastName))}
                        </div>

                        <div>
                            <div class="user-name">
                                ${escapeHtml(fullName)}
                            </div>

                            <div class="user-id">
                                ${escapeHtml(id)}
                            </div>
                        </div>
                    </div>
                </td>

                <td>
                    <div class="contact-email">
                        ${escapeHtml(user.email || "—")}
                    </div>

                    <div class="contact-phone">
                        ${escapeHtml(user.phone || "No phone")}
                    </div>
                </td>

                <td>
                    <span class="badge ${roleClass}">
                        ${escapeHtml(role)}
                    </span>
                </td>

                <td>
                    <span class="badge ${statusClass}">
                        ${escapeHtml(status)}
                    </span>
                </td>

                <td>${formatDate(user.created_at)}</td>

                <td>
                    <div class="action-group">
                        <button
                            type="button"
                            class="btn-action"
                            data-action="toggle-status"
                            data-id="${escapeHtml(id)}"
                            data-status="${isActive ? "suspended" : "active"}"
                            ${isAdmin ? "disabled" : ""}
                            title="${isActive ? "Suspend user" : "Activate user"}"
                        >
                            ${isActive ? "Suspend" : "Activate"}
                        </button>

                        <button
                            type="button"
                            class="btn-action danger"
                            data-action="delete"
                            data-id="${escapeHtml(id)}"
                            ${isAdmin ? "disabled" : ""}
                            title="Delete user"
                        >
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

async function loadUsers() {
    const currentVersion = ++requestVersion;

    if (requestController) {
        requestController.abort();
    }

    requestController = new AbortController();

    const params = new URLSearchParams({
        search: searchInput.value.trim(),
        role: roleFilter.value,
        status: statusFilter.value
    });

    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="empty-state">Loading users...</td>
        </tr>
    `;

    resultsCount.textContent = "Loading...";

    refreshBtn.disabled = true;
    hideMessage();

    try {
        const result = await apiRequest(
            `${USERS_API}/admin-index.php?${params.toString()}`,
            { signal: requestController.signal }
        );

        if (currentVersion !== requestVersion) return;

        renderStats(result.data.stats);
        renderUsers(result.data.users);

    } catch (error) {
        if (error.name === "AbortError") return;
        if (currentVersion !== requestVersion) return;

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    Could not load users.
                </td>
            </tr>
        `;

        resultsCount.textContent = "Loading failed";
        showMessage(error.message, "error");

    } finally {
        if (currentVersion === requestVersion) {
            refreshBtn.disabled = false;
        }
    }
}

async function updateUserStatus(id, status) {
    const actionText = status === "active"
        ? "activate"
        : "suspend";

    if (!confirm(`Are you sure you want to ${actionText} this user?`)) {
        return;
    }

    hideMessage();

    try {
        const result = await apiRequest(
            `${USERS_API}/update-status.php`,
            {
                method: "POST",
                body: JSON.stringify({ id, status })
            }
        );

        showMessage(result.message, "success");
        await loadUsers();

    } catch (error) {
        showMessage(error.message, "error");
    }
}

async function deleteUser(id) {
    const confirmed = confirm(
        "Delete this user permanently? This action cannot be undone."
    );

    if (!confirmed) return;

    hideMessage();

    try {
        const result = await apiRequest(
            `${USERS_API}/delete.php`,
            {
                method: "POST",
                body: JSON.stringify({ id })
            }
        );

        showMessage(result.message, "success");
        await loadUsers();

    } catch (error) {
        showMessage(error.message, "error");
    }
}

tableBody.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");

    if (!button || button.disabled) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (!id) return;

    button.disabled = true;

    try {
        if (action === "toggle-status") {
            await updateUserStatus(id, button.dataset.status);
        }

        if (action === "delete") {
            await deleteUser(id);
        }
    } finally {
        button.disabled = false;
    }
});

searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(loadUsers, 300);
});


function openAdminModal() {
    createAdminForm.reset();
    adminFormMessage.hidden = true;
    adminFormMessage.textContent = "";
    adminModal.hidden = false;

    createAdminForm.querySelector('[name="first_name"]').focus();
}

function closeAdminModal() {
    if (saveAdminBtn.disabled) return;

    adminModal.hidden = true;
    createAdminForm.reset();
    adminFormMessage.hidden = true;
}

openAdminModalBtn.addEventListener("click", openAdminModal);
closeAdminModalBtn.addEventListener("click", closeAdminModal);
cancelAdminModalBtn.addEventListener("click", closeAdminModal);

adminModal.addEventListener("click", event => {
    if (event.target === adminModal) {
        closeAdminModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !adminModal.hidden) {
        closeAdminModal();
    }
});

createAdminForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!createAdminForm.reportValidity()) return;

    const formData = new FormData(createAdminForm);

    const payload = {
        first_name: String(formData.get("first_name") || "").trim(),
        last_name: String(formData.get("last_name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        password: String(formData.get("password") || "")
    };

    adminFormMessage.hidden = true;
    saveAdminBtn.disabled = true;
    saveAdminBtn.textContent = "Creating...";

    try {
        const result = await apiRequest(
            `${USERS_API}/create-admin.php`,
            {
                method: "POST",
                body: JSON.stringify(payload)
            }
        );

        adminModal.hidden = true;
        createAdminForm.reset();

        showMessage(
            result.message || "Admin created successfully.",
            "success"
        );

        // Refresh the table and the statistics.
        await loadUsers();

    } catch (error) {
        adminFormMessage.textContent = error.message;
        adminFormMessage.hidden = false;

    } finally {
        saveAdminBtn.disabled = false;
        saveAdminBtn.textContent = "Create Admin";
    }
});

roleFilter.addEventListener("change", loadUsers);
statusFilter.addEventListener("change", loadUsers);
refreshBtn.addEventListener("click", loadUsers);

loadUsers();
