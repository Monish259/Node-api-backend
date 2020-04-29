const Post = require('../models/post');
const formidable = require('formidable');//to handle file uploads
const fs = require('fs');//to access file system
const _ = require('lodash');//to update data in db 


exports.postById = (req,res,next,id) => {//id coming from any route
    Post.findById(id)
    .populate("postedBy","_id name")//populate is used as join and used to ObjectId from postedBy to get fields from User schema
    //.populate('comments','text created')
    .populate('comments.postedBy','_id name')
    .exec( (err,post) => {
        if(err) return res.status(400).json({ error : err });
        req.post = post;//adding new post parameter to req object
        next();
    })
};

exports.getPosts = (req,res) => {
   const posts  = Post.find()
    .populate("postedBy" , "_id name") //used to fecth other documents using _id here
    //.populate('comments','text created')
    .populate('comments.postedBy','_id name')
    .select("_id title body created likes")//selecting values required to display after populating
    .then(posts => {
        res.json(posts)
   }).catch(err => console.log('error'));
   
};

exports.createPost = (req,res) => {
    let form = new formidable.IncomingForm();//for this method to work for postman we have to select x-www-form-urlencoded
    form.keepExtensions = true;
    form.parse(req, (err,fields,files) => {
        if(err) {
            return res.status(400).json({error:'Image not uploaded'})
        }
        let post = new Post(fields);
        req.profile.hashed_password = undefined;
        req.profile.salt = undefined;
        post.postedBy = req.profile;    //gets _id from user and save it in posted by field
        if(files.photo){
            post.photo.data = fs.readFileSync(files.photo.path);
            post.photo.contentType =  files.photo.type;
        }
        post.save( (err,result) => {
            if(err) return res.status(400).json({ error : err });
            res.json(result);
        });
    });
};

exports.postsByUser = (req,res) => {
    Post.find({ postedBy : req.profile._id })
    .populate("postedBy" , "_id name")
    .select("_id title body created likes")//selecting values required to display
    .sort("created")
    .exec((err,posts) =>{
        if(err) res.status(400).json({error : err});
        res.json(posts);
    })
};

exports.isPoster = (req,res,next) => {
    let isPoster = req.post && req.auth && req.post.postedBy._id == req.auth._id;
    if(!isPoster)
    return res.status(400).json({ error : "User is not authorized !!" });

    next();
};

exports.deletePost = (req,res) => {
    let post = req.post;
    post.remove( (err,post) => {
        if(err) return res.status(400).json({ error : "error in deleting post !!" });

        res.json({ message : "Post is deleted successfuly" });
    });
};

//update post
exports.updatePost = (req,res) => {

    let form = new formidable.IncomingForm(); //getting formData from frontend as Multipart/formData
    form.keepExtensions = true;
    form.parse(req , (err,fields,files) => {   //callback function accepting error , fields and files
        if(err) return res.status(400).json({ error : "Photo could not be uploaded !!" });

        //save post
        let post = req.post;
        post = _.extend(post,fields);
        post.updated = Date.now();

        if(files.photo){
            post.photo.data = fs.readFileSync(files.photo.path); //getting photo path synchronously
            post.photo.contentType = files.photo.type;
        }

        post.save( (err,result) =>{
            if(err) {
                return res.status(400).json({
                    error : err
                });
            }

            res.json(result);

        });

    });

};


//get post photo
exports.postPhoto = (req,res) => {
    if(req.post.photo.data) {
    
        res.set("Content-Type",req.post.photo.contentType);
        return res.send(req.post.photo.data);
    }
    
    return res.send("no data");
    
    };


//to get single post
exports.getSinglePost = (req,res) => {
    res.json(req.post);
}


//to delete all posts related to user deleted
exports.deleteUserPosts = (req,res) => {

    const userId = req.profile._id;
    console.log(" INSIDE POST CONTROLLER DELETE ALL POSTS OF USERID : " + userId);

    Post.deleteMany( {postedBy : userId} )
    .exec( (err,result) => {
        if(err) return res.status(400).json({ error : err });
        res.json( {"message" : "successfully remove posts created by user"} );
    });
};

//like post
exports.like = (req,res) => {
    console.log(" YO u hit like button mann!!! POSTID :" + req.body.postId + "  USERID : " + req.body.userId) ;
    Post.findByIdAndUpdate( req.body.postId , { $push : {likes : req.body.userId}} ,{ new : true })
    .exec( (err,result) => {
        if(err) return res.status(400).json({ error : err });
       
        else {console.log(result);
        res.json(result);
        }
    });

};

//unlike post
exports.unlike = (req,res) => {
    const {postId,userId} = req.body;
    Post.findByIdAndUpdate( postId , { $pull : {likes : userId}} ,{ new : true })
    .exec( (err,result) => {
        if(err) return res.status(400).json({ error : err });
        else res.json(result);
    });

};

//comment
exports.comment = (req, res) => {
    let comment = req.body.comment;
    comment.postedBy = req.body.userId;

    Post.findByIdAndUpdate(req.body.postId, { $push: { comments: comment } }, { new: true })
        .populate('comments.postedBy', '_id name')
        //.populate('postedBy', '_id name')
        .exec((err, result) => {
            if (err) return res.status(400).json({error: err});
            else res.json(result);
        });
};

//uncomment
exports.unComment = (req, res) => {
    let comment = req.body.comment;

    Post.findByIdAndUpdate(req.body.postId, { $pull: { comments: { _id: comment._id } } }, { new: true })
        .populate('comments.postedBy', '_id name')
        //.populate('postedBy', '_id name')
        .exec((err, result) => {
            if (err)  return res.status(400).json({ error: err }); 
            else res.json(result);
        });
};
