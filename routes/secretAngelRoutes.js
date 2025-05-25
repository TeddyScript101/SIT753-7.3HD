const express = require('express');
const router = express.Router();
const { secretAngelController } = require('../controllers');
const authMiddleware = require('../middlewares/authMiddleware');


router.get('/', authMiddleware, secretAngelController.getAllGames);
router.get('/:id/start', authMiddleware, secretAngelController.startGame);


router.post('/', authMiddleware, secretAngelController.createGame);

router.post('/invite', authMiddleware, secretAngelController.invitePlayer);

router.put('/:id', authMiddleware, secretAngelController.updateGame);
router.put('/:id/ready', authMiddleware, secretAngelController.toggleReadyToStart);

router.put('/:roomId/join', authMiddleware, secretAngelController.joinGame);


router.put('/:roomId/reveal', secretAngelController.revealResult);
router.delete('/:id', authMiddleware, secretAngelController.deleteGame);

module.exports = router;
