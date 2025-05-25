const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const jwt = require('jsonwebtoken');
const { postController } = require('../controllers');
const secretAngelRouter = require('./pages/secretAngelPages');


router.get('/', authMiddleware, (req, res) => {
  const user = req?.user || null;
  res.render('home', { title: 'Home Page', error: null, user });
});

router.get('/login', (req, res) => {
  res.render('auth/login', { error: null, user: null });
});

router.get('/signup', (req, res) => {
  res.render('auth/signup', { error: null, user: null });
});

router.get('/settings', authMiddleware, (req, res) => {
  res.render('auth/userSetting', { error: null, user: req.user });
});

router.get('/reset-password/:token', (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    if (decoded.tokenType !== 'reset') {
      throw new Error('Invalid token type');
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      throw new Error('Token has expired');
    }

    const user = decoded.user;

    res.render('auth/reset-password', { user, token });
  } catch (err) {

    console.error('Error verifying token:', err);
    res.status(400).send('Invalid or expired reset link');
  }
});

router.use('/secretAngel', authMiddleware, secretAngelRouter);


router.get('/addPost', authMiddleware, (req, res) => {
  res.render('addPostCommunity', { error: null, user: req.user });
});

router.get('/communityMainPage', authMiddleware, postController.getCommunityMainPage);

router.get('/detailPostPage', authMiddleware, postController.getDetailPostPage);

module.exports = router;
