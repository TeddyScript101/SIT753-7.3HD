const express = require('express');
const router = express.Router();

const usersRouter = require('./userRoutes');

const pageRouter = require('./pageRoutes');


router.use('/', pageRouter);

router.use('/api/users', usersRouter);




module.exports = router;
