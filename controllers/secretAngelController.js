const secretAngelService = require('../services/secretAngelService');

const secretAngelController = {

    createGame: async (req, res) => {
        try {
            const gameData = { ...req.body, host: req.user.id };
            const newGame = await secretAngelService.createGame(gameData);
            return res.status(201).json(newGame);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },

    startGame: async (req, res) => {
        try {
            const gameId = req.params.id;
            const game = await secretAngelService.startGame(gameId);
            return res.status(200).json(game);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },
    getAllGames: async (req, res) => {
        try {
            const games = await secretAngelService.getAllGames();
            return res.status(200).json(games);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },
    toggleReadyToStart: async (req, res) => {
        try {
            const gameId = req.params.id;
            const userId = req.user.id;
            const updatedGame = await secretAngelService.toggleReadyToStart(gameId, userId);
            return res.status(200).json(updatedGame);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },

    updateGame: async (req, res) => {
        try {
            const gameId = req.params.id;
            const updatedData = req.body;
            const updatedGame = await secretAngelService.updateGame(gameId, updatedData);
            return res.status(200).json(updatedGame);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },
    joinGame: async (req, res) => {
        try {
            const roomId = req.params.roomId;
            const userId = req.user.id;
            const password = req.body.password;
            const updatedGame = await secretAngelService.joinGame(roomId, userId, password);
            return res.status(200).json(updatedGame);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },
    invitePlayer: async (req, res) => {
        try {
            const { roomId, emails } = req.body;
            const inviteLink = await secretAngelService.invitePlayer(roomId, emails);
            return res.status(200).json({ inviteLink });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },
    revealResult: async (req, res) => {
        try {
            const roomId = req.params.roomId;
            const result = await secretAngelService.revealResult(roomId);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },

    deleteGame: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedGame = await secretAngelService.deleteGame(id);
            return res.status(200).json(deletedGame);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
};

module.exports = secretAngelController;
