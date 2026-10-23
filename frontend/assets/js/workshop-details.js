
const API_URL =
    "http://localhost/code%20registration%20workshop%20website/athar/backend/api/workshops/index.php";

const DEFAULT_IMAGE = "assets/images/default-workshop.jpg";

const pageMessage = document.getElementById("pageMessage");
const workshopContent = document.getElementById("workshopContent");
const registerButton = document.getElementById("registerButton");

function formatDate(value) {
    if (!value) return "To be announced";

    const date = new Date(value.replace(" ", "T"));

    if (Number.isNaN(date.getTime())) {
        return "To be announced";
    }

    return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function formatTime(value) {
    if (!value) return "To be announced";

    const date = new Date(value.replace(" ", "T"));

    if (Number.isNaN(date.getTime())) {
        return "To be announced";
    }

    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    });
}

function setText(id, value, fallback = "To be announced") {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value || fallback;
    }
}

function showError(message) {
    pageMessage.hidden = false;
    pageMessage.classList.add("error");
    pageMessage.textContent = message;
    workshopContent.hidden = true;
}

function setupImage(image, imageUrl, fallbackUrl, altText) {
    image.alt = altText;

    image.onerror = () => {
        image.onerror = null;
        image.src = fallbackUrl;
    };

    image.src = imageUrl || fallbackUrl;
}


function renderInstructor(workshop) {
    const instructorName = workshop.instructor_name || "";
    const instructorBio = workshop.instructor_description;
    const instructorAvatar = document.getElementById("instructorAvatar");

    setText(
        "instructorName",
        instructorName,
        "Instructor details coming soon"
    );

    setText(
        "instructorBio",
        instructorBio,
        "Information about this instructor is not available yet."
    );

    if (instructorAvatar) {
        const initial = instructorName.trim().charAt(0).toUpperCase() || "?";
        const imageUrl = workshop.instructor_image_url;

        instructorAvatar.replaceChildren();
        instructorAvatar.classList.add("instructor-avatar");

        if (imageUrl) {
            const img = document.createElement("img");

            img.src = imageUrl;
            img.alt = instructorName || "Workshop instructor";
            img.onerror = () => {
                // If the image fails, show the default letter avatar.
                img.remove();
                instructorAvatar.textContent = initial;
                instructorAvatar.classList.add("has-initial");
            };

            instructorAvatar.classList.remove("has-initial");
            instructorAvatar.appendChild(img);
        } else {
            // No image? Show the first letter of the instructor's name.
            instructorAvatar.textContent = initial;
            instructorAvatar.classList.add("has-initial");
        }
    }

    const instructorLink = document.getElementById("instructorLink");

    if (instructorLink) {
        if (workshop.instructor_main_link) {
            instructorLink.href = workshop.instructor_main_link;
            instructorLink.hidden = false;
            instructorLink.target = "_blank";
            instructorLink.rel = "noopener noreferrer";
        } else {
            instructorLink.hidden = true;
            instructorLink.removeAttribute("href");
        }
    }
}


function renderWorkshop(workshop) {
    document.title = `${workshop.title} | ATHAR`;

    setText("workshopTitle", workshop.title);
    setText("coverDescription", workshop.description, "");
    setText("workshopDescription", workshop.description);

    setText(
        "coverType",
        workshop.type === "online" ? "Online Workshop" : "On-site Workshop"
    );

    setText("workshopDate", formatDate(workshop.start_at));

    // Display the start and end times.
    const startTime = formatTime(workshop.start_at);
    const endTime = workshop.end_at
        ? formatTime(workshop.end_at)
        : "To be announced";

    setText(
        "workshopTime",
        workshop.end_at
            ? `${startTime} - ${endTime}`
            : startTime
    );

    setText("workshopLocation", workshop.location);

    setText(
        "workshopCapacity",
        Number(workshop.capacity) > 0
            ? `${workshop.capacity} seats`
            : "Not specified"
    );

    // Registration summary
    setText("registrationTitle", workshop.title);

    setText(
        "registrationType",
        workshop.type === "online" ? "Online" : "On-site"
    );

    setText(
        "registrationCapacity",
        Number(workshop.capacity) > 0
            ? `${workshop.capacity} seats`
            : "Not specified"
    );

    // Cover image
    const coverImage = document.getElementById("coverImage");

    setupImage(
        coverImage,
        workshop.image_url,
        DEFAULT_IMAGE,
        `${workshop.title} cover`
    );

    // Real instructor data from the API
    renderInstructor(workshop);

    // Registration is not connected yet.
    registerButton.disabled = true;

    setText(
        "registrationNote",
        "Online registration will be available once the registration system is connected."
    );

    pageMessage.hidden = true;
    workshopContent.hidden = false;
}

async function loadWorkshopDetails() {
    const params = new URLSearchParams(window.location.search);
    const workshopId = params.get("id");

    if (!workshopId) {
        showError(
            "No workshop was selected. Please return to the workshops page."
        );
        return;
    }

    try {
        // Request only the selected workshop.
        const url = `${API_URL}?id=${encodeURIComponent(workshopId)}`;
        const response = await fetch(url);

        if (response.status === 404) {
            showError("Workshop not found. It may no longer be available.");
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !result.data || Array.isArray(result.data)) {
            throw new Error("Invalid API response");
        }

        renderWorkshop(result.data);
    } catch (error) {
        console.error("Failed to load workshop details:", error);

        showError(
            "Unable to load workshop details. Please try again later."
        );
    }
}

function setupMobileNavigation() {
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    if (!menuToggle || !navLinks) return;

    menuToggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("is-open");

        menuToggle.setAttribute("aria-expanded", String(isOpen));

        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation" : "Open navigation"
        );
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const currentYear = document.getElementById("currentYear");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    setupMobileNavigation();
    loadWorkshopDetails();
});
