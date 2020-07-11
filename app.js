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
    let activeSockets = []

    //default username
    socket.username = "Anonymous"

    //listen on change_username
    socket.on('change_username', (data)=> {
        socket.username = data.username
    })

    //listen on new_message
    socket.on('new_message', (data) => {
        //emit the new message
        io.sockets.emit('new_message', {message:data.message, username: socket.username})
    })

    const existingSocket = activeSockets.find(
        existingSocket => existingSocket === socket.id
      );
  
      if (!existingSocket) {
        console.log("dali - no existing socket", socket.id)
        activeSockets.push(socket.id);
            console.log("active sockets - ", activeSockets)
  
        socket.emit('update-user-list', {
          users: activeSockets.filter(
            existingSocket => existingSocket !== socket.id
          )
        });
  
        socket.broadcast.emit('update-user-list', {
          users: [socket.id]
        });
      }

    socket.on("call-user", data => {
    socket.to(data.to).emit("call-made", {
        offer: data.offer,
        socket: socket.id
    });
    });

    socket.on("make-answer", data => {
        socket.to(data.to).emit("answer-made", {
          socket: socket.id,
          answer: data.answer
        });
      });

      socket.on("reject-call", data => {
        socket.to(data.from).emit("call-rejected", {
          socket: socket.id
        });
      });

    socket.on('disconnect', () => {
        console.log('Client disconnected')
        activeSockets = activeSockets.filter(
            existingSocket => existingSocket !== socket.id
        )
        socket.broadcast.emit('remove-user', {
            socketId: socket.id
        })
    })
})