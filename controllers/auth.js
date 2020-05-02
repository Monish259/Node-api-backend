const User = require('../models/users');
const _ = require("lodash");
const { sendEmail } = require("../helpers");
const dotenv = require('dotenv');
const expressJwt = require('express-jwt');
const jwt = require('jsonwebtoken');
dotenv.config();

exports.signUp = async (req,res) => {
    const userExists = await User.findOne({ email : req.body.email }); //async and await used that next await works when first await is over
    if(userExists) return res.status(400).json({ error : "Email already exsits!!" });

    const user = await new User(req.body); //creating new instance of model User 
    //using schema methods

    const {password} = req.body;//deconstructing req body to extract password
    
    user.salt = user.generateSalt(); //used for generating unique salt for each user
  //  console.log(" salt before saving: " + user.salt + "password before saving : " + password);
    user.hashed_password = user.encryptPassword(password,user.salt);//to encrypt password using hash string and crypto function of node js
    await user.save();

   // res.json({ user : user}); //for debugging purpose to check value of req body

    res.json({ message : "Signup success ! Please Login" });

};


exports.signIn = async (req,res) => {
    const {email,password} = req.body;
    //check if email exists
    await User.findOne({email} , (err,user) => {
            //if error comes or user with entered email is not registered
            if(err || !user) {
               return res.status(400).json({
                    error : "Email not registered!!"
                });
            }
            const {_id , name , email,salt} = user; //destructuring instance of User model (user)

            //check if email and password match with authenticate method given in userSchema
            const tempHash = user.authenticate(password,salt); //storing hashed_password generated with given password
           // console.log( " salt : " + user.salt + " Password :  " + password + " tempHash : " + tempHash + "  hashedPassword :  "  + user.hashed_password);
            if(tempHash !== user.hashed_password){  //check if entered password and saved password is same 
                return res.status(400).json({
                    error : "Email and Password do not match"
                });

            }

            //generate a token with userid and secret ........jsonwebtoken for user authentication
            const token = jwt.sign({ _id } ,process.env.JWT_SECRET );
            //persist this token as 't' in cookie with expiry date
            res.cookie('t' , token , {expire : new Date() + 9000});//expiry is current time + 9999 secs for current cookie
            //return response with user and token to frontend client
            return res.json({
                // message : "Login Successful"
                token,
                user : {_id,email,name}
            });
        
    });

};


exports.signOut = (req,res) => {
res.clearCookie("t");
return res.json({
message : "Signout Successful!!"
});

};


exports.requireSignin = expressJwt ({
    secret: process.env.JWT_SECRET, //checks if token created after signin of this user matches when trying to hit diff routes
    userProperty: "auth"    //creates user property with name auth having authorized user_id
});

//send link to user email to reset password
exports.forgotPassword =  async (req,res) => {
    if (!req.body) return res.status(400).json({ message: "No request body" });
    if (!req.body.email)
        return res.status(400).json({ message: "No Email in request body" });
    console.log("forgot password finding user with that email");

    const {email} = req.body;
    await User.findOne({email} ,(err,user) => {
        if(err || !user) 
        return res.status("401").json({
            error: "User with that email does not exist!"
        });

         // generate a token with user id and secret
        const token = jwt.sign(
            { _id: user._id, iss: "NODEAPI" },
            process.env.JWT_SECRET
        );

        // email data holding all info of body 
        const emailData = {
            from: "noreply@node-react.com",
            to: email,
            subject: "Password Reset Instructions",
            // text: `Please use the following link to reset your password: 
            // ${ process.env.CLIENT_URL}/reset-password/${token}`,
            html: `<p>Please use the following link to reset your password:</p> <p>
            ${process.env.CLIENT_URL}/reset-password/${token}</p>`
        };
        //adding token to user data to check which user has sent request to reset password
       /*return*/ user.updateOne({ resetPasswordLink: token }, (err, success) => {
            if (err) {
                return res.json({ message: err });
            } else {
                sendEmail(emailData);
                return res.status(200).json({
                    message: `Email has been sent to ${email}. Follow the instructions to reset your password.`
                });
            }
        });
    });
};

//to reset password
exports.resetPassword = async(req, res) => {
    let { resetPasswordLink, newPassword } = req.body;

    await User.findOne({ resetPasswordLink }, (err, user) => {
        // if err or no user
        if (err || !user)
            return res.status("401").json({
                error: "Invalid Link!"
            });
        newPassword = user.encryptPassword(newPassword,user.salt); //creating hashed password to save in db
      //updatin resetPasswordLink so that it can be used only once
        const updatedFields = {
            hashed_password: newPassword,
            resetPasswordLink: ""
        };

        user = _.extend(user, updatedFields);
        user.updated = Date.now();

        user.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json({
                message: `Great! Now you can login with your new password.`
            });
        });
    });
};

//to login via google
exports.socialLogin = (req,res) => {
    let user = User.findOne({ email: req.body.email }, (err, user) => {
        if (err || !user) {
            // create a new user and login
            console.log(" INSIDE SOCIAL LOGIN : " , req.body);
            user = new User(req.body);
            req.profile = user;
            const {password} = req.body;//deconstructing req body to extract password
            user.salt = user.generateSalt(); //used for generating unique salt for each user
            //  console.log(" salt before saving: " + user.salt + "password before saving : " + password);
            user.hashed_password = user.encryptPassword(password, user.salt);
            user.save();
            // generate a token with user id and secret
            const token = jwt.sign(
                { _id: user._id, iss: "NODEAPI" },
                process.env.JWT_SECRET
            );
            res.cookie("t", token, { expire: new Date() + 9999 });
            // return response with user and token to frontend client
            const { _id, name, email } = user;
            return res.json({ token, user: { _id, name, email } });
        } else {
            // update existing user with new social info and login
            req.profile = user;
            const {password} = req.body;//deconstructing req body to extract password
            user.salt = user.generateSalt(); //used for generating unique salt for each user
            //  console.log(" salt before saving: " + user.salt + "password before saving : " + password);
            req.body.password = user.encryptPassword(password, user.salt);
            user = _.extend(user, req.body);
            user.updated = Date.now();
            user.save();
            // generate a token with user id and secret
            const token = jwt.sign(
                { _id: user._id, iss: "NODEAPI" },
                process.env.JWT_SECRET
            );
            res.cookie("t", token, { expire: new Date() + 9999 });
            // return response with user and token to frontend client
            const { _id, name, email } = user;
            return res.json({ token, user: { _id, name, email } });
        }
    });
};
     