const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const secretAngelService = require('../../services/secretAngelService');

router.get('/', async (req, res) => {
    try {

        const rooms = await secretAngelService.getAllGames();

        res.render('secretAngel/index', { error: null, user: req.user, rooms });
    } catch (err) {
        console.error(err);
        res.status(500).render('secretAngel/index', { error: 'Server error', user: req.user, rooms: [] });
    }
});

router.get('/room/:roomId/:key', async (req, res) => {

    try {
        const { roomId, key } = req.params;
        if (!roomId || !key) {
            return res.json({ error: 'Invalid roomId or key' });
        }

        const isValidKey = await secretAngelService.checkKey({ roomId, key });
        if (!isValidKey) {
            return res.json({ error: 'Invalid key' });
        }

        await secretAngelService.joinGame(roomId, req.user.id, null, true);

        const room = await secretAngelService.getSingleGame({ roomId });
        res.render('secretAngel/room', { error: null, user: req.user, room });
    } catch (error) {
        console.error(error);
        res.status(500).render('secretAngel/room', { error: 'Server error', user: req.user, rooms: [] });
    }

});


module.exports = router;
