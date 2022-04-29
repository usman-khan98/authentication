//jshint esversion:6
require('dotenv').config()
const ejs = require('ejs');
const mongoose = require('mongoose');
const express = require('express');
const encrypt = require('mongoose-encryption');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const app = express();

app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');

app.use(session({
  secret: 'This is my Little secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/authDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

//used to hash and salt schema
userSchema.plugin(passportLocalMongoose);

// To see previous levels Check github repository commits section

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
  res.render("home");
})


app.get("/login", function(req, res){
  res.render("login");
})

app.post("/login", function(req, res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function(err){
        if (err) {
          console.log(err);
          res.redirect("/login");
        } else {
          res.redirect("/secrets");
        }
      })
    }
  })
})


app.get("/register", function(req, res){
  res.render("register");
})


app.get("/secrets", function(req, res){
  // here the req object is used as cookie, if it exists then no need for user to login
  if(req.isAuthenticated()){  //passport method
    res.render("secrets");
  }
  else {
    res.redirect("/login");
  }
})

app.post("/register", function(req, res){
  User.register({username:req.body.username},req.body.password,function(err,user){
      if(err){
        console.log("Error in registering.",err);
        res.redirect("/register");
      } else{
          passport.authenticate("local")(req,res, function(){
            res.redirect("/secrets");
        });
    }});
});


app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
})



app.listen("3000", function(){
  console.log("Server running at port 3000");
});
