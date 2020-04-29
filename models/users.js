const mongoose = require('mongoose');
const uuidv1 = require('uuid/v1');//for timestamp
const crypto = require('crypto');//for hashng password
const {ObjectId} = mongoose.Schema;

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        trim : true,
        required : true
    },

    email : {
        type : String,
        trim : true,
        required : true
    },

    hashed_password: {
        type : String
      //  required : true  // this is commented because it will create pathh error is left as true
    },

    salt : String,//randomly generated string for storing passwords

    created : {
        type : Date,
        default : Date.now //give current date when user is created 
    },

    updated : Date, //store date when user is modified

    photo : {
        data : Buffer,
        contentType : String
    },

    about : {
        type : String,
        trim : true
    },

    followers : [{ type : ObjectId , ref : 'User' }],   //referencing User model with ObjdeId
    following : [{ type : ObjectId , ref : 'User' }],
    resetPasswordLink: {        //link sent to user email to reset password
        data: String,
        default: ""
    }

});

//virtual field
// userSchema.virtual('password') //password is virtual field data from user comes here then actions happens on it then it is saved in database in hashed form
// .set( password => {
//     creating temp field called _password
//     this._password = password;
//     generate timestamp for salt field 
//     this.salt = uuidv1();
//     encrypt password
//    this.hashed_password = this.encryptPassword(password);

// })
// .get( () => {return this._password;});

//methods
userSchema.methods = { 

    generateSalt : () => {
        return uuidv1();
    },

    //this function encrypts the password into hashed form using salt saved in db
    authenticate : (password,salt) => {
        return  crypto //setting hashed password value equal to crypto generated hash
        .createHmac("sha1",salt) //salt is key here and sha1 is hashing standard
        .update(password)
        .digest("hex");
    },

    encryptPassword : (password,salt) => { 
        //this.salt = uuidv1();
        console.log(' inside encryptPassword function Password :' + password + " salt : " + salt);
        if(!password) return "";
        try{
            return  crypto //setting hashed password value equal to crypto generated hash
            .createHmac("sha1",salt) //salt is key here and sha1 is hashing standard
            .update(password)
            .digest("hex");

            // console.log(" hashed password : " + this.hashed_password + " salt : " + this.salt);

        } catch (err) {
            return  "";
        }
    }
};


module.exports = mongoose.model('User',userSchema);