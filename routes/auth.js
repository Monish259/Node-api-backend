const express = require('express');
const router = express.Router();
const{userById} = require('../controllers/user');
const {signUp,signIn,signOut,forgotPassword,resetPassword,socialLogin} = require('../controllers/auth');
const {userSignupValidator , passwordResetValidator} = require('../validator');//index file is automatically taken

router.post('/social-login',socialLogin);//use google login method
router.post('/signup', userSignupValidator ,signUp); //used validator as middleware here
router.post('/signin',signIn);//route for signing in
router.get('/signout',signOut);//route for signing out

// password forgot and reset routes
router.put("/forgot-password", forgotPassword);
router.put("/reset-password", passwordResetValidator, resetPassword);

//this also act as a middleware for every route
router.param("userId",userById); // any route containing userId then app will go to userById function first then go to that route

module.exports = router;