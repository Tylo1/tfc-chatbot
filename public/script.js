async function checkSession() {
    const res = await fetch("/api/auth/me");
    if (!res.ok) {
        window.location.href = "/login.html";
        return false;
    }
    const data = await res.json();
    document.getElementById("welcomeMsg").innerText = "Welcome, " + data.username + "!";
    return true;
}
const chatBox = document.getElementById("chatBox");
const input = document.getElementById("messageInput");

// ADD MESSAGE
function addMessage(text, type, images = []) {
    const msg = document.createElement("div");
    msg.classList.add(type === "user" ? "user-message" : "bot-message");
    msg.innerText = text;

    // smooth fade-in
    msg.style.opacity = "0";
    msg.style.transform = "translateY(10px)";

    chatBox.appendChild(msg);

    // Add images if any
    if (images.length > 0) {
        images.forEach(imgPath => {
            const img = document.createElement("img");
            img.src = imgPath;
            img.style.maxWidth = "200px";
            img.style.display = "block";
            img.style.marginTop = "8px";
            img.style.borderRadius = "8px";
            chatBox.appendChild(img);
        });
    }

    // trigger animation
    setTimeout(() => {
        msg.style.transition = "all 0.25s ease";
        msg.style.opacity = "1";
        msg.style.transform = "translateY(0)";
    }, 10);

    chatBox.scrollTo({
        top: chatBox.scrollHeight,
        behavior: "smooth"
    });
}

// SEND MESSAGE
async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, "user");
    input.value = "";

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });

        const data = await res.json();

        addMessage(data.reply, "bot", data.images || []);

    } catch (err) {
        addMessage("Error connecting to server", "bot");
    }
}
// ENTER KEY SUPPORT
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        sendMessage();
    }
});

async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login.html";
}

async function loadHistory() {
    const res = await fetch("/api/chat/history");
    const messages = await res.json();
    messages.forEach(m => {
        addMessage(m.content, m.role === "user" ? "user" : "bot");
    });
}

(async function init() {
    const ok = await checkSession();
    if (ok) {
        loadHistory();
    }
})();