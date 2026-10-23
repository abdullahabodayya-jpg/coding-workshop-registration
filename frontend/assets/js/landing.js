
const API_URL =
    "http://localhost/code%20registration%20workshop%20website/athar/backend/api/workshops/index.php";
const workshopThemes = [
    {
        theme: "workshop-image-blue",
        code: "</>"
    },
    {
        theme: "workshop-image-lavender",
        code: "PHP"
    },
    {
        theme: "workshop-image-gray",
        code: "SQL"
    },
    {
        theme: "workshop-image-brown",
        code: "JS"
    }
];

function formatWorkshopDate(startAt, endAt) {
    if (!startAt) {
        return "Date to be announced";
    }

    const startDate = new Date(startAt.replace(" ", "T"));

    if (Number.isNaN(startDate.getTime())) {
        return "Date to be announced";
    }

    const dateOptions = {
        year: "numeric",
        month: "short",
        day: "numeric"
    };

    const formattedDate = startDate.toLocaleDateString(
        "en-US",
        dateOptions
    );

    if (!endAt) {
        return formattedDate;
    }

    const endDate = new Date(endAt.replace(" ", "T"));

    if (
        Number.isNaN(endDate.getTime()) ||
        startDate.toDateString() !== endDate.toDateString()
    ) {
        return formattedDate;
    }

    const timeOptions = {
        hour: "numeric",
        minute: "2-digit"
    };

    const startTime = startDate.toLocaleTimeString(
        "en-US",
        timeOptions
    );

    const endTime = endDate.toLocaleTimeString(
        "en-US",
        timeOptions
    );

    return `${formattedDate} · ${startTime} - ${endTime}`;
}

function mapWorkshop(apiWorkshop, index) {
    const theme = workshopThemes[index % workshopThemes.length];

    return {
        id: apiWorkshop.id,
        title: apiWorkshop.title,
        category: getWorkshopCategory(apiWorkshop.title),
        date: formatWorkshopDate(
            apiWorkshop.start_at,
            apiWorkshop.end_at
        ),
        type: apiWorkshop.type === "online" ? "Online" : "On-site",
        description: apiWorkshop.description || "Workshop details coming soon.",
        capacity: Number(apiWorkshop.capacity) > 0
            ? `${apiWorkshop.capacity} seats`
            : "Registration details coming soon",
        theme: theme.theme,
        code: theme.code,
        imageUrl: apiWorkshop.image_url || null
    };
}

function getWorkshopCategory(title = "") {
    const value = title.toLowerCase();

    if (value.includes("python")) return "Python";
    if (value.includes("database") || value.includes("sql")) {
        return "Databases";
    }
    if (value.includes("cybersecurity") || value.includes("security")) {
        return "Cybersecurity";
    }
    if (value.includes("javascript")) return "JavaScript";
    if (value.includes("php") || value.includes("backend")) {
        return "Backend Development";
    }
    if (value.includes("web")) return "Web Development";

    return "Coding Workshop";
}

function createWorkshopCard(workshop) {
    const article = document.createElement("article");
    article.className = "workshop-card";

    const image = document.createElement("div");
    image.className = `workshop-image ${workshop.theme}`;

    if (workshop.imageUrl) {
        const img = document.createElement("img");
        img.src = workshop.imageUrl;
        img.alt = workshop.title;
        img.loading = "lazy";

        img.addEventListener("error", () => {
            img.remove();
        });

        image.append(img);
    }

    const code = document.createElement("span");
    code.className = "workshop-image-code";
    code.textContent = workshop.code;

    const tag = document.createElement("span");
    tag.className = "workshop-tag";
    tag.textContent = workshop.category;

    image.append(code, tag);

    const body = document.createElement("div");
    body.className = "workshop-body";

    const meta = document.createElement("p");
    meta.className = "workshop-meta";
    meta.textContent = `${workshop.date} · ${workshop.type}`;

    const title = document.createElement("h3");
    title.textContent = workshop.title;

    const description = document.createElement("p");
    description.textContent = workshop.description;

    const footer = document.createElement("div");
    footer.className = "workshop-footer";

    const capacity = document.createElement("span");
    capacity.textContent = workshop.capacity;

    const link = document.createElement("a");
    link.href = `workshop-details.html?id=${encodeURIComponent(workshop.id)}`;
    link.textContent = "View details →";
    link.setAttribute(
        "aria-label",
        `View details for ${workshop.title}`
    );

    footer.append(capacity, link);
    body.append(meta, title, description, footer);
    article.append(image, body);

    return article;
}

function showWorkshopMessage(container, headingText, messageText) {
    container.replaceChildren();

    const emptyState = document.createElement("div");
    emptyState.className = "workshop-empty";

    const heading = document.createElement("h3");
    heading.textContent = headingText;

    const message = document.createElement("p");
    message.textContent = messageText;

    emptyState.append(heading, message);
    container.append(emptyState);
}

function renderWorkshops(workshops) {
    const container = document.getElementById("upcomingWorkshops");

    if (!container) {
        return;
    }

    container.replaceChildren();

    if (workshops.length === 0) {
        showWorkshopMessage(
            container,
            "No upcoming workshops yet",
            "Check back soon to discover new learning opportunities."
        );
        return;
    }

    workshops.slice(0, 3).forEach((workshop) => {
        container.append(createWorkshopCard(workshop));
    });
}

async function loadWorkshops() {
    const container = document.getElementById("upcomingWorkshops");

    if (!container) {
        return;
    }

    showWorkshopMessage(
        container,
        "Loading workshops...",
        "Please wait while we fetch the latest workshops."
    );

    try {
        const response = await fetch(API_URL);
                const responseText = await response.text();

                console.log("API status:", response.status);
                console.log("API response:", responseText);

                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }

                let result;

                try {
                    result = JSON.parse(responseText);
                } catch {
                    throw new Error(
                        "API did not return valid JSON. Check the console response."
                    );
                }

        if (!result.success || !Array.isArray(result.data)) {
            throw new Error("Invalid API response.");
        }

        const workshops = result.data.map(mapWorkshop);
        renderWorkshops(workshops);

    } catch (error) {
        console.error("Failed to load workshops:", error);

        showWorkshopMessage(
            container,
            "Unable to load workshops",
            "Please try again later."
        );
    }
}

function setupMobileNavigation() {
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    if (!menuToggle || !navLinks) {
        return;
    }

    menuToggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("is-open");

        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation" : "Open navigation"
        );
    });

    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("is-open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation");
        });
    });

    document.addEventListener("click", (event) => {
        if (
            !navLinks.contains(event.target) &&
            !menuToggle.contains(event.target)
        ) {
            navLinks.classList.remove("is-open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation");
        }
    });
}

function setupCurrentYear() {
    const yearElement = document.getElementById("currentYear");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadWorkshops();
    setupMobileNavigation();
    setupCurrentYear();
});
