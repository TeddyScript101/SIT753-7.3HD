const express = require('express');
const passport = require('passport');
const router = express.Router();
const upload = require('../middlewares/upload');
const { userController } = require('../controllers');
const authMiddleware = require('../middlewares/authMiddleware');
const signJWT = require('../helpers/signJWT');

router.get('/', userController.getAllUsers);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    const token = signJWT({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 1000,
      sameSite: 'lax',
    });

    res.redirect('/');
  }
);


router.get('/logout', userController.logout);
router.post('/login', userController.login);
router.post('/signup', userController.signup);
router.post('/forget-password', userController.forgetPassword);

router.post('/reset-password', userController.resetPassword);
router.put(
  '/settings',
  authMiddleware,
  upload.single('avatar'),
  userController.updateSettings,
);
router.post('/email-exists', userController.checkEmailExists);
router.post('/send-otp', userController.sendOTP);
router.post('/verify-otp', userController.verifyOTP);
router.delete('/', authMiddleware, userController.softDeleteUser
);

module.exports = router;
