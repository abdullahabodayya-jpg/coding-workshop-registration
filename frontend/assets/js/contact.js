
const contactForm = document.getElementById("contactForm");
const contactMessage = document.getElementById("contactMessage");
const messageCount = document.getElementById("messageCount");
const formMessage = document.getElementById("formMessage");
const currentYear = document.getElementById("currentYear");

// Footer year
if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}

// Live character counter
if (contactMessage && messageCount) {
    contactMessage.addEventListener("input", () => {
        messageCount.textContent = contactMessage.value.length;
    });
}

// Show a form message
function showFormMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.hidden = false;
}

// Client-side validation only.
// This does not send or store messages.
if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!contactForm.checkValidity()) {
            contactForm.reportValidity();
            return;
        }

        const name = document.getElementById("contactName").value.trim();
        const email = document.getElementById("contactEmail").value.trim();
        const subject = document.getElementById("contactSubject").value;
        const message = contactMessage.value.trim();

        if (name.length < 2) {
            showFormMessage("Please enter a valid name.", "error");
            return;
        }

        if (!email || !email.includes("@")) {
            showFormMessage("Please enter a valid email address.", "error");
            return;
        }

        if (!subject) {
            showFormMessage("Please select a subject.", "error");
            return;
        }

        if (message.length < 10) {
            showFormMessage(
                "Your message must contain at least 10 characters.",
                "error"
            );
            return;
        }

        showFormMessage(
            "Your message passed validation, but it has not been sent. " +
            "The form needs a backend connection before messages can be delivered.",
            "success"
        );
    });
}
