const { userService } = require('../services');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const signJWT = require('../helpers/signJWT');

const userController = {
  getAllUsers: async (req, res) => {
    try {
      const users = await userService.getAllUsers();
      res.json({ data: users });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await userService.login({ email, password });

      if (user) {
        const token = signJWT({
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        });

        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 1000,
          sameSite: 'lax',
        });

        return res.json({ message: 'Login successful' });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  signup: async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const newUser = await userService.signup({ name, email, password });
      res
        .status(201)
        .json({ message: 'User created successfully', user: newUser });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  forgetPassword: async (req, res) => {
    try {
      const { email } = req.body;
      await userService.sendResetLink(email);
      res.json({ message: 'Reset link sent to your email' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { token, password } = req.body;
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
      if (decoded.tokenType !== 'reset') {
        return res.status(400).json({ message: 'Invalid token type' });
      }
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        return res.status(400).json({ message: 'Token has expired' });
      }
      const userId = decoded.user.id;
      const user = await userService.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await userService.updateSettings(userId, { password });
      res.json({ message: 'Password reset successful' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  updateSettings: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, password, confirmPassword, removeAvatar } = req.body;
      let avatar = req.file ? `/uploads/${req.file.filename}` : undefined;

      if (password && password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }

      let finalAvatar = req.user.avatar;

      if (removeAvatar === 'on') {
        if (req.user.avatar) {
          const avatarPath = path.join(
            __dirname,
            '..',
            'public',
            'uploads',
            req.user.avatar,
          );
          if (fs.existsSync(avatarPath)) {
            fs.unlinkSync(avatarPath);
          }
        }
        finalAvatar = null;
      }

      if (avatar) {
        finalAvatar = avatar;
      }

      const updatedUser = await userService.updateSettings(userId, {
        name,
        password,
        avatar: finalAvatar,
      });

      const token = jwt.sign(
        {
          id: updatedUser._id,
          name: updatedUser.name,
          avatar: updatedUser.avatar,
        },
        process.env.JWT_SECRET || 'default_secret',
      );
      res.cookie('token', token, { httpOnly: true });

      res.redirect('/');
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
  logout: (req, res) => {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    res.redirect('/login');
  },
  checkEmailExists: async (req, res) => {
    const { email } = req.body;

    try {
      const emailExists = await userService.isEmailRegistered(email);

      if (emailExists) {
        return res.status(400).json({ message: 'Email already exists.' });
      }

      return res.status(200).json({ message: 'Email is available.' });
    } catch (err) {
      console.error('Error checking email:', err);
      return res
        .status(500)
        .json({ message: 'Server error. Please try again.' });
    }
  },

  sendOTP: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is missing' });
      }

      const existingUser = await userService.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      await userService.sendOTP({ email });
      res.json({ message: 'OTP sent to your email for verification' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  verifyOTP: async (req, res) => {
    try {
      const { email, otp } = req.body;

      const success = await userService.verifyOTP(email, otp);
      res.status(201).json({ message: 'Signup successful', success });
    } catch (error) {
      res.status(400).json({ message: error.message, success: false });
    }
  },
};

module.exports = userController;
