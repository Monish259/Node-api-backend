const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema; //extracting objectId parameter for making relationships b/w users and posts 

const postSchema = new mongoose.Schema({
    title: {
        type : String,
        required : 'title is required',
        minlength : 4,
        maxlength : 100
    },
    body: {
        type : String,
        minlength : 4,
        maxlength : 2000
    },
    photo: {
        data : Buffer,
        contentType : String
    },
    postedBy: {
        type : ObjectId,
        ref : "User" //refering User model for making relationships
    },
    created: {
        type : Date,
        default : Date.now
    },
    updated : Date,
    likes : [{ type : ObjectId , ref : "User" }],
    comments : [{
        text : String,
        postedBy : { type : ObjectId , ref : "User" },
        created : { type : Date , default : Date.now }
    }]
});

module.exports = mongoose.model("Post",postSchema);