const express = require('express');
const router = express.Router();
const { postController } = require('../controllers');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload'); 

router.post('/addpost', authMiddleware, upload.any(), postController.addPost);
router.get('/loadMorePosts', authMiddleware, postController.loadMorePosts)
router.post('/like/:postId', authMiddleware, postController.toggleLike);

module.exports = router;