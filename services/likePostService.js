const { LikePost } = require('../models');
const mongoose = require('mongoose');

const likePostService = {
      
    getAnyLikeRecord: async (postId, userId) => {
        const postObjectId = new mongoose.Types.ObjectId(postId);
        const userObjectId = new mongoose.Types.ObjectId(userId);

        return await LikePost.findOne({
            post_id: postObjectId,
            liker_id: userObjectId
        });
    },
    updateLikeStatus: async (likeDoc, status) => {
        likeDoc.status = status;
        return await likeDoc.save();
    },
    createNewLike: async ({ postId, creatorId, likerId }) => {
        const postObjectId = new mongoose.Types.ObjectId(postId);
        const creatorObjectId = new mongoose.Types.ObjectId(creatorId);
        const likerObjectId = new mongoose.Types.ObjectId(likerId);

        const newLike = new LikePost({
        post_id: postObjectId,
        creator_id: creatorObjectId,
        liker_id: likerObjectId,
        status: 'liked'
        });
        return await newLike.save();
    },
    isPostLikedByUser: async (postId, userId) => {
        const existingLike = await LikePost.findOne({
        post_id: postId,
        liker_id: userId,
        status: 'liked'
        });
        return !!existingLike;
    },
    countLikesForPost: async (postId) => {
        return await LikePost.countDocuments({ post_id: postId, status: 'liked' });
    }
};

module.exports = likePostService;