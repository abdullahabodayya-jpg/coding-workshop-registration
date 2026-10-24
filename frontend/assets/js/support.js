
const API_BASE = "../../backend/api/contact";

const messageList = document.getElementById("messageList");
const listMessage = document.getElementById("listMessage");
const statusFilter = document.getElementById("statusFilter");
const refreshBtn = document.getElementById("refreshBtn");

const emptyState = document.getElementById("emptyState");
const messageDetails = document.getElementById("messageDetails");
const replyForm = document.getElementById("replyForm");
const adminReply = document.getElementById("adminReply");
const messageStatus = document.getElementById("messageStatus");
const formMessage = document.getElementById("formMessage");
const saveBtn = document.getElementById("saveBtn");

let messages = [];
let selectedId = null;

function setNotice(element, message, type = "") {
    element.textContent = message;
    element.className = "notice";

    if (type) {
        element.classList.add(type);
    }
}

function formatStatus(status) {
    return {
        open: "Open",
        in_progress: "In progress",
        resolved: "Resolved"
    }[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return "—";

    const date = new Date(dateString.replace(" ", "T"));

    return Number.isNaN(date.getTime())
        ? dateString
        : date.toLocaleString();
}

function updateStats() {
    document.getElementById("totalCount").textContent = messages.length;
    document.getElementById("openCount").textContent =
        messages.filter(message => message.status === "open").length;
    document.getElementById("progressCount").textContent =
        messages.filter(message => message.status === "in_progress").length;
    document.getElementById("resolvedCount").textContent =
        messages.filter(message => message.status === "resolved").length;
}

function renderMessages() {
    messageList.replaceChildren();

    const filter = statusFilter.value;

    const filteredMessages = messages.filter(message =>
        filter === "all" || message.status === filter
    );

    if (filteredMessages.length === 0) {
        setNotice(listMessage, "No messages found.");
        return;
    }

    setNotice(listMessage, `${filteredMessages.length} message(s) found.`);

    filteredMessages.forEach(message => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "message-item";

        if (message.id === selectedId) {
            button.classList.add("selected");
        }

        const top = document.createElement("div");
        top.className = "message-item-top";

        const subject = document.createElement("strong");
        subject.textContent = message.subject;

        const badge = document.createElement("span");
        badge.className = `status-badge ${message.status}`;
        badge.textContent = formatStatus(message.status);

        top.append(subject, badge);

        const sender = document.createElement("p");
        sender.textContent = `${message.name} · ${message.email}`;

        const preview = document.createElement("p");
        preview.textContent = message.message;

        const date = document.createElement("div");
        date.className = "message-meta";
        date.textContent = formatDate(message.created_at);

        button.append(top, sender, preview, date);

        button.addEventListener("click", () => {
            selectedId = message.id;
            renderMessages();
            showMessage(message);
        });

        messageList.append(button);
    });
}

function showMessage(message) {
    emptyState.hidden = true;
    messageDetails.hidden = false;

    document.getElementById("detailSubject").textContent =
        message.subject;
    document.getElementById("detailName").textContent =
        message.name;
    document.getElementById("detailEmail").textContent =
        message.email;
    document.getElementById("detailDate").textContent =
        formatDate(message.created_at);
    document.getElementById("detailMessage").textContent =
        message.message;

    const badge = document.getElementById("detailStatus");
    badge.className = `status-badge ${message.status}`;
    badge.textContent = formatStatus(message.status);

    adminReply.value = message.admin_reply || "";
    messageStatus.value = message.status;

    setNotice(formMessage, "");
}

async function loadMessages() {
    refreshBtn.disabled = true;
    setNotice(listMessage, "Loading messages...");

    try {
        const response = await fetch(`${API_BASE}/index.php?status=all`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        });

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
            throw new Error(
                "Admin access denied. Please sign in with an admin account."
            );
        }

        if (!response.ok || data.success !== true) {
            throw new Error(data.message || "Unable to load messages.");
        }

        messages = Array.isArray(data.messages) ? data.messages : [];
        updateStats();

        const selectedMessage = messages.find(
            message => message.id === selectedId
        );

        renderMessages();

        if (selectedMessage) {
            showMessage(selectedMessage);
        } else {
            selectedId = null;
            emptyState.hidden = false;
            messageDetails.hidden = true;
        }
    } catch (error) {
        setNotice(listMessage, error.message, "error");
    } finally {
        refreshBtn.disabled = false;
    }
}

replyForm.addEventListener("submit", async event => {
    event.preventDefault();

    const message = messages.find(item => item.id === selectedId);

    if (!message) {
        setNotice(formMessage, "Select a message first.", "error");
        return;
    }

    const reply = adminReply.value.trim();
    const status = messageStatus.value;

    if (status === "resolved" && !reply) {
        setNotice(
            formMessage,
            "Write a reply before resolving this message.",
            "error"
        );
        return;
    }

    saveBtn.disabled = true;
    setNotice(formMessage, "Saving changes...");

    try {
        const response = await fetch(`${API_BASE}/update.php`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                id: message.id,
                status,
                admin_reply: reply
            })
        });

        const data = await response.json();

        if (!response.ok || data.success !== true) {
            throw new Error(data.message || "Unable to save changes.");
        }

        setNotice(
            formMessage,
            "Changes saved successfully. No email has been sent yet.",
            "success"
        );

        await loadMessages();

        const updatedMessage = messages.find(
            item => item.id === selectedId
        );

        if (updatedMessage) {
            showMessage(updatedMessage);
            setNotice(
                formMessage,
                "Changes saved successfully. No email has been sent yet.",
                "success"
            );
        }
    } catch (error) {
        setNotice(formMessage, error.message, "error");
    } finally {
        saveBtn.disabled = false;
    }
});

statusFilter.addEventListener("change", renderMessages);
refreshBtn.addEventListener("click", loadMessages);

loadMessages();
