var passport = require('passport')
const LocalStrategy = require ('passport-local').Strategy
const bcrypt = require ('bcrypt')

const User = require('/models/user')


function initialize(passport, getUserByUsername, getUserById) {
    passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({ username: username }, function(err, user) {
        if (err) { return done(err); }
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        if (!user.validPassword(password)) {
            return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
        });
    }
    ));
}

// function initialize(passport, getUserByUsername, getUserById) {
//     const authenticateUser =  async (username, password, done) => {
//         console.log("dmariali - inside initialize ", username, password)

//         const user = getUserByUsername(username)
//         console.log("dmariali - inside initialize ", user)

//         if (user == null) {
//             return done (null, false, {message: "No user with that username"})            
//         }

//         try {
//             if (await bcrypt.compare (password, user.password)) {
//                 return done(null, user)
//             } else {
//                 return done(null, false, {message: "Password incorrect"})
//             }
//         } catch (e) {
//             return done(null, false, {message: "Error getting user"})
//         }
//     }

    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((id, done) => { 
        User.findById(id, function(err, user) {
            done(err, user);
          })
    })
// }

module.exports = initialize