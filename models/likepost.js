const mongoose = require('mongoose');

const likepostSchema = new mongoose.Schema({
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Post'
  },
  creator_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // creator of the post
  },
  liker_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // user who liked the post
  },
  status: {
    type: String //status : 'liked' , 'deleted' -> this is for soft delete (like and undo like)
  }
});


const LikePost = mongoose.model('LikePost', likepostSchema);
module.exports = LikePost;