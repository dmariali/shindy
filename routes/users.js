const express = require('express')
const router = express.Router()
const User = require('../models/user')
//for encrypting the password
const bcrypt = require ('bcrypt')
// handle authentication   
const passport = require ('passport') 

router.use(passport.initialize())
router.use(passport.session())

// All users Route
router.get('/', checkAuthenticated, async (req, res) => {
    try {
        // passing an empty object into find() says that we have no conditions
        const users = await User.find({})
        res.render('users/index', {users: users, logged_in: true, user: req.user})

    } catch {
        res.redirect('/')
    }
})

//New User Route -- this needs to be ABOVE /:id else it will never get to this
router.get('/new', checkNotAuthenticated, (req, res) => {
    res.render('users/new', {user : new User(), logged_in: false})
})

// Create new User - use POST for creation, and PUT for updating with REST
// info is from form in users/new.ejs 
router.post('/', async (req, res) => {
    const hashedPassword = await bcrypt.hash (req.body.password, 10) 

    const user = new User ({
        username: req.body.username,
        email: req.body.email,
        name: req.body.name, 
        password: hashedPassword,
        verified: false
    })
    try {
        const newUser = await user.save()
        res.redirect(`/users/${newUser.id}`)
    } catch {
        res.render('users/new', {
            user: user,
            logged_in: false,
            errorMessage: "Error creating user"
        })
    }
})

// Update existing User (info from form in users/edit.ejs)
router.put('/:id', async (req, res) => {
    let user
    try {
        user = await User.findById(req.params.id)
        user.name = req.body.name
        user.password = req.body.password
        await user.save()
        res.redirect(`/users/${user.id}`)
    } catch {
        if (user === null) {
            res.redirect('/')
        } else {
            res.render('users/edit', {
                user: user,
                logged_in: true,
                errorMessage: "Error updating user"
            })
        }
        
    }
})

// show user profile
router.get('/:id', checkAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        res.render('users/show', {
            user: user,
            logged_in: true,
            gamesPlayed: ["GameOne", "GameTwo", "GameThree"],
        })
    } catch {
        res.redirect('/')
    }
})

//edit user
router.get('/:id/edit', checkAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        res.render('users/edit', {user: user, logged_in: true})
    } catch {
        res.redirect('/users')
    }
})

router.delete('/:id', async (req, res)=> {
    let user
    try {
        user = await User.findById(req.params.id) 
        await user.remove()
        res.redirect(`/users`)
    } catch {
        if (user === null) {
            res.redirect('/')
        } else {
            res.redirect(`/users/${user.id}`)
        }
        
    }
})

// if the user is not authenticated, take them to the login page
function checkAuthenticated (req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
    res.redirect('/login')
  }

// if user already authenticated don't take them to the new user or login pages
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/users/show')
    }
    next()
  }

module.exports = router
