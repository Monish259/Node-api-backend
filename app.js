const express = require('express');
const app = express();
const fs = require('fs');
const morgan = require('morgan');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');//so that api works even if front end is on diff port and backend on diff
const expressValidator = require('express-validator');//not using latest version due to some configuration issues
dotenv.config();//to use env variables from env file

//db
mongoose.set('useFindAndModify', false);

mongoose.connect(process.env.MONGO_URI,
{ useUnifiedTopology: true , useNewUrlParser: true}
)
.then(() => console.log("DB connected"));

mongoose.connection.on("error",err => {
    console.log(`DB connection error : ${err.message}`);
});

//bring routes
const postRoutes = require('./routes/post');//for creating and reading posts
const authRoutes = require('./routes/auth');//for user creation , login and logout
const userRoutes = require('./routes/users');//for handelling user related queries
//api docs
app.get('/',(req,res) => {
  fs.readFile('docs/apiDocs.json',(err,data) => {
    if(err) return res.json({ err });
    const docs = JSON.parse(data);
    res.json(docs);
  });
});
//middleware
app.use(cors());//so that api works even if front end is on diff port and backend on diff
app.use(morgan('dev'));//for getting info about from which route request came and how much time it take (dev is parameter for morgan)
app.use(bodyParser.json());//for parsing body using .body function
app.use(cookieParser());//for parsing cookies 
app.use(expressValidator());//for showing understandable error messages and writing all validations.
app.use('/',postRoutes);//for creating and reading posts
app.use('/',authRoutes);//for user creation and login 
app.use('/',userRoutes);//for user related queries
app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      res.json({ Error : "Please Login First!!!" });
    }
  }); //middleware to handle unauthorized access to any page

const port = process.env.PORT || 8080;
app.listen(port , () => {
    console.log(`Node js api listening on port : ${port}`);
});