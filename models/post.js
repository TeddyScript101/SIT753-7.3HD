const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  category: {
    type: String,
  },
  cover_pic: {
    type: String,
    required: true,
  },
  media: {
    type: String,
  },
  total_likes: {
    type: Number,
    default: 0,
  },
  get_likes_notif:{
    type: Boolean,
    default: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});


const Post = mongoose.model('Post', postSchema);
module.exports = Post;