const ACCOMPLISHMENTS_API =
    "http://localhost/code%20registration%20workshop%20website/athar/backend/api/users/accomplishments.php";

document.addEventListener("DOMContentLoaded", () => {
    const year = document.getElementById("currentYear");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    loadAccomplishments();
});

async function loadAccomplishments() {
    const message = document.getElementById("accomplishmentsMessage");
    const list = document.getElementById("registrationList");

    message.hidden = true;
    list.replaceChildren();

    try {
        const response = await fetch(ACCOMPLISHMENTS_API, {
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
                result.message || "Could not load your workshop history."
            );
        }

        const { summary, registrations } = result.data;

        document.getElementById("confirmedCount").textContent =
            summary.confirmed_registrations;

        document.getElementById("completedCount").textContent =
            summary.completed_workshops;

        if (registrations.length === 0) {
            showMessage(
                "You haven't registered for any workshops yet.",
                "info"
            );
            return;
        }

        registrations.forEach(registration => {
            list.appendChild(createRegistrationCard(registration));
        });

    } catch (error) {
        showMessage(
            error.message || "Unable to connect to the server.",
            "error"
        );
    }
}

function createRegistrationCard(registration) {
    const card = document.createElement("article");
    card.className = "registration-card";

    // Workshop image and fallback
    const imageWrapper = document.createElement("div");
    imageWrapper.className = "workshop-image-wrapper";

    const image = document.createElement("img");
    image.className = "workshop-image";
    image.alt = registration.title || "Workshop";
    image.hidden = true;

    const placeholder = document.createElement("div");
    placeholder.className = "workshop-image-placeholder";

    const placeholderIcon = document.createElement("span");
    placeholderIcon.className = "certificate-icon";
    placeholderIcon.textContent =
        registration.workshop_status === "completed" &&
        registration.registration_status === "confirmed"
            ? "✦"
            : "✧";

    const placeholderTitle = document.createElement("span");
    placeholderTitle.className = "placeholder-brand";
    placeholderTitle.textContent = "ATHAR";

    const placeholderLabel = document.createElement("strong");
    const isCompleted =
        registration.workshop_status === "completed" &&
        registration.registration_status === "confirmed";

    placeholderLabel.textContent = isCompleted
        ? "CERTIFIED"
        : "WORKSHOP";

    const placeholderSubtitle = document.createElement("span");
    placeholderSubtitle.className = "placeholder-subtitle";
    placeholderSubtitle.textContent = isCompleted
        ? "WORKSHOP COMPLETED"
        : "LEARNING & GROWTH";

    placeholder.append(
        placeholderIcon,
        placeholderTitle,
        placeholderLabel,
        placeholderSubtitle
    );

    imageWrapper.append(image, placeholder);

    function showPlaceholder() {
        image.hidden = true;
        placeholder.hidden = false;
    }

    image.addEventListener("error", showPlaceholder);

    if (registration.image_url) {
        image.src = registration.image_url;
        image.hidden = false;
        placeholder.hidden = true;
    } else {
        showPlaceholder();
    }

    // Workshop details
    const content = document.createElement("div");
    content.className = "registration-content";

    const title = document.createElement("h3");
    title.textContent = registration.title || "Untitled Workshop";

    const date = document.createElement("p");
    date.className = "workshop-date";
    date.textContent = formatDate(
        registration.start_at || registration.registered_at
    );

    const location = document.createElement("p");
    location.className = "workshop-location";
    location.textContent =
        registration.location ||
        (registration.type === "online"
            ? "Online"
            : "Location not specified");

    const status = document.createElement("span");
    status.className = "registration-status";

    if (registration.registration_status === "cancelled") {
        status.textContent = "Registration Cancelled";
        status.classList.add("status-cancelled");
    } else if (isCompleted) {
        status.textContent = "Workshop Completed";
        status.classList.add("status-completed");
    } else {
        status.textContent = "Registration Confirmed";
        status.classList.add("status-confirmed");
    }

    const registeredDate = document.createElement("p");
    registeredDate.className = "registered-date";
    registeredDate.textContent =
        `Registered on ${formatDate(registration.registered_at)}`;

    const detailsLink = document.createElement("a");
    detailsLink.className = "details-link";
    detailsLink.href =
        `workshop-details.html?id=${encodeURIComponent(registration.workshop_id)}`;
    detailsLink.textContent = "View Workshop →";

    content.append(
        title,
        date,
        location,
        status,
        registeredDate,
        detailsLink
    );

    card.append(imageWrapper, content);

    return card;
}

function formatDate(value) {
    if (!value) return "Date not specified";

    const date = new Date(value.replace(" ", "T"));

    if (Number.isNaN(date.getTime())) {
        return "Date not specified";
    }

    return date.toLocaleDateString("en", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function showMessage(text, type) {
    const message = document.getElementById("accomplishmentsMessage");

    message.textContent = text;
    message.className = `accomplishments-message ${type}`;
    message.hidden = false;
}