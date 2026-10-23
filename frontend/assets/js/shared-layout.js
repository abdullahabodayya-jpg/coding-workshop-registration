
(() => {
    const currentPage = window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    const logoLink =
    currentPage === "index.html" || currentPage === ""
        ? "index.html"
        : "workshops.html";

    const header = `
        <header class="site-header">
            <nav class="navbar container" aria-label="Main navigation">

                <a class="brand" href="${logoLink}" aria-label="ATHAR home">
                    <img
                        src="assets/images/athar_logo-removebg-preview.png"
                        alt="ATHAR"
                        width="150"
                        height="50"
                    >
                </a>

                <button
                    class="menu-toggle"
                    id="menuToggle"
                    type="button"
                    aria-label="Open navigation"
                    aria-expanded="false"
                    aria-controls="navLinks"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>


                <div class="nav-links" id="navLinks">
                    <a class="nav-link" href="workshops.html">
                        Workshops
                    </a>

                    <a class="nav-link" href="about.html">
                        About
                    </a>

                    <a class="nav-link" href="contact.html">
                        Contact
                    </a>
                </div>
                <div id="authActions" class="nav-actions"></div>

                

            </nav>
        </header>
    `;

    const footer = `
        <footer class="site-footer">
            <div class="container footer-main">

                <div class="footer-brand">
                    <a
                        class="brand footer-logo"
                        href="${logoLink}"
                        aria-label="ATHAR home"
                    >
                        <img
                            src="assets/images/athar_logo-removebg-preview.png"
                            alt="ATHAR"
                            width="150"
                            height="50"
                        >
                    </a>

                    <p>Learn. Build. Leave an impact.</p>
                </div>

                <nav class="footer-links" aria-label="Footer navigation">
                    <a href="workshops.html">Workshops</a>
                    <a href="about.html">About</a>
                    <a href="contact.html">Contact</a>
                    <a href="support.html">Support</a>
                </nav>

            </div>

            <div class="container footer-bottom">
                <p>
                    &copy; <span id="currentYear"></span>
                    ATHAR. All rights reserved.
                </p>

                <p>Built for curious minds.</p>
            </div>
        </footer>
    `;

    function setupSharedLayout() {
        const headerContainer =
            document.getElementById("sharedHeader");

        const footerContainer =
            document.getElementById("sharedFooter");

        if (headerContainer) {
            headerContainer.innerHTML = header;
        }

        if (footerContainer) {
            footerContainer.innerHTML = footer;
        }

        // Highlight the current page.
        document.querySelectorAll(".nav-link").forEach((link) => {
            const linkPage = new URL(
                link.href,
                window.location.href
            ).pathname.split("/").pop().toLowerCase();

            if (linkPage === currentPage) {
                link.classList.add("active");
                link.setAttribute("aria-current", "page");
            }
        });

        // Footer year.
        const year = document.getElementById("currentYear");

        if (year) {
            year.textContent = new Date().getFullYear();
        }

        setupMobileNavigation();
    }

    function setupMobileNavigation() {
        const toggle = document.getElementById("menuToggle");
        const links = document.getElementById("navLinks");

        if (!toggle || !links) return;

        function closeMenu() {
            links.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Open navigation");
        }

        toggle.addEventListener("click", () => {
            const isOpen = links.classList.toggle("is-open");

            toggle.setAttribute("aria-expanded", String(isOpen));
            toggle.setAttribute(
                "aria-label",
                isOpen ? "Close navigation" : "Open navigation"
            );
        });

        links.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("click", (event) => {
            if (
                !toggle.contains(event.target) &&
                !links.contains(event.target)
            ) {
                closeMenu();
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            setupSharedLayout
        );
    } else {
        setupSharedLayout();
    }
})();
