//jshint esversion:6
require('dotenv').config()
const ejs = require('ejs');
const mongoose = require('mongoose');
const express = require('express');
const encrypt = require('mongoose-encryption');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findOrCreate = require('mongoose-findorcreate');
const FacebookStrategy = require('passport-facebook');
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
  password: String,
  googleId:String,
  facebookId: String,
  secret: String
});

//used to hash and salt schema
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// To see previous levels Check github repository commits section

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});


passport.use(new GoogleStrategy({
    clientID:process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

///////////////////   facebook        ////////////////////////
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({facebookId: profile.id}, function(err, user) {
      return cb(err, user);
    });
  }
));

app.get("/auth/facebook",
    passport.authenticate("facebook")
  );

app.get("/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });
/////////////////////// facebook code ends here //////////////

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

// google popup authentication if successful google redirects to /auth/google/secrets
app.get('/auth/google',
  passport.authenticate('google', {scope: [ 'profile' ] }
));

// authenticate locally
app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        successRedirect: '/secrets',
        failureRedirect: '/login'
}));

app.get("/register", function(req, res){
  res.render("register");
})


app.get("/secrets", function(req, res){
  User.find({"secret": {$ne: null}}, function(err, foundSecretUser){
    if (err) {
      console.log("No secret error \n"+err);
    } else {
      if (foundSecretUser) {
        res.render("secrets", {userSecret: foundSecretUser});
      }
    }
  })
})

app.get("/submit", function(req, res){
  // here the req object is used as cookie, if it exists then no need for user to login
  if(req.isAuthenticated()){  //passport method check if user is logged in
    res.render("submit");
  }
  else {
    res.redirect("/login");
  }
});

app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;
  User.findById(req.user._id, function(err, foundUser){
    if (err) {
      console.log("error in finding secret "+err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets")
        })
      }
    }
  })
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
