const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    res.render('index.ejs', {logged_in: true})
})

// if the user is not authenticated, take them to the login page
function checkAuthenticated (req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
    res.redirect('/login')
  }

module.exports = router