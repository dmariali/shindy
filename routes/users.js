const express = require('express')
const router = express.Router()
const User = require('../models/user')

// All users Route
router.get('/', async (req, res) => {
    try {
        // passing an empty object into find() says that we have no conditions
        const users = await User.find({})
        res.render('users/index', {users: users})

    } catch {
        res.redirect('/')
    }
})

//New User Route -- this needs to be ABOVE /:id else it will never get to this
router.get('/new', (req, res) => {
    res.render('users/new', {user : new User()})
})

// Create new User - use POST for creation, and PUT for updating with REST
// info is from form in users/new.ejs 
router.post('/', async (req, res) => {
    const user = new User ({
        name: req.body.name, 
        password: req.body.password
    })
    try {
        const newUser = await user.save()
        res.redirect(`users/${newUser.id}`)
    } catch {
        res.render('users/new', {
            user: user,
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
                errorMessage: "Error updating user"
            })
        }
        
    }
})

router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        res.render('users/show', {
            user: user,
            gamesPlayed: ["GameOne", "GameTwo", "GameThree"]
        })
    } catch {
        res.redirect('/')
    }
})

//edit user
router.get('/:id/edit', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        res.render('users/edit', {user: user})
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
            res.redirect(`/authors/${author.id}`)
        }
        
    }
})

module.exports = router
