if (process.env.NODE_ENV !== "production") {
  require('dotenv').config()
}

//  LAUNCH SERVER AND ALL PACKAGES
const express = require ('express')
const app = express()
// express ejs layouts allows you to build a page template for all pages in your app
const expressLayouts = require('express-ejs-layouts')
// use the environment port (for heroku deployment) or 3000 if used locally
const PORT = process.env.PORT || 3000

// show flash messages
const flash = require ('express-flash')
const session = require ('express-session')
//allows us to use methods other than POST and GET in forms
const methodOverride = require ('method-override')
// make it easier to access the different input elements from our server
const bodyParser = require('body-parser')

// integrate mongodb into our application
const mongoose = require('mongoose')
// set up database connection
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true
})
const db = mongoose.connection 
db.on('error', error => console.error(error))
db.once('open', () => console.log("Connected to Mongoose"))

//connect router files
const userRouter = require("./routes/users")
const indexRouter = require("./routes/index")

const User = require('./models/user')

//set up how we will access our views - using ejs which we installed
app.set('view engine', 'ejs')

//define where our views will be stored (in a folder named views that's in our current directory)
app.set("views", __dirname+'/views')

// define where the layout file will be 
app.set('layout', 'layouts/layout')

//middlewares
app.use(express.static('public')) // all our js and css will be inside 'public' folder
app.use(expressLayouts)
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session ({
  secret: 'some-secret',
  resave: false,
  saveUninitialized : false
}))

app.use(methodOverride('_method'))
app.use(bodyParser.urlencoded({limit:'10mb', extended: false}))

//------ HANDLE ROUTING -------

// got to UserRouter for anything with subdomain /users
app.use('/users', userRouter)
app.use('/', indexRouter)

//------------ CONFIGURING SOCKET.IO ----------------

const server = require('http').Server(app)
// Listen on whatever the defined port is (not only 3000)
server.listen(PORT, () => {
    console.log(`listening on ${PORT}`)
})

//socket.io instantiation
const io = require("socket.io")(server)

//listen on every connection 
io.on('connection', socket => {
    let activeSockets = []

    //default username
    socket.username = "Anonymous"

    socket.on('join_room', (roomId, userId) => {
      socket.join(roomId)
      socket.to(roomId).broadcast.emit('user_connected', userId)

      console.log("join room here", userId, "and ", roomId)

      socket.on('disconnect', () => {
        socket.to(roomId).broadcast.emit('user_disconnected', userId)
      })
    })    

    //listen on new_chat_message
    socket.on('new_chat_message', (data) => {
        //emit the new message
        io.sockets.emit('new_chat_message', {message:data.message, name: data.user})
    })  
})