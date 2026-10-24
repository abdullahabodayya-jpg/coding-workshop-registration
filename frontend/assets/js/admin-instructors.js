
"use strict";

const API_BASE = "../../backend/api";

const formSection = document.getElementById("instructorFormSection");
const form = document.getElementById("instructorForm");
const formTitle = document.getElementById("formTitle");
const instructorId = document.getElementById("instructorId");
const instructorName = document.getElementById("instructorName");
const instructorDescription = document.getElementById("instructorDescription");
const instructorLink = document.getElementById("instructorLink");
const instructorImage = document.getElementById("instructorImage");
const saveButton = document.getElementById("saveInstructorBtn");
const cancelButton = document.getElementById("cancelFormBtn");
const addButton = document.getElementById("addInstructorBtn");
const formMessage = document.getElementById("formMessage");
const pageMessage = document.getElementById("pageMessage");
const searchInput = document.getElementById("instructorSearch");
const container = document.getElementById("instructorsContainer");
const totalInstructors = document.getElementById("totalInstructors");

let instructors = [];
let isSaving = false;

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
        credentials: "include",
        ...options,
        headers: {
            ...(options.body
                ? { "Content-Type": "application/json" }
                : {}),
            ...options.headers
        }
    });

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error(
            `The server returned an invalid response (HTTP ${response.status}).`
        );
    }

    if (!response.ok || result.success !== true) {
        throw new Error(
            result.message || `Request failed (HTTP ${response.status}).`
        );
    }

    return result;
}

function setMessage(element, message, type = "") {
    element.textContent = message;
    element.className = element === formMessage
        ? `form-message ${type}`
        : `page-message ${type}`;
}

function resetForm() {
    form.reset();
    instructorId.value = "";
    formTitle.textContent = "Add instructor";
    saveButton.textContent = "Save instructor";
    setMessage(formMessage, "");
    formSection.hidden = true;
}

function openCreateForm() {
    resetForm();
    formTitle.textContent = "Add instructor";
    formSection.hidden = false;
    instructorName.focus();
}

function openEditForm(instructor) {
    resetForm();

    instructorId.value = instructor.id;
    instructorName.value = instructor.name ?? "";
    instructorDescription.value = instructor.description ?? "";
    instructorLink.value = instructor.main_link ?? "";
    instructorImage.value = instructor.image_url ?? "";

    formTitle.textContent = "Edit instructor";
    saveButton.textContent = "Update instructor";
    formSection.hidden = false;
    formSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
    instructorName.focus();
}

function addTextElement(parent, tagName, className, text) {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    element.textContent = text;
    parent.appendChild(element);

    return element;
}

function isSafeWebUrl(value) {
    if (!value) return true;

    try {
        const url = new URL(value);

        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

function renderInstructors() {
    const query = searchInput.value.trim().toLocaleLowerCase();

    const filtered = instructors.filter((instructor) => {
        const name = (instructor.name ?? "").toLocaleLowerCase();
        const description = (instructor.description ?? "")
            .toLocaleLowerCase();

        return name.includes(query) || description.includes(query);
    });

    container.replaceChildren();

    if (filtered.length === 0) {
        addTextElement(
            container,
            "p",
            "empty-state",
            instructors.length === 0
                ? "No instructors yet. Add your first instructor."
                : "No instructors match your search."
        );
        return;
    }

    filtered.forEach((instructor) => {
        const card = document.createElement("article");
        card.className = "instructor-card";

        if (isSafeWebUrl(instructor.image_url) && instructor.image_url) {
            const image = document.createElement("img");

            image.src = instructor.image_url;
            image.alt = instructor.name || "Instructor";
            image.loading = "lazy";
            image.referrerPolicy = "no-referrer";

            image.addEventListener("error", () => {
                const avatar = document.createElement("div");
                avatar.className = "instructor-avatar";
                avatar.textContent = (instructor.name || "?")
                    .trim()
                    .charAt(0)
                    .toUpperCase();

                image.replaceWith(avatar);
            }, { once: true });

            card.appendChild(image);
        } else {
            addTextElement(
                card,
                "div",
                "instructor-avatar",
                (instructor.name || "?").trim().charAt(0).toUpperCase()
            );
        }

        const body = document.createElement("div");
        body.className = "instructor-card-body";

        addTextElement(
            body,
            "h3",
            "",
            instructor.name || "Unnamed instructor"
        );

        addTextElement(
            body,
            "p",
            "instructor-description",
            instructor.description || "No description provided."
        );

        if (isSafeWebUrl(instructor.main_link) && instructor.main_link) {
            const link = document.createElement("a");

            link.className = "instructor-link";
            link.href = instructor.main_link;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = "Visit main link";

            body.appendChild(link);
        }

        const actions = document.createElement("div");
        actions.className = "instructor-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "button button-light";
        editButton.textContent = "Edit";
        editButton.addEventListener(
            "click",
            () => openEditForm(instructor)
        );

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "button button-light";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener(
            "click",
            () => deleteInstructor(instructor)
        );

        actions.append(editButton, deleteButton);
        body.appendChild(actions);
        card.appendChild(body);
        container.appendChild(card);
    });
}

async function loadInstructors() {
    container.replaceChildren();

    addTextElement(
        container,
        "p",
        "empty-state",
        "Loading instructors..."
    );

    setMessage(pageMessage, "");

    try {
        const result = await apiRequest("instructors/list.php");

        if (!Array.isArray(result.data?.instructors)) {
            throw new Error("The server response has an unexpected format.");
        }

        instructors = result.data.instructors;
        totalInstructors.textContent = String(instructors.length);

        renderInstructors();
    } catch (error) {
        instructors = [];
        totalInstructors.textContent = "—";
        container.replaceChildren();

        setMessage(pageMessage, error.message, "message-error");

        addTextElement(
            container,
            "p",
            "empty-state",
            "Unable to load instructors."
        );
    }
}

async function deleteInstructor(instructor) {
    const confirmed = window.confirm(
        `Delete "${instructor.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
        const result = await apiRequest("instructors/delete.php", {
            method: "POST",
            body: JSON.stringify({ id: instructor.id })
        });

        setMessage(pageMessage, result.message, "message-success");

        await loadInstructors();
    } catch (error) {
        setMessage(pageMessage, error.message, "message-error");
    }
}

addButton.addEventListener("click", openCreateForm);
cancelButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", renderInstructors);

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSaving) return;

    const name = instructorName.value.trim();
    const description = instructorDescription.value.trim();
    const mainLink = instructorLink.value.trim();
    const imageUrl = instructorImage.value.trim();
    const id = instructorId.value.trim();

    if (!name) {
        setMessage(
            formMessage,
            "Instructor name is required.",
            "message-error"
        );
        return;
    }

    if (!isSafeWebUrl(mainLink) || !isSafeWebUrl(imageUrl)) {
        setMessage(
            formMessage,
            "Links must be valid HTTP or HTTPS URLs.",
            "message-error"
        );
        return;
    }

    const payload = {
        name,
        description: description || null,
        main_link: mainLink || null,
        image_url: imageUrl || null
    };

    const endpoint = id
        ? "instructors/update.php"
        : "instructors/create.php";

    if (id) {
        payload.id = id;
    }

    isSaving = true;
    saveButton.disabled = true;
    cancelButton.disabled = true;
    saveButton.textContent = id ? "Updating..." : "Saving...";

    try {
        const result = await apiRequest(endpoint, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        resetForm();

        setMessage(
            pageMessage,
            result.message,
            "message-success"
        );

        searchInput.value = "";

        await loadInstructors();
    } catch (error) {
        setMessage(formMessage, error.message, "message-error");
    } finally {
        isSaving = false;
        saveButton.disabled = false;
        cancelButton.disabled = false;

        saveButton.textContent = instructorId.value
            ? "Update instructor"
            : "Save instructor";
    }
});

loadInstructors();
