//jshint esversion:6
const ejs = require('ejs');
const mongoose = require('mongoose');
const express = require('express');
//const encrypt = require('mongoose-encryption');
const app = express();

app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');
mongoose.connect("mongodb://localhost:27017/authDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// const secret = "Thisismylittlesecretforencryption";
//
// userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']});

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
  User.findOne({email: username}, function(err, result){
    if (err) {
      res.send("There was an error")
    } else {
      if (pass === result.password) {
        res.render("secrets");
      }
      else{
        res.send("<h1>Incorrect Username/Password</h1>");
      }
    }
  })
})


app.get("/register", function(req, res){
  res.render("register");
})


app.post("/register", function(req, res){
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });
  newUser.save(function(err){
    if (err) {
      res.send("There was an error registering you");
    } else {
      res.render("secrets");
    }
  })
})

app.get("/logout", function(req, res){
  res.render("home");
})




app.listen("3000", function(){
  console.log("Server running at port 3000");
});
