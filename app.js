//jshint esversion:6
require('dotenv').config()
const ejs = require('ejs');
const mongoose = require('mongoose');
const express = require('express');
const encrypt = require('mongoose-encryption');
const md5 = require('md5');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');
mongoose.connect("mongodb://localhost:27017/authDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// To see previous levels Check github repository commits section

const User = mongoose.model("User", userSchema);

app.get("/", function(req, res){
  res.render("home");
})


app.get("/login", function(req, res){
  res.render("login");
})


app.post("/login", function(req, res){
  const username = req.body.username;
  const pass = req.body.password;
  User.findOne({email: username}, function(err, foundUser){
    if (err) {
      res.send("There was an error")
    } else {
      if (foundUser) {
        bcrypt.compare(pass, foundUser.password, function(err1, result) {
          if (result === true) {
            res.render("secrets");
          }
          else{
            res.send("<h1>Incorrect Password</h1>");
          }
        });
      }
      else {
        res.send("<h1>Incorrect Username</h1>");
      }
    }
  })
})


app.get("/register", function(req, res){
  res.render("register");
})


app.post("/register", function(req, res){
  bcrypt.hash(req.body.password, 12, function(err, hash) {
    const newUser = new User({
      email: req.body.username,
      password: hash
    });
    newUser.save(function(err){
      if (err) {
        res.send("There was an error registering you");
      } else {
        res.render("secrets");
      }
    })

  });

})

app.get("/logout", function(req, res){
  res.render("home");
})




app.listen("3000", function(){
  console.log("Server running at port 3000");
});
