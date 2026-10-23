const API_URL =
    "http://localhost/code%20registration%20workshop%20website/athar/backend/api/workshops/index.php";

const workshopContainer = document.getElementById("allWorkshops");
const searchInput = document.getElementById("workshopSearch");
const typeFilter = document.getElementById("workshopType");
const workshopCount = document.getElementById("workshopCount");

let allWorkshops = [];

const themes = [
    { theme: "workshop-image-blue", code: "</>" },
    { theme: "workshop-image-lavender", code: "PHP" },
    { theme: "workshop-image-gray", code: "SQL" },
    { theme: "workshop-image-brown", code: "JS" }
];

function getCategory(title = "") {
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

function formatDate(dateValue) {
    if (!dateValue) return "Date to be announced";

    const date = new Date(dateValue.replace(" ", "T"));

    if (Number.isNaN(date.getTime())) {
        return "Date to be announced";
    }

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function normalizeWorkshop(workshop, index) {
    const theme = themes[index % themes.length];

    return {
        id: workshop.id,
        title: workshop.title,
        description: workshop.description || "Workshop details coming soon.",
        category: getCategory(workshop.title),
        date: formatDate(workshop.start_at),
        type: workshop.type,
        typeLabel: workshop.type === "online" ? "Online" : "On-site",
        capacity: workshop.capacity != null && workshop.capacity !== ""
                ? `${workshop.capacity} seats`
                : "Capacity to be announced",
        theme: theme.theme,
        code: theme.code,
        imageUrl: workshop.image_url || "assets/images/default-workshop.jpg"
    };
}

function requireLogin(event) {
    // Let logged-in users continue normally.
    if (document.getElementById("logoutButton")) {
        return;
    }

    event.preventDefault();

    const returnTo =
        event.currentTarget.getAttribute("href");

    window.location.href =
        `login.html?returnTo=${encodeURIComponent(returnTo)}`;
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

        img.addEventListener("error", () => img.remove());
        image.append(img);
    }

    const code = document.createElement("span");
    code.className = "workshop-image-code";
    code.textContent = workshop.code;

    

    const body = document.createElement("div");
    body.className = "workshop-body";

    const meta = document.createElement("p");
    meta.className = "workshop-meta";
    meta.textContent = `${workshop.date} · ${workshop.typeLabel}`;

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
    link.setAttribute("aria-label", `View details for ${workshop.title}`);

    link.addEventListener("click", requireLogin);

    footer.append(capacity, link);
    body.append(meta, title, description, footer);
    article.append(image, body);

    return article;
}

function renderWorkshops() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedType = typeFilter.value;

    const filteredWorkshops = allWorkshops.filter((workshop) => {
        const matchesSearch =
            workshop.title.toLowerCase().includes(query) ||
            workshop.description.toLowerCase().includes(query) ||
            workshop.category.toLowerCase().includes(query);

        const matchesType =
            selectedType === "all" || workshop.type === selectedType;

        return matchesSearch && matchesType;
    });

    workshopContainer.replaceChildren();
    workshopCount.textContent =
        `${filteredWorkshops.length} workshop${filteredWorkshops.length === 1 ? "" : "s"} found`;

    if (filteredWorkshops.length === 0) {
        const message = document.createElement("p");
        message.className = "workshop-message";
        message.textContent = allWorkshops.length === 0
            ? "No workshops have been published yet. Check back soon!"
            : "No workshops match your search. Try changing the filters.";

        workshopContainer.append(message);
        return;
    }

    filteredWorkshops.forEach((workshop) => {
        workshopContainer.append(createWorkshopCard(workshop));
    });
}

async function loadWorkshops() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !Array.isArray(result.data)) {
            throw new Error("Invalid API response");
        }

        allWorkshops = result.data.map(normalizeWorkshop);

        renderWorkshops();
    } catch (error) {
        console.error("Failed to load workshops:", error);

        workshopContainer.replaceChildren();

        const message = document.createElement("p");
        message.className = "workshop-message";
        message.textContent =
            "Unable to load workshops. Please try again later.";

        workshopContainer.append(message);
        workshopCount.textContent = "";
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
    searchInput.addEventListener("input", renderWorkshops);
    typeFilter.addEventListener("change", renderWorkshops);

    document.getElementById("currentYear").textContent =
        new Date().getFullYear();

    setupMobileNavigation();
    loadWorkshops();
});