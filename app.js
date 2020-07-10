//  LAUNCH SERVER AND ALL PACKAGES
const express = require ('express')
const app = express()
const PORT = process.env.PORT || 3000

var http = require('http').createServer(app)

//set the template engine ejs
app.set('view engine', 'ejs')

//middlewares
app.use(express.static('public'))

//Handle Routes
app.get('/', (req, res) => {
    res.render('index')
})

// Listen on whatever the defined port is (not only 3000)
http.listen(PORT, () => {
    console.log(`listening on ${PORT}`)
})

//CONFIGURING SOCKET.IO
//socket.io instantiation
const io = require("socket.io")(http)

//listen on every connection 
io.on('connection', (socket) => {
    console.log('Client connected') //logs in the terminal!
    socket.on('disconnect', () => {
        console.log('Client disconnected')
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