const express = require('express');
const router = express.Router();
const{
userById,
allUsers,
getUser,
updateUser,
deleteUser,
hasAuthorization,
updatePassword,
userPhoto,
addFollower,
addFollowing,
removeFollowing,
removeFollower,
findPeople
} = require('../controllers/user');
const {requireSignin} = require('../controllers/auth');
//const {userSignupValidator} = require('../validator');//index file is automatically taken

router.put('/user/follow',requireSignin,addFollowing,addFollower); // adding data to following and follower list
router.put('/user/unfollow',requireSignin,removeFollowing,removeFollower); // adding data to following and follower list
router.get('/users' ,allUsers); //used validator as middleware here
router.get('/user/:userId', requireSignin ,getUser);//user requireSignin as middleware to check if authorized user is only able to change his profile data
router.put('/user/:userId', requireSignin , hasAuthorization ,updateUser);//to update user profile 
router.put('/user/updatePwd/:userId', requireSignin , hasAuthorization ,updatePassword);//to update user password 
router.delete('/user/:userId', requireSignin , hasAuthorization ,deleteUser);//to delete user profile 
router.get('/user/photo/:userId', userPhoto); // to get user photo separately
router.get('/user/findPeople/:userId',requireSignin,findPeople);//route to display people not followed by logged in user 

//this also act as a middleware for every route
router.param("userId",userById); // any route containing userId then app will go to userById function first then go to that route

module.exports = router;