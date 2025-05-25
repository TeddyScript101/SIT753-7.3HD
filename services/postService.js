const { Post } = require('../models');

const postService = {
    createPost: async (data) => {
        const post = new Post(data);
        return await post.save();
      },
    getPostsByCat: async (cat) => {
        return await Post.find({ category: cat })
          .sort({ uploadedAt: -1, title: 1, description: 1 })
          .limit(5);
      },
    getPostsByCatWithSkip: async (cat, skip, limit) => {
        return await Post.find({ category: cat })
          .sort({ uploadedAt: -1, title: 1, description: 1 })
          .skip(skip)
          .limit(limit);
      },
    getPostById: async (id) => {
        return await Post.findById(id).populate('user_id');
      },
    updateTotalLikes: async (postId, increment) => {
        // Update total_likes field in the Post document
        return await Post.findByIdAndUpdate(postId, {
          $inc: { total_likes: increment }
        });
      }
};

module.exports = postService;
