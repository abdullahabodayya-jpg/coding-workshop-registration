const contactForm = document.getElementById("contactForm");
const contactMessage = document.getElementById("contactMessage");
const messageCount = document.getElementById("messageCount");
const formMessage = document.getElementById("formMessage");

// Live character counter
if (contactMessage && messageCount) {
    contactMessage.addEventListener("input", () => {
        messageCount.textContent = contactMessage.value.length;
    });
}

function showFormMessage(message, type) {
    if (!formMessage) return;

    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.hidden = false;
}

if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!contactForm.checkValidity()) {
            contactForm.reportValidity();
            return;
        }

        const name = document
            .getElementById("contactName")
            .value.trim();

        const email = document
            .getElementById("contactEmail")
            .value.trim();

        const subject = document
            .getElementById("contactSubject")
            .value;

        const message = contactMessage.value.trim();

        if (name.length < 2) {
            showFormMessage("Please enter a valid name.", "error");
            return;
        }

        if (!email || email.length > 255) {
            showFormMessage("Please enter a valid email address.", "error");
            return;
        }

        if (!subject) {
            showFormMessage("Please select a subject.", "error");
            return;
        }

        if (message.length < 10 || message.length > 5000) {
            showFormMessage(
                "Your message must contain between 10 and 5000 characters.",
                "error"
            );
            return;
        }

        const submitButton = contactForm.querySelector(
            '[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            const response = await fetch(
                "http://localhost/code%20registration%20workshop%20website/athar/backend/api/contact/submit.php",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        subject,
                        message
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to send your message."
                );
            }

            showFormMessage(result.message, "success");
            contactForm.reset();

            if (messageCount) {
                messageCount.textContent = "0";
            }

        } catch (error) {
            showFormMessage(
                error.message ||
                    "A network error occurred. Please try again.",
                "error"
            );
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
}
