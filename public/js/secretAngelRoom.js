const { roomId, objectRoomId, userId, userName } = window.secretAngelRoomData;
const socket = io();

// ===================== CHATROOM =====================
const chatBody = document.getElementById("messages");

function appendChatMessage(sender, message, timestamp = new Date()) {
    const isSystem = sender.name == null || sender === "System";
    const div = document.createElement("div");
    div.className = isSystem ? "system-message" : "chat-message";

    const timeString = new Date(timestamp).toLocaleTimeString();

    div.innerHTML = `
        <strong>${sender}:</strong> ${message}
        <small>${timeString}</small>
    `;
    chatBody.appendChild(div);
    scrollToBottom();
}

function scrollToBottom() {
    const messagesContainer = document.getElementById("messages");
    const chatBodyMain = document.querySelector('.chat-body');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    chatBodyMain.scrollTop = chatBodyMain.scrollHeight;

    setTimeout(() => {
        messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
        chatBodyMain.scrollTo({ top: chatBodyMain.scrollHeight, behavior: 'smooth' });
    }, 50);
}

// Send message on Enter
document.getElementById("chatInput").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        sendUserMessage();
    }
});

function sendUserMessage() {
    const input = document.getElementById("chatInput");
    const message = input.value.trim();
    if (!message) return;

    socket.emit("sendMessage", {
        roomId,
        userId,
        userName,
        message
    });

    input.value = "";
}

// ===================== INVITATION MODAL =====================
const modal = document.getElementById("invitationModal");
const emailInput = document.getElementById("inviteEmail");
const emailList = document.getElementById("emailList");
const collectedEmails = [];

function openModal() {
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeModal() {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
}

emailInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (validateEmail(email)) {
            collectedEmails.push(email);
            addEmailToList(email);
            emailInput.value = "";
        } else {
            alert("Invalid email address.");
        }
    }
});

function addEmailToList(email) {
    const li = document.createElement("li");
    li.textContent = email;
    emailList.appendChild(li);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sendInvitations() {
    if (collectedEmails.length === 0) {
        return alert("Please enter at least one email.");
    }

    socket.emit("invitePlayers", {
        roomId,
        emails: collectedEmails
    });
}

// ===================== SETTINGS MODAL =====================
const settingsModal = document.getElementById("settingsModal");

function openSettingsModal() {
    settingsModal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeSettingsModal() {
    settingsModal.style.display = "none";
    document.body.style.overflow = "auto";
}

function submitSettings() {
    const budget = document.getElementById("gameBudget").value;
    if (!budget || parseFloat(budget) <= 0) {
        return alert("Please enter a valid budget.");
    }

    socket.emit("updateBudget", {
        gameId: objectRoomId,
        budget
    });
}

function deleteGame() {
    if (!confirm("Are you sure you want to delete this game?")) return;
    socket.emit("deleteGame", { gameId: objectRoomId });
}

function startGame() {
    socket.emit("startGame", { gameId: objectRoomId });
}

function toggleReadyToStart() {
    socket.emit("toggleReady", { gameId: objectRoomId, userId });
}

function revealResult() {
    socket.emit("revealResults", { roomId });
}

// ===================== SOCKET CONNECTION =====================
socket.on("connect", () => {
    socket.emit("joinRoom", { roomId, userName });
    socket.emit("registerUser", { userId });
    appendChatMessage("System", "Connected to chat");
});

socket.on("disconnect", () => {
    appendChatMessage("System", "Disconnected from chat");
});

socket.on("newMessage", ({ senderId, senderName, message, timestamp }) => {
    appendChatMessage(senderName ?? 'System', message, timestamp);
});

socket.on("systemMessage", (message) => {
    appendChatMessage("System", message);
});

// ===================== GLOBAL EVENT LISTENERS =====================
socket.on("budgetUpdated", (newBudget) => {
    closeSettingsModal()
    alert("Budget updated to: " + newBudget);
    appendChatMessage("System", `Budget updated to ${newBudget}`);
    const budgetDisplay = document.getElementById("budgetDisplay");
    if (budgetDisplay) {
        budgetDisplay.innerHTML = `<strong>Budget:</strong> $${newBudget}`;
    }

});




socket.on("invitesSent", (emails) => {
    alert("Invitations sent to:\n" + emails.join(", "));
    collectedEmails.length = 0;
    emailList.innerHTML = "";
    closeModal();
});


socket.on("gameDeleted", () => {
    alert("Game deleted.");
    window.location.href = "/secretAngel";
});

socket.on("gameStarted", () => {
    alert("Game started!");
    appendChatMessage("System", "Game Started");


});

socket.on("yourAssignment", ({ targetName }) => {
    alert(`🎯 Your target is: ${targetName}`);
    window.location.reload();
});

socket.on("readyStatusChanged", ({ members }) => {
    const container = document.getElementById("participantList");
    if (!container) return;

    if (members.length === 0) {
        container.innerHTML = `<div>No participants yet.</div>`;
        return;
    }

    container.innerHTML = members.map(member => {
        let label = member.user.name;
        if (member.isHost) label += " (Host)";
        if (member.isReady) label += " (Ready)";
        return `<div>${label}</div>`;
    }).join('');
});

socket.on("resultsRevealed", () => {
    alert("Results revealed!");
    window.location.reload();
});

socket.on("errorMessage", (message) => {
    alert("Error: " + message);
});
