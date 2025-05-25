const secretAngelService = require('../services/secretAngelService');


const userSocketMap = new Map();

module.exports = (io, socket) => {

    socket.on('createGame', async () => {
        try {
            const rooms = await secretAngelService.getAllGames();
            io.emit('roomList', rooms);
        } catch (err) {
            socket.emit('errorMessage', err.message);
        }
    });


    socket.on("registerUser", ({ userId }) => {
        if (userId) {
            userSocketMap.set(userId, socket.id);
        }
    });


    socket.on("joinRoom", async ({ roomId, userName }) => {
        if (!roomId || !userName) return;

        socket.join(`room-${roomId}`);
        io.to(`room-${roomId}`).emit("systemMessage", `${userName} joined the room`);

        try {
            const game = await secretAngelService.getSingleGame({ roomId });
            io.to(`room-${roomId}`).emit("readyStatusChanged", {
                members: game.members,
            });
        } catch (err) {
            socket.emit("errorMessage", err.message);
        }
    });


    socket.on("sendMessage", ({ roomId, userId, userName, message }) => {
        if (!roomId || !userId || !message) return;

        const timestamp = new Date();
        io.to(`room-${roomId}`).emit("newMessage", {
            senderId: userId,
            senderName: userName,
            message,
            timestamp,
        });
    });


    socket.on("updateBudget", async ({ gameId, budget }) => {
        try {
            const game = await secretAngelService.updateGame(gameId, { budget });
            io.to(`room-${game.roomId}`).emit("budgetUpdated", game.budget);
        } catch (err) {
            socket.emit("errorMessage", err.message);
        }
    });


    socket.on("deleteGame", async ({ gameId }) => {
        try {
            const game = await secretAngelService.deleteGame(gameId);
            io.to(`room-${game.roomId}`).emit("gameDeleted", game._id);
        } catch (err) {
            socket.emit("errorMessage", err.message);
        }
    });


    socket.on("startGame", async ({ gameId }) => {
        try {
            const startedGame = await secretAngelService.startGame(gameId);
            io.to(`room-${startedGame.roomId}`).emit("gameStarted");

            const updatedGame = await secretAngelService.getSingleGame({ _id: gameId });
            updatedGame.assignment.forEach(pair => {
                const angelId = pair.secretAngel._id?.toString();
                const targetName = pair.user.name;

                const socketId = userSocketMap.get(angelId);
                if (socketId) {
                    io.to(socketId).emit("yourAssignment", { targetName });
                }
            });
        } catch (err) {
            socket.emit("errorMessage", err.message);
        }
    });


    socket.on("toggleReady", async ({ gameId, userId }) => {
        try {
            const game = await secretAngelService.toggleReadyToStart(gameId, userId);
            io.to(`room-${game.roomId}`).emit("readyStatusChanged", {
                members: game.members,
            });
        } catch (err) {
            socket.emit("errorMessage", err.message);
        }
    });


    socket.on("revealResults", async ({ roomId }) => {
        try {
            await secretAngelService.revealResult(roomId);
            io.to(`room-${roomId}`).emit("resultsRevealed");
        } catch (err) {
            socket.emit("errorMessage", err.message);
        }
    });


    socket.on("invitePlayers", async ({ roomId, emails }) => {
        try {
            await secretAngelService.invitePlayer(roomId, emails);
            socket.emit("invitesSent", emails);
        } catch (err) {
            socket.emit("errorMessage", err.message);
        }
    });


    socket.on("disconnect", () => {
        for (const [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                userSocketMap.delete(userId);
                break;
            }
        }
    });
};


module.exports.userSocketMap = userSocketMap;
