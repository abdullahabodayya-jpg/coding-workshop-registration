const API_BASE = "../../backend/api";

const form = document.getElementById("workshopForm");
const instructorList = document.getElementById("instructorList");
const instructorSearch = document.getElementById("instructorSearch");
const instructorCount = document.getElementById("instructorCount");
const formMessage = document.getElementById("formMessage");

const typeInput = document.getElementById("type");
const locationInput = document.getElementById("location");
const startInput = document.getElementById("start_at");
const endInput = document.getElementById("end_at");
const capacityInput = document.getElementById("capacity");

const saveDraftBtn = document.getElementById("saveDraftBtn");
const publishBtn = document.getElementById("publishBtn");

let instructors = [];
let isSubmitting = false;

function showMessage(message, type = "") {
    formMessage.textContent = message;
    formMessage.className = "form-message";

    if (type) {
        formMessage.classList.add(type);
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}

/**
 * Read the response as text first so PHP warnings, HTML errors,
 * and invalid JSON can be diagnosed from the browser console.
 */
async function readApiResponse(response) {
    const responseText = await response.text();

    let result;

    try {
        result = JSON.parse(responseText);
    } catch (error) {
        console.error("Invalid JSON response from API:", {
            url: response.url,
            status: response.status,
            body: responseText
        });

        throw new Error(
            `The server returned an invalid response (HTTP ${response.status}). Check the console and Network tab.`
        );
    }

    if (!response.ok || result.success !== true) {
        throw new Error(
            result.message ||
            `The request failed (HTTP ${response.status}).`
        );
    }

    return result;
}

function updateLocationRequirement() {
    const isOnsite = typeInput.value === "onsite";

    locationInput.required = isOnsite;

    document.getElementById("locationHint").textContent = isOnsite
        ? "Required for onsite workshops."
        : "Optional for online workshops.";
}

function renderInstructors() {
    const query = instructorSearch.value.trim().toLowerCase();

    const filtered = instructors.filter((instructor) => {
        return String(instructor.name ?? "")
            .toLowerCase()
            .includes(query);
    });

    if (filtered.length === 0) {
        instructorList.innerHTML = `
            <p class="form-hint">
                ${instructors.length === 0
                    ? "No instructors are available yet."
                    : "No instructors match your search."}
            </p>
        `;

        updateInstructorCount();
        return;
    }

    instructorList.innerHTML = filtered.map((instructor) => {
        const selected = form.querySelector(
            `input[name="instructor_ids[]"][value="${CSS.escape(String(instructor.id))}"]`
        )?.checked ?? false;

        const name = String(instructor.name ?? "");
        const initial = escapeHTML(name.trim().charAt(0).toUpperCase());

        const avatar = instructor.image_url
            ? `<img
                    src="${escapeHTML(instructor.image_url)}"
                    alt=""
                    loading="lazy"
                    referrerpolicy="no-referrer"
               >`
            : initial;

        const description = instructor.description
            ? escapeHTML(instructor.description)
            : "ATHAR instructor";

        return `
            <label class="instructor-option ${selected ? "selected" : ""}">
                <input
                    type="checkbox"
                    name="instructor_ids[]"
                    value="${escapeHTML(instructor.id)}"
                    ${selected ? "checked" : ""}
                >

                <span class="instructor-avatar">${avatar}</span>

                <span class="instructor-info">
                    <strong>${escapeHTML(name)}</strong>
                    <small>${description}</small>
                </span>
            </label>
        `;
    }).join("");

    updateInstructorCount();
}

function updateInstructorCount() {
    const count = form.querySelectorAll(
        'input[name="instructor_ids[]"]:checked'
    ).length;

    instructorCount.textContent = count === 0
        ? "No instructors selected."
        : `${count} instructor${count === 1 ? "" : "s"} selected.`;
}

async function loadInstructors() {
    instructorList.innerHTML =
        '<p class="form-hint">Loading instructors...</p>';

    try {
        const response = await fetch(
            `${API_BASE}/workshops/form-data.php`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json"
                }
            }
        );

        const result = await readApiResponse(response);

        const loadedInstructors = result.data?.instructors;

        if (!Array.isArray(loadedInstructors)) {
            throw new Error(
                "The API response does not contain a valid instructors list."
            );
        }

        instructors = loadedInstructors;

        renderInstructors();
    } catch (error) {
        console.error("Instructor loading error:", error);

        instructorList.innerHTML = `
            <p class="form-hint">
                Unable to load instructors.
                Check the browser console for details.
            </p>
        `;
    }
}

function getSelectedInstructorIds() {
    return Array.from(
        form.querySelectorAll('input[name="instructor_ids[]"]:checked')
    ).map((input) => input.value);
}

function validateForm() {
    const start = startInput.value;
    const end = endInput.value;
    const capacity = capacityInput.value.trim();

    if (start && !end) {
        showMessage(
            "Enter the end date and time when providing a start date.",
            "error"
        );
        endInput.focus();
        return false;
    }

    if (end && !start) {
        showMessage(
            "Enter the start date and time when providing an end date.",
            "error"
        );
        startInput.focus();
        return false;
    }

    if (start && end && new Date(end) <= new Date(start)) {
        showMessage(
            "The end date and time must be after the start.",
            "error"
        );
        endInput.focus();
        return false;
    }

    if (
        capacity !== "" &&
        (!Number.isSafeInteger(Number(capacity)) || Number(capacity) < 1)
    ) {
        showMessage(
            "Capacity must be a positive whole number.",
            "error"
        );
        capacityInput.focus();
        return false;
    }

    return true;
}

async function submitWorkshop(event) {
    event.preventDefault();

    if (isSubmitting) {
        return;
    }

    showMessage("");

    if (!form.reportValidity() || !validateForm()) {
        return;
    }

    const submitter = event.submitter;
    const intent = submitter?.value;

    if (!["draft", "published"].includes(intent)) {
        showMessage(
            "Choose whether to save a draft or publish.",
            "error"
        );
        return;
    }

    const payload = {
        title: form.elements.title.value.trim(),
        description: form.elements.description.value.trim(),
        type: typeInput.value,
        capacity: capacityInput.value.trim() === ""
            ? null
            : Number(capacityInput.value),
        start_at: startInput.value || null,
        end_at: endInput.value || null,
        location: locationInput.value.trim() || null,
        image_url: form.elements.image_url.value.trim() || null,
        agenda_file: form.elements.agenda_file.value.trim() || null,
        instructor_ids: getSelectedInstructorIds(),
        status: intent
    };

    isSubmitting = true;
    saveDraftBtn.disabled = true;
    publishBtn.disabled = true;

    showMessage(
        intent === "draft"
            ? "Saving your draft..."
            : "Publishing your workshop..."
    );

    try {
        const response = await fetch(
            `${API_BASE}/workshops/create.php`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify(payload)
            }
        );

        const result = await readApiResponse(response);

        showMessage(
            result.message || "Workshop created successfully.",
            "success"
        );

        form.reset();

        updateLocationRequirement();
        renderInstructors();
    } catch (error) {
        console.error("Workshop creation error:", error);

        showMessage(
            error.message || "An unexpected error occurred.",
            "error"
        );
    } finally {
        isSubmitting = false;
        saveDraftBtn.disabled = false;
        publishBtn.disabled = false;
    }
}

typeInput.addEventListener("change", updateLocationRequirement);

instructorSearch.addEventListener("input", renderInstructors);

instructorList.addEventListener("change", (event) => {
    if (event.target.matches('input[name="instructor_ids[]"]')) {
        event.target
            .closest(".instructor-option")
            ?.classList.toggle("selected", event.target.checked);

        updateInstructorCount();
    }
});

form.addEventListener("submit", submitWorkshop);

updateLocationRequirement();
loadInstructors();