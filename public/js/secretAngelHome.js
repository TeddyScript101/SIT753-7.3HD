const socket = io();

function openJoinModal(roomId) {
    document.getElementById('joinRoomId').value = roomId;
    document.getElementById('joinGameModal').classList.remove('hidden');
}

document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("createGameModal");
    const openBtn = document.querySelector(".create-game-btn");
    const closeBtn = document.getElementById("closeModalBtn");
    const form = document.getElementById("createGameForm");

    openBtn.addEventListener("click", () => {
        modal.classList.remove("hidden");
    });

    closeBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
    });



    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const budget = form.elements["budget"].value;
        const password = form.elements["password"].value;

        try {
            const res = await fetch("/api/secretAngel", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ budget, password })
            });

            if (res.ok) {
                socket.emit('createGame');
                modal.classList.add('hidden');
            } else {
                alert("Error creating game.");
            }
        } catch (err) {
            console.error("Error:", err);
            alert("Server error.");
        }
    });

    document.getElementById('closeJoinModalBtn').addEventListener('click', () => {
        document.getElementById('joinGameModal').classList.add('hidden');
    });

    document.getElementById('joinGameForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const roomId = document.getElementById('joinRoomId').value;
        const password = document.getElementById('joinPassword').value;

        try {
            const res = await fetch(`/api/secretAngel/${roomId}/join`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ password })
            });

            const data = await res.json();

            if (res.ok) {
                window.location.href = `/secretAngel/room/${roomId}/${data.game._id.toString()}`;
            } else {
                alert("Incorrect password.");
            }
        } catch (err) {
            console.error("Error:", err);
            alert("Server error.");
        }
    });
});




socket.on('roomList', (rooms) => {
    const roomListDiv = document.querySelector('.room-list');
    roomListDiv.innerHTML = ''; // Clear existing

    rooms.forEach(room => {
        const div = document.createElement('div');
        div.className = 'room-card';
        div.style.backgroundColor = room.color;
        div.onclick = () => openJoinModal(room.roomId);
        div.innerHTML = `
            <div>Room ID: ${room.roomId}</div>
            <div>Host: ${room.host.name}</div>
        `;
        roomListDiv.appendChild(div);
    });
});
