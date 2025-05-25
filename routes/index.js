const express = require('express');
const router = express.Router();

const usersRouter = require('./userRoutes');

const pageRouter = require('./pageRoutes');

const postRouter = require('./postRoutes');
const secretAngelRouter = require('./secretAngelRoutes');

router.use('/', pageRouter);

router.use('/api/users', usersRouter);

router.use('/api/posts', postRouter);
router.use('/api/secretAngel', secretAngelRouter);



module.exports = router;
