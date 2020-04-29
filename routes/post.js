const express = require('express');
const router = express.Router();
const{userById} = require('../controllers/user');
const {requireSignin} = require('../controllers/auth');
const {getPosts,createPost,postsByUser,postById,deletePost,isPoster,updatePost,postPhoto,getSinglePost,deleteUserPosts,like,unlike,comment,unComment} = require('../controllers/post');
const {createPostValidator} = require('../validator');//index file is automatically taken
//params are used only when required to run below mentioned functions

router.get('/posts',getPosts);  //requireSignin is used as middleware to check if user is logged in or not

router.put('/post/like',requireSignin,like);//like post
router.put('/post/unlike',requireSignin,unlike);//unlike post

//comments
router.put('/post/comment',requireSignin,comment);
router.put('/post/uncomment',requireSignin,unComment);

router.get('/post/:postId',getSinglePost); //to get post based on postId
router.post('/post/new/:userId', requireSignin , createPost ); //used validator as middleware here for post creation
router.get('/post/by/:userId' , requireSignin , postsByUser)//to show posts created by signed in user 
router.put('/post/:postId', requireSignin , isPoster ,updatePost);//to update post
router.delete('/post/:postId', requireSignin , isPoster ,deletePost);//to delete any post created by signed in user 
router.get('/post/photo/:postId',postPhoto) //get photo of post

router.delete('/posts/:userId',requireSignin,deleteUserPosts);//delete all posts created by deleted user

//this also act as a middleware for every route
router.param("userId",userById); // any route containing userId then app will go to userById function first then go to that route
//this also act as a middleware for every route
router.param("postId",postById); // any route containing postId then app will go to postById function first then go to that route

module.exports = router;