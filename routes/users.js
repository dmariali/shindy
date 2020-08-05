const express = require('express')
const router = express.Router()
const User = require('../models/user')

// All users Route
router.get('/', async (req, res) => {
    try {
        // passing an empty object to find says that we have no conditions
        const users = await User.find({})
        res.render('users/index', {users: users})

    } catch {
        res.redirect('/')
    }
})

//New User Route
router.get('/new', (req, res) => {
    res.render('users/new', {user : new User()})
})

// Create new User - use POST for creation, and PUT for updating with REST
router.post('/', async (req, res) => {
    const user = new User ({
        name: req.body.name
    })
    try {
        const newUser = await user.save()
        // res.redirect(`users/${newUser.id}`)
        res.redirect('users/')
    } catch {
        res.render('users/new', {
            user: user,
            errorMessage: "Error creating user"
        })
    }
})

module.exports = router
