const workshops = [
    {
        id: "demo-1",
        title: "Web Development Fundamentals",
        category: "Web Development",
        date: "Coming soon",
        type: "On-site",
        description: "Start building websites with HTML, CSS, and JavaScript.",
        capacity: "Beginner friendly",
        theme: "workshop-image-blue",
        code: "<html>"
    },
    {
        id: "demo-2",
        title: "Python for Beginners",
        category: "Python",
        date: "Coming soon",
        type: "Online",
        description: "Learn programming fundamentals through practical exercises.",
        capacity: "Beginner friendly",
        theme: "workshop-image-lavender",
        code: "print()"
    },
    {
        id: "demo-3",
        title: "Database Design Essentials",
        category: "Databases",
        date: "Coming soon",
        type: "On-site",
        description: "Understand tables, relationships, and SQL fundamentals.",
        capacity: "Beginner friendly",
        theme: "workshop-image-gray",
        code: "SELECT"
    },
    {
        id: "demo-4",
        title: "JavaScript in Practice",
        category: "JavaScript",
        date: "Coming soon",
        type: "Online",
        description: "Make web pages interactive and understand core JavaScript.",
        capacity: "Beginner friendly",
        theme: "workshop-image-blue",
        code: "const x"
    },
    {
        id: "demo-5",
        title: "Cybersecurity Basics",
        category: "Cybersecurity",
        date: "Coming soon",
        type: "On-site",
        description: "Discover security principles and common digital threats.",
        capacity: "Beginner friendly",
        theme: "workshop-image-brown",
        code: "SECURE"
    },
    {
        id: "demo-6",
        title: "PHP and MySQL Foundations",
        category: "Backend Development",
        date: "Coming soon",
        type: "Online",
        description: "Explore server-side development and relational databases.",
        capacity: "Beginner friendly",
        theme: "workshop-image-lavender",
        code: "<?php"
    }
];

function createWorkshopCard(workshop) {
    const article = document.createElement("article");
    article.className = "workshop-card";

    const image = document.createElement("div");
    image.className = `workshop-image ${workshop.theme}`;

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
    link.setAttribute("aria-label", `View details for ${workshop.title}`);

    footer.append(capacity, link);
    body.append(meta, title, description, footer);
    article.append(image, body);

    return article;
}

function renderWorkshops() {
    const container = document.getElementById("upcomingWorkshops");

    if (!container) {
        return;
    }

    container.replaceChildren();

    if (workshops.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "workshop-empty";

        const heading = document.createElement("h3");
        heading.textContent = "No upcoming workshops yet";

        const message = document.createElement("p");
        message.textContent =
            "Check back soon to discover new learning opportunities.";

        emptyState.append(heading, message);
        container.append(emptyState);

        return;
    }

    workshops.slice(0, 3).forEach((workshop) => {
        container.append(createWorkshopCard(workshop));
    });
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
    renderWorkshops();
    setupMobileNavigation();
    setupCurrentYear();
});
