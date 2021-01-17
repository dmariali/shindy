const express = require('express')
const router = express.Router()
// handle authentication   
const passport = require ('passport') 
//use to generate random uuid for room url
const {v4: uuidV4} = require ('uuid')
// use to generate random 5 digit ID for room
const randomize = require ('randomatic')
const LocalStrategy = require ('passport-local').Strategy
const bcrypt = require ('bcrypt')

const User = require('../models/user')

var current_user = {id: 0, name: ""}

router.get('/', (req, res) => {
  // Go to the public homepage or user home page based on if they're logged in
  if (req.session.passport && Object.entries(req.session.passport).length !==0) {
    res.render('index-loggedin.ejs', {logged_in: true, user: current_user})
  } else {
    res.render('index-loggedout.ejs', {logged_in: false, user: {id: 0, name: ""}})
  }
})

// LOGIN AUTHENTICATION
router.use(passport.initialize())
router.use(passport.session())

passport.use(new LocalStrategy(
  function(username, password, done) {
    // using findOne because usernames should be unique
      User.findOne({ username: username }, function(err, user) {
        if (err) { return done(err); }
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        // use bcrypt to compare to the hashed password
        if (!bcrypt.compare(password, user.password)) {
            return done(null, false, { message: 'Incorrect password.' });
        }
        current_user = user
        return done(null, user);
      })
  }
  ))

  passport.serializeUser((user, done) => done(null, user.id))
  passport.deserializeUser((id, done) => { 
      User.findById(id, function(err, user) {
          done(err, user);
        })
  })

router.post ('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect : `/`,
  failureRedirect: '/login', 
  failureFlash: "Sorry, authentication failed, please try again"
}))

router.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs', {logged_in: false, user: {id:0, name:""}})
})

//Create a new room - generate a random 5 letter room code
router.post ('/create-room', checkAuthenticated, (req, res) => {
  res.redirect(`/${randomize("AAAAA")}`)
})

// when user enters the 5 letter code for a room they can enter 
// and communicate with others in the same room
router.post ('/join-room', checkAuthenticated, (req, res) => {  
  res.redirect(`/${req.body.room}`)
})

// dynamically assign the roomid to the uuid that's generated
// user cannot access a room unless authenticated
router.get('/:room', checkAuthenticated, (req, res) => {
  res.render('room.ejs', {roomID: req.params.room, logged_in: true, user: req.user})
})

// add logout functionality
router.delete('/logout', (req, res)=> {
  req.logOut()
  current_user = {id: 0, name: ""}
  res.redirect('/login')
})

// if user already authenticated don't take them to the new user or login pages
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

// if the user is not authenticated, take them to the login page
function checkAuthenticated (req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
    res.redirect('/login')
  }

module.exports = router