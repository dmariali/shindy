const express = require('express')
const router = express.Router()
// handle authentication   
const passport = require ('passport') 
//use to generate random uuid for room ids
const {v4: uuidV4} = require ('uuid')
const LocalStrategy = require ('passport-local').Strategy
const bcrypt = require ('bcrypt')

const User = require('../models/user')

router.get('/', (req, res) => {
  res.render('index.ejs', {logged_in: req.isAuthenticated()})
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
  successRedirect : `/${uuidV4()}`,
  failureRedirect: '/login', 
  failureFlash: "Sorry, authentication failed, please try again"
}))

router.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})

// dynamically assign the roomid to the uuid that's generated
// user cannot access a room unless authenticated
router.get('/:room', checkAuthenticated, (req, res) => {
  res.render('room.ejs', {roomId: req.params.room})
})

// add logout functionality
router.delete('/logout', (req, res)=> {
  req.logOut()
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