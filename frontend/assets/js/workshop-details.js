const API_URL =
    "http://localhost/code%20registration%20workshop%20website/athar/backend/api/workshops/index.php";

const DETAILS_AUTH_API  =
    "http://localhost/code%20registration%20workshop%20website/athar/backend/api/auth";
const REGISTRATION_API =
    "http://localhost/code%20registration%20workshop%20website/athar/backend/api/registrations/index.php";


const DEFAULT_IMAGE = "assets/images/default-workshop.jpg";

const pageMessage = document.getElementById("pageMessage");
const workshopContent = document.getElementById("workshopContent");
const registerButton = document.getElementById("registerButton");

const cancelPopup = document.getElementById("cancelPopup");
const keepBookingButton = document.getElementById("keepBookingButton");
const confirmCancelButton = document.getElementById("confirmCancelButton");

function formatDate(value) {
    if (!value) return "To be announced";

    const date = new Date(value.replace(" ", "T"));

    if (Number.isNaN(date.getTime())) return "To be announced";

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

    if (Number.isNaN(date.getTime())) return "To be announced";

    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    });
}

function setText(id, value, fallback = "To be announced") {
    const element = document.getElementById(id);

    if (element) element.textContent = value || fallback;
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

    setText("instructorName", instructorName, "Instructor details coming soon");

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
                img.remove();
                instructorAvatar.textContent = initial;
                instructorAvatar.classList.add("has-initial");
            };

            instructorAvatar.classList.remove("has-initial");
            instructorAvatar.appendChild(img);
        } else {
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

    const startTime = formatTime(workshop.start_at);
    const endTime = workshop.end_at
        ? formatTime(workshop.end_at)
        : "To be announced";

    setText(
        "workshopTime",
        workshop.end_at ? `${startTime} - ${endTime}` : startTime
    );

    setText("workshopLocation", workshop.location);

    setText(
        "workshopCapacity",
        Number(workshop.capacity) > 0
            ? `${workshop.capacity} seats`
            : "Not specified"
    );

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

    const coverImage = document.getElementById("coverImage");

    setupImage(
        coverImage,
        workshop.image_url,
        DEFAULT_IMAGE,
        `${workshop.title} cover`
    );

    renderInstructor(workshop);

    
        registerButton.disabled = true;

            const workshopId = new URLSearchParams(window.location.search).get("id");

            if (workshopId) {
                loadRegistrationStatus(workshopId);
            }


    pageMessage.hidden = true;
    workshopContent.hidden = false;
}

async function loadRegistrationStatus(workshopId) {
    try {
        const response = await fetch(
            `${REGISTRATION_API}?workshop_id=${encodeURIComponent(workshopId)}`,
            { credentials: "include" }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to load registration status.");
        }

        const { registered, capacity, remaining_seats } = result.data;

        setText(
            "registrationCapacity",
            capacity > 0 ? `${remaining_seats} seats available` : "Not specified"
        );

        if (registered) {
        registerButton.disabled = false;
        registerButton.textContent = "Cancel Registration";
        registerButton.onclick = openCancelPopup;
            setText("registrationNote", "You're already registered for this workshop.");
        } else if (capacity > 0 && remaining_seats === 0) {
            registerButton.disabled = true;
            registerButton.textContent = "Workshop Full";
            setText("registrationNote", "There are no seats available.");
        } else {
            registerButton.disabled = false;
            registerButton.textContent = "Register for Workshop";
            registerButton.onclick = registerForWorkshop;
            setText("registrationNote", "Reserve your place in this workshop.");
        }
    } catch (error) {
        console.error("Registration status error:", error);
        showToast("Couldn't load registration status.", "error");
    }
}

async function loadWorkshopDetails() {
    const params = new URLSearchParams(window.location.search);
    const workshopId = params.get("id");

    if (!workshopId) {
        showError("No workshop was selected. Please return to the workshops page.");
        return;
    }

    try {
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
        showError("Unable to load workshop details. Please try again later.");
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

async function checkLogin() {
    try {
        const response = await fetch(`${DETAILS_AUTH_API}/me.php`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) return false;

        const result = await response.json();
        return result.success === true && Boolean(result.data?.id);
    } catch (error) {
        console.error("Failed to check login:", error);
        return false;
    }
}


async function initializePage() {
    const currentYear = document.getElementById("currentYear");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    try {
        const response = await fetch(`${DETAILS_AUTH_API}/me.php`, {
            credentials: "include"
        });

        if (response.status === 401) {
            const returnTo =
                window.location.pathname.split("/").pop() +
                window.location.search;

            window.location.href =
                `login.html?returnTo=${encodeURIComponent(returnTo)}`;

            return;
        }

        if (!response.ok) {
            showError("Unable to verify your login. Please refresh the page.");
            return;
        }

        const result = await response.json();

        if (!result.success || !result.data?.id) {
            const returnTo =
                window.location.pathname.split("/").pop() +
                window.location.search;

            window.location.href =
                `login.html?returnTo=${encodeURIComponent(returnTo)}`;

            return;
        }

        await loadWorkshopDetails();

    } catch (error) {
        console.error("Page initialization failed:", error);
        showError("Unable to connect. Please refresh the page.");
    }
}

function showToast(message, type = "success") {
    let toast = document.getElementById("atharToast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "atharToast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");

        Object.assign(toast.style, {
            position: "fixed",
            right: "24px",
            bottom: "24px",
            zIndex: "9999",
            maxWidth: "min(380px, calc(100vw - 32px))",
            padding: "16px 20px",
            borderRadius: "12px",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "600",
            boxShadow: "0 8px 28px rgba(0,0,0,.18)",
            opacity: "0",
            transform: "translateY(12px)",
            transition: "opacity .25s ease, transform .25s ease"
        });

        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.background = type === "error" ? "#b42318" : "#18794e";
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    clearTimeout(toast.hideTimer);

    toast.hideTimer = setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(12px)";
    }, 3500);
}

async function registerForWorkshop() {
    const params = new URLSearchParams(window.location.search);
    const workshopId = params.get("id");

    if (!workshopId) {
        showToast("Workshop ID is missing.", "error");
        return;
    }

    registerButton.disabled = true;

    try {
        const response = await fetch(REGISTRATION_API, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                workshop_id: workshopId
            })
        });

        const result = await response.json();

        if (response.status === 401) {
            const returnTo =
                `workshop-details.html?id=${encodeURIComponent(workshopId)}`;

            window.location.href =
                `login.html?returnTo=${encodeURIComponent(returnTo)}`;

            return;
        }

        if (!response.ok || !result.success) {
            showToast(result.message || "Registration failed.", "error");
            return;
        }

        registerButton.textContent = "Registered Successfully";

        setText(
            "registrationNote",
            "Your registration has been confirmed."
        );

        showToast(result.message || "Registration successful!");

        await loadRegistrationStatus(workshopId);

    } catch (error) {
        console.error("Registration failed:", error);
        showToast("Unable to complete registration. Please try again.", "error");
    } finally {
            if (
                registerButton.textContent !== "Registered Successfully" &&
                registerButton.textContent !== "Registered ✓" &&
                registerButton.textContent !== "Workshop Full"
            ) {
                registerButton.disabled = false;
            }
        }
}

function openCancelPopup() {
    cancelPopup.hidden = false;
    keepBookingButton.focus();
}

function closeCancelPopup() {
    cancelPopup.hidden = true;
}

keepBookingButton.addEventListener("click", closeCancelPopup);

cancelPopup.addEventListener("click", (event) => {
    if (event.target === cancelPopup) {
        closeCancelPopup();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !cancelPopup.hidden) {
        closeCancelPopup();
    }
});

async function cancelRegistration() {
    const workshopId = new URLSearchParams(
        window.location.search
    ).get("id");

    if (!workshopId) {
        showToast("Workshop ID is missing.", "error");
        return;
    }

    confirmCancelButton.disabled = true;
    confirmCancelButton.textContent = "Cancelling...";

    try {
        const response = await fetch(REGISTRATION_API, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "cancel",
                workshop_id: workshopId
            })
        });

        const result = await response.json();

        if (response.status === 401) {
            window.location.href =
                `login.html?returnTo=${encodeURIComponent(window.location.href)}`;
            return;
        }

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Failed to cancel registration."
            );
        }

        closeCancelPopup();

        showToast(
            "Your registration has been cancelled.",
            "success"
        );

        await loadRegistrationStatus(workshopId);

    } catch (error) {
        console.error("Cancel registration error:", error);
        showToast(error.message, "error");
    } finally {
        confirmCancelButton.disabled = false;
        confirmCancelButton.textContent = "Cancel Booking";
    }
}

confirmCancelButton.addEventListener("click", cancelRegistration);

// registerButton.addEventListener("click", registerForWorkshop);


document.addEventListener("DOMContentLoaded", initializePage);
