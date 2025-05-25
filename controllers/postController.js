const {postService, likePostService} = require('../services');
const { userService } = require('../services');

const postController = {
    addPost: async (req, res) => {
        try {
          const { title, description, category, notifcheckbox } = req.body;
          const user_id = req.user.id;
      
          if (!title || !description || !category) {
            return res.status(400).json({ success: false, message: 'Please complete all required fields.' });
          }
      
          const coverPic = req.files.find(file => file.fieldname === 'cover_pic');
          const mediaFile = req.files.find(file => file.fieldname === 'media');
      
          if (!coverPic) {
            return res.status(400).json({ success: false, message: 'Cover image is required.' });
          }
      
          const getLikesNotif = notifcheckbox === 'on' || notifcheckbox === true;

          const newPost = await postService.createPost({
            user_id,
            title,
            description,
            category,
            cover_pic: `/uploads/${coverPic.filename}`,
            media: mediaFile ? `/uploads/${mediaFile.filename}` : "none",
            get_likes_notif: getLikesNotif
          });
      
          return res.status(201).json({ success: true, message: 'Post shared successfully!', post: newPost });
        } catch (error) {
          console.error('Add post error:', error);
          return res.status(500).json({ success: false, message: 'An error occurred while sharing the post.' });
        }
      },
      getCommunityMainPage: async (req, res) => {
        try{
          const categoryNames = ['Wrapping Ideas', 'DIY Gifts', 'Eco-friendly Gifts', 'Seasonal Gifts'];

          //Get 5 first posts from mongoDB per category 
          const postsByCategory = {};

          for (const cat of categoryNames) {
            postsByCategory[cat] = await postService.getPostsByCat(cat);
          }

          res.render('communityMainPage', {
            error: null,
            user: req.user,
            categories: categoryNames,
            postsByCategory
          });

        }catch (err) {
          console.error(err);
          res.render('communityMainPage', {
            error: 'Failed to fetch posts',
            user: req.user,
            categories: [],
            postsByCategory: {}
          });
        }
      },
      loadMorePosts: async (req, res) => {
        try {
          const { category, skip } = req.query;
          const limit = 5;

          if (!category) {
            return res.status(400).json({ success: false, message: 'Category is required.' });
          }

          const posts = await postService.getPostsByCatWithSkip(category, parseInt(skip), limit);

          res.json({ success: true, posts });
        } catch (error) {
          console.error('Load more error:', error);
          res.status(500).json({ success: false, message: 'Failed to load more posts.' });
        }
      },
      getDetailPostPage: async (req, res) => {
        try {
          const { post_id } = req.query;

          if (!post_id) {
            return res.status(400).send('Post ID is required.');
          }

          const postDetail = await postService.getPostById(post_id); 

          if (!postDetail) {
            return res.status(404).send('Post not found.');
          }

          // get user data by user_id string
          const userObject = await userService.getUserById(postDetail.user_id); 
          let usercreator = "";
          if(userObject){
            usercreator = userObject?.name !== null ? userObject?.name : userObject?.email;
          }else{
            return res.status(404).send('User not found.');
          }
          
          // call function in service to check user already liked the post or not and the total likes
          const isLiked = req.user ? await likePostService.isPostLikedByUser(post_id, req.user.id) : false;
          const totalLikes = await likePostService.countLikesForPost(post_id);
          
          res.render('detailPostCommunity', {
            error: null,
            user: req.user,
            post: postDetail,
            usercreator: usercreator,
            totalLikes: totalLikes,
            isLikedByCurrentUser: isLiked
          });

        } catch (error) {
          console.error('Load detail post error:', error);
          res.render('detailPostCommunity', {
            error: 'Failed to fetch post',
            user: req.user,
            post: {},
            usercreator: null,
            totalLikes: 0,
            isLikedByCurrentUser: false
          });
          //res.status(500).send('Server error while loading post.');
        }
      },
      toggleLike: async (req, res) => {
        try {
          const { postId } = req.params;
          const userId = req.user.id;

          // Check if login user already liked post or not
          const existingLike = await likePostService.getAnyLikeRecord(postId, userId);

            // CASE: Login User already liked post --> post status == 'liked'
          if (existingLike && existingLike.status === 'liked') {
            await likePostService.updateLikeStatus(existingLike, 'deleted');

            // lessen the total likes number in db
            await postService.updateTotalLikes(postId, -1);

            return res.json({ success: true, liked: false });
          }else if (existingLike && existingLike.status === 'deleted') {
            // CASE: Login User ever like, and the undo like (status: deleted)
            await likePostService.updateLikeStatus(existingLike, 'liked');

            // add the total likes number in db
            await postService.updateTotalLikes(postId, 1);

            return res.json({ success: true, liked: true });
          } else{
            // CASE: Login User has not like the pos yet
            const post = await postService.getPostById(postId);
            if (!post) {
              return res.status(404).json({ success: false, message: 'Post not found' });
            }

            await likePostService.createNewLike({
              postId,
              creatorId: post.user_id,
              likerId: userId
            });

            // add the total likes number in db
            await postService.updateTotalLikes(postId, 1);

            return res.json({ success: true, liked: true });
          }

        } catch (error) {
          console.error('Error toggling like:', error);
          res.status(500).json({ success: false, message: 'Internal server error' });
        }
      }
}

module.exports = postController;
