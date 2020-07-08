//  LAUNCH SERVER AND ALL PACKAGES
const express = require ('express')
const app = express()

var http = require('http').createServer(app)

//set the template engine ejs
app.set('view engine', 'ejs')

//middlewares
app.use(express.static('public'))

//routes
app.get('/', (req, res) => {
    res.render('index')
})

// Listen on port 3000
http.listen(3000, () => {
    console.log('listening on port 3000')
})

//CONFIGURING SOCKET.IO
//socket.io instantiation
const io = require("socket.io")(http)

//listen on every connection 
io.on('connection', (socket) => {
    console.log('New user connected') //logs in the terminal!
    socket.on('disconnect', () => {
        console.log('user disconnected')
    })

    //default username
    socket.username = "Anonymous"

    //listen on change_username
    socket.on('change_username', (data)=> {
        socket.username = data.username
    })

    //listen on new_message
    socket.on('new_message', (data) => {
        //broadcast the new message
        io.sockets.emit('new_message', {message:data.message, username: socket.username})
    })
})