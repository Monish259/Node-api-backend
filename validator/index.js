exports.createPostValidator = (req,res,next) => {
    //title
    req.check('title','write a title').notEmpty() //first parameter = req body parameter , 2nd parameter = error message
    req.check('title','Title must be between 4 and 100 characters').isLength({
        min : 4,
        max : 100
    });
    //body
    req.check('body','write a body').notEmpty()
    req.check('body','Body must be between 4 and 2000 characters').isLength({
        min : 4,
        max : 2000
    });

    //check for errors
    const errors = req.validationErrors(); //all errors found using check method is accumulated here
    if(errors){
        const firstError = errors.map( (error) => error.msg )[0]
        return res.status(400).json({
            error : firstError
        })
    }
    //proceed to next middleware
    next();
};


exports.userSignupValidator = (req,res,next) => {
    //username
    req.check('name','Name is required!!').notEmpty() //first parameter = req body parameter , 2nd parameter = error message
    //Email 
    req.check('email','Email is required!!').notEmpty()
    .matches(/.+\@.+\..+/) //using regular expression for checking invalid email ids
    .withMessage('Invalid email!!');
    //Password
    req.check('password','Password is Required!!').notEmpty()
    req.check('password','Password must contain atleast 8 characters').isLength({
        min : 8
    }).
    matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/)//using regular expression for password strength
    .withMessage('Password must contain atlest 1 lowercase character , 1 uppercase character , 1 numeric character , 1 special character');

    //check for errors
    const errors = req.validationErrors(); //all errors found using check method is accumulated here
    if(errors){
        const firstError = errors.map( (error) => error.msg )[0]
        return res.status(400).json({
            error : firstError
        })
    }
    //proceed to next middleware
    next();
};

//validating while reseting password afer using forgot password link
exports.passwordResetValidator  = (req,res,next) => {
    //Password
    console.log("NEW PASSWORD : " ,req.body.newPassword);
    req.check('newPassword','Password is Required!!').notEmpty()
    req.check('newPassword','Password must contain atleast 8 characters').isLength({
        min : 8
    }).
    matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/)//using regular expression for password strength
    .withMessage('Password must contain atlest 1 lowercase character , 1 uppercase character , 1 numeric character , 1 special character');

    //check for errors
    const errors = req.validationErrors(); //all errors found using check method is accumulated here
    if(errors){
        const firstError = errors.map( (error) => error.msg )[0]
        return res.status(400).json({
            error : firstError
        })
    }
    //proceed to next middleware
    next();
};