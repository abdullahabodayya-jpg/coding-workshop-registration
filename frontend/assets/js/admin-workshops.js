const API_BASE =
    "http://localhost/code%20registration%20workshop%20website/athar/backend/api";

const ADMIN_WORKSHOPS_API = `${API_BASE}/workshops/admin-index.php`;
const UPDATE_WORKSHOP_API = `${API_BASE}/workshops/update.php`;
const DELETE_WORKSHOP_API = `${API_BASE}/workshops/delete.php`;

const listElement = document.getElementById("workshopsList");
const messageElement = document.getElementById("workshopsMessage");
const editDialog = document.getElementById("editDialog");
const editForm = document.getElementById("editForm");

let workshops = [];

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function showMessage(message, isError = false) {
    messageElement.textContent = message;
    messageElement.classList.toggle("error", isError);
}

async function readJson(response) {
    const text = await response.text();

    try {
        return JSON.parse(text);
    } catch {
        console.error("Invalid API response:", response.url, text);
        throw new Error("The server returned an invalid response.");
    }
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        credentials: "include",
        ...options,
        headers: {
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
    });

    const result = await readJson(response);

    if (response.status === 401 || response.status === 403) {
        throw new Error("Admin session expired. Please log in again.");
    }

    if (!response.ok || !result.success) {
        throw new Error(result.message || "Request failed.");
    }

    return result;
}

function formatDate(value) {
    if (!value) return "Not specified";

    const date = new Date(String(value).replace(" ", "T"));

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}

function renderWorkshopCard(workshop) {
    const image = workshop.image_url || "../assets/images/default-workshop.jpg";
    const status = String(workshop.status || "draft").toLowerCase();

    return `
        <article class="workshop-card">
            <img
                class="workshop-image"
                src="${escapeHtml(image)}"
                alt=""
                loading="lazy"
                onerror="this.onerror=null;this.src='../assets/images/default-workshop.jpg'"
            >

            <div class="workshop-card-content">
                <h3>${escapeHtml(workshop.title)}</h3>

                <span class="status-badge status-${escapeHtml(status)}">
                    ${escapeHtml(status)}
                </span>

                <div class="workshop-meta">
                    <div>${escapeHtml(workshop.location || "Location not specified")}</div>
                    <div>${escapeHtml(formatDate(workshop.start_at))}</div>
                    <div>Capacity: ${escapeHtml(workshop.capacity)}</div>
                    <div>Instructors: ${escapeHtml(workshop.instructor_count)}</div>
                </div>
            </div>

            <div class="workshop-actions">
                <button class="button button-light"
                    type="button" data-edit="${escapeHtml(workshop.id)}">
                    Edit
                </button>

                <button class="button button-light danger-button"
                    type="button" data-delete="${escapeHtml(workshop.id)}">
                    Delete
                </button>
            </div>
        </article>
    `;
}

function updateCounts() {
    document.getElementById("allCount").textContent = workshops.length;

    document.getElementById("publishedCount").textContent =
        workshops.filter(w => w.status === "published").length;

    document.getElementById("draftCount").textContent =
        workshops.filter(w => w.status === "draft").length;
}

function renderWorkshops() {
    const search = document.getElementById("searchInput")
        .value.trim().toLowerCase();

    const status = document.getElementById("statusFilter").value;

    const filtered = workshops.filter(workshop => {
        const matchesSearch = [
            workshop.title,
            workshop.location
        ].some(value => String(value || "").toLowerCase().includes(search));

        const matchesStatus = !status || workshop.status === status;

        return matchesSearch && matchesStatus;
    });

    if (!filtered.length) {
        listElement.innerHTML = `
            <p>No workshops match your search.</p>
        `;
        return;
    }

    listElement.innerHTML = filtered.map(renderWorkshopCard).join("");
}

async function loadWorkshops() {
    const refreshButton = document.getElementById("refreshWorkshops");

    refreshButton.disabled = true;
    showMessage("Loading workshops...");

    try {
        const result = await apiRequest(ADMIN_WORKSHOPS_API);

        workshops = result.data.workshops || [];

        updateCounts();
        renderWorkshops();

        showMessage(`${workshops.length} workshops loaded.`);
    } catch (error) {
        console.error("Load workshops error:", error);
        showMessage(error.message || "Unable to load workshops.", true);
    } finally {
        refreshButton.disabled = false;
    }
}

function toDateTimeLocal(value) {
    if (!value) return "";

    // Convert "YYYY-MM-DD HH:mm:ss" to the value expected by datetime-local.
    return String(value).replace(" ", "T").slice(0, 16);
}

function openEditDialog(id) {
    const workshop = workshops.find(item => item.id === id);

    if (!workshop) return;

    document.getElementById("editId").value = workshop.id;
    document.getElementById("editTitle").value = workshop.title || "";
    document.getElementById("editDescription").value = workshop.description || "";
    document.getElementById("editType").value = workshop.type || "online";
    document.getElementById("editStatus").value = workshop.status || "draft";
    document.getElementById("editLocation").value = workshop.location || "";
    document.getElementById("editImageUrl").value = workshop.image_url || "";
    document.getElementById("editCapacity").value = workshop.capacity || 1;
    document.getElementById("editStartAt").value = toDateTimeLocal(workshop.start_at);
    document.getElementById("editEndAt").value = toDateTimeLocal(workshop.end_at);

    document.getElementById("editMessage").textContent = "";

    editDialog.showModal();
}

async function saveWorkshop(event) {
    event.preventDefault();

    const saveButton = document.getElementById("saveWorkshop");
    const editMessage = document.getElementById("editMessage");

    const payload = {
        id: document.getElementById("editId").value,
        title: document.getElementById("editTitle").value.trim(),
        description: document.getElementById("editDescription").value.trim(),
        type: document.getElementById("editType").value,
        status: document.getElementById("editStatus").value,
        location: document.getElementById("editLocation").value.trim(),
        image_url: document.getElementById("editImageUrl").value.trim(),
        capacity: Number(document.getElementById("editCapacity").value),
        start_at: document.getElementById("editStartAt").value,
        end_at: document.getElementById("editEndAt").value
    };

    saveButton.disabled = true;
    editMessage.classList.remove("error");
    editMessage.textContent = "Saving changes...";

    try {
        await apiRequest(UPDATE_WORKSHOP_API, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        editDialog.close();
        await loadWorkshops();
    } catch (error) {
        editMessage.textContent = error.message || "Unable to save changes.";
        editMessage.classList.add("error");
    } finally {
        saveButton.disabled = false;
    }
}

async function deleteWorkshop(id) {
    const workshop = workshops.find(item => item.id === id);

    if (!workshop) return;

    const confirmed = window.confirm(
        `Delete "${workshop.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
        await apiRequest(DELETE_WORKSHOP_API, {
            method: "POST",
            body: JSON.stringify({ id })
        });

        await loadWorkshops();
    } catch (error) {
        showMessage(error.message || "Unable to delete workshop.", true);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("refreshWorkshops")
        .addEventListener("click", loadWorkshops);

    document.getElementById("searchInput")
        .addEventListener("input", renderWorkshops);

    document.getElementById("statusFilter")
        .addEventListener("change", renderWorkshops);

    listElement.addEventListener("click", event => {
        const editButton = event.target.closest("[data-edit]");
        const deleteButton = event.target.closest("[data-delete]");

        if (editButton) {
            openEditDialog(editButton.dataset.edit);
        }

        if (deleteButton) {
            deleteWorkshop(deleteButton.dataset.delete);
        }
    });

    editForm.addEventListener("submit", saveWorkshop);

    document.getElementById("closeDialog")
        .addEventListener("click", () => editDialog.close());

    document.getElementById("cancelEdit")
        .addEventListener("click", () => editDialog.close());

    loadWorkshops();
});
