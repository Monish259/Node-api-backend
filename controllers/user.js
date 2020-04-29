const _ = require('lodash');//to update data in db
const User = require('../models/users');
const formidable = require('formidable');//to handle file uploads
const fs = require('fs');//to access file system

//to save logged in user data in req profile parameter
exports.userById = (req,res,next,id) => { //id is userId coming from any route 
User.findById(id)
.populate('followers','_id name')  //populating followers array with _id and name fields
.populate('following','_id name')  //populating following array with _id and name fields
.exec((err,user) => { 
    if(err || !user) {
        res.status(400).json({ Error : "User not found!!!!!" });
    }
    req.profile = user; //if user is found with id given in req body then user data is stored in newly createed object profile in request body itself for further use
    next();
}) ;
};

//to check if only profile owner is changing profile data
exports.hasAuthorization = (req,res,next) => {
    const authorized = req.profile && req.auth && req.profile._id == req.auth._id;
    console.log( authorized +"   " +req.profile._id + " auth :  " + req.auth._id);
    if(!authorized){
        return res.status(400).json({
            Error : "You are not authorized to perform this action"
        });
    }
    next();
};

//to get users list
exports.allUsers = (req,res) => {
    User.find((err,users) => {
        if(err){
            res.status(400).json({
                Error : err
            });
        }
        res.json(users); //sending array of user objects to front end
    }).select("name email created updated about");//selecting fields which needs to be sent from user document to frontend
};

//to get user profile
exports.getUser = (req,res) => {
    req.profile.salt  = undefined;
    req.profile.hashed_password = undefined; 
    return res.json({ user : req.profile });
};

//update user profile and also handeling incoming files
exports.updateUser = (req,res,next) => {
    let user = req.profile;
    let form = new formidable.IncomingForm(); //getting formData from frontend as Multipart/formData
    form.keepExtensions = true;
    form.parse(req , (err,fields,files) => {   //callback function accepting error , fields and files
        if(err) return res.status(400).json({ error : "Photo could not be uploaded !!" });

        //save user
        let user = req.profile;
        user = _.extend(user,fields);
        user.updated = Date.now();

        if(files.photo){
            user.photo.data = fs.readFileSync(files.photo.path); //getting photo path synchronously
            user.photo.contentType = files.photo.type;
        }

        user.save( (err,result) =>{
            if(err) {
                return res.status(400).json({
                    error : err
                });
            }

            user.hashed_password = undefined;
            user.salt = undefined;
            res.json(user);

        });

    });

};

    
//to get user image
exports.userPhoto = (req,res,next) => {
if(req.profile.photo.data) {

    res.set("Content-Type",req.profile.photo.contentType);
    return res.send(req.profile.photo.data);
}

return res.send("no data");

};


//to delete user profile from db
exports.deleteUser = (req,res,next) => {
    let user = req.profile;
    user.remove( (err,deletedUser) => {
        if(err) return res.status(400).json({ "Error" : err });
        res.json({ "Message" : "user successfuly deletd" });
    });   
};

//to update password of user
exports.updatePassword =  (req,res,next) => {  //have to set undefined for id,currentPassword so that required fields are updated only
    let user = req.profile;
    const {id,currentPassword,hashed_password} = req.body;
    console.log("inside update password function");

    const userExists =  User.findOne({ _id : id }); //async and await used that next await works when first await is over and finding user by ObjectId 
    if(userExists) {
        
        let checkPassword = user.encryptPassword(currentPassword,user.salt);
        
        if(checkPassword !== user.hashed_password) return res.status(400).json({ error : "Please enter correct password!!" }); //checking if entered password is correct
        
        else {
            req.body.currentPassword = undefined;
            req.body.id =undefined;
            req.body.hashed_password = user.encryptPassword(hashed_password,user.salt);

            user = _.extend(user , req.body); //user data is updated with data provided in req body
            user.updated = Date.now();
            user.save( (err,user) => { 
                if(err)
                    return res.status(400).json({ Error : "Not Authohrized for this action !!!" });
                   
                user.hashed_password = undefined;
                user.salt = undefined;
        
                res.json({ user });
             });
        }
    }
};


//for following and follower list update

exports.addFollowing = (req,res,next) => {
    User.findByIdAndUpdate( 
        req.body.userId,    //followId = that userId user has followed followId user ** userId -> followId (userId following followId)
        {$push : { following : req.body.followId }}, //push means inserting data to following list
        (err,result) => {
            if(err) return res.status(400).json({ error : err });
            next();
        }
     ); 

};

exports.addFollower = (req,res) => {
    User.findByIdAndUpdate(
        req.body.followId,
        {$push : { followers : req.body.userId }},
        {new : true}
    )
    .populate('following','_id name')
    .populate('followers','_id name')
    .exec( (err,result) => {
        if(err) return res.status(400).json({ error : err });

        result.hashed_password = undefined;
        result.salt = undefined;

        res.status(200).json(result); 
    });

};

//for following and follower list user removal

exports.removeFollowing = (req,res,next) => {
    User.findByIdAndUpdate( 
        req.body.userId,    //followId = that userId user has followed followId user ** userId -> followId (userId following followId)
        {$pull : { following : req.body.unFollowId }}, //push means inserting data to following list
        (err) => {
            if(err) return res.status(400).json({ error : err });
            next();
        }
     ); 

};

exports.removeFollower = (req,res,next) => {
    User.findByIdAndUpdate(
        req.body.unFollowId,
        {$pull : { followers : req.body.userId }},
        {new : true}
    )
    .populate('following','_id name')
    .populate('followers','_id name')
    .exec( (err,result) => {
        if(err) return res.status(400).json({ error : err });

        result.hashed_password = undefined;
        result.salt = undefined;

        res.status(200).json(result); 
    });

};

//to display people which signed in user is not following
exports.findPeople = (req,res) => {
    let following = req.profile.following;
    following.push(req.profile._id);
    User.find( { _id : {$nin : following} } ,(err,result) => {
        if(err) return result.status(400).json({ error : err });

        res.status(200).json( result );
    }).select('name');

};
