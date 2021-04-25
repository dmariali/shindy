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

//----Require Custom built modules-------
//Import utility functions for user actions from utils.js
const {userJoin,userLeave, getRoomUsers} = require('./utils')

const tictactoe_server = require('./games_servers/tictactoe_server')


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
//socket.io instantiation. The exports.io statement allows the io server to be used by other modules. See tictactoe_server.js for an example
const io = exports.io = require("socket.io")(server)

//------------ CONFIGURING CHATROOM COMMUNICATIONS ----------------

//Define chat namespace 
const chatNsp = io.of('/chatNsp')

//listen on every connection
chatNsp.on('connection', socket => {

    socket.on('join_room', (user) => {
	  socket.join(user.room)
	  userJoin(user)
    const user_list = getRoomUsers(user.room)
    //Emit to all users in the room including the sender
    socket.to(user.room).emit('user_connected', user,user_list)
    console.log("User List on Userconnected: ",user_list.map(user=>user.name))
	  
    })    

    //listen on new_chat_message
    socket.on('new_chat_message', (data, roomId) => {
        //emit the new message to everyone in the room including sender
		chatNsp.to(roomId).emit('new_chat_message', {message:data.message, name: data.user})
	}) 
	
  socket.on('disconnecting',()=>{
    socket_rooms = Object.keys(socket.rooms).splice(1,Object.keys(socket.rooms).length-1)
    socket_id = socket.id //socketID of departing socket
    try {
      userWhoLeft = userLeave(socket_id)[0]//remove user from user array
      console.log("Disconnecting Socket's Username: ", userWhoLeft.name)

    new_room_list = getRoomUsers(socket_rooms[0]) //get list of users in room
    console.log("Users left in that socket's room",new_room_list.map(user=>user.name))

    //Emit to all users in the chat namespace the user who has left
    io.of('/chatNsp').emit('user_disconnected',userWhoLeft)

    } 
    catch(error){"No users to be disconnected . Error: "+ error}
      
   
    
    

  })
  
	socket.on('disconnect' , reason => {
    //Use this later on for trying to reconnect a socket if the internet connection breaks or 
    //the user loses connection to the server due to server trouble.
    console.log("Disconnect Event - Reason for userLeave : ",reason)
    
	} ) 
	// socket.on('disconnect' , socket => {
  //   console.log("Socket id passed into userLeave : ",socket.id)
  //   var disconnected_user = userLeave(socket.id)
  //   console.log("Disconnected User: ",disconnected_user)
	// } ) 

})

//------------ RUNNING GAME SERVERS ----------------

tictactoe_server.tictactoe_server()
