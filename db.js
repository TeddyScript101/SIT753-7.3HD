const mongoose = require('mongoose');
const users = require('./models/user');
require('dotenv').config();

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/SIT725GroupProject';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected...');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
