$(function(){
    //make connection
    const socket = io()

    //buttons and inputs
    var message = $('#message')
    var send_message = $('#send_message')
    var chatroom = $('#chatroom')
    const video_area = $('#video-area')

    // Peer takes 1- ID, put undefined to let the server handle that
    // then { host: 3001 locally or 'your-app-name.herokuapp.com', port is either 9000 or 443(if using https)}
    // if using https include secure: true
    // const myPeer = new Peer (undefined, {
    //   secure: true,
    //   host: 'shindy-app.herokuapp.com/',
    //   port: '443'
    // })

    // myPeer.on('open', id => {
    //   socket.emit('join_room', ROOM_ID, id)       
    // })

    // Emit message
    send_message.click(function() {
        socket.emit('new_chat_message', {message:message.val() })
        message.val('')
    })

    //send message on press of enter inside the message box
    message.keypress(function(e){
      if(e.keyCode==13)
          send_message.click();
    })

    //Listen on new_chat_message
    socket.on('new_chat_message', (data) => {
        chatroom.append("<p class='message'>" + data.username + ": " + data.message + "</p>")
    })   

    // remove other user video when they disconnect
    socket.on('user_disconnected', userId => {
      if (peers[userId]) 
        peers[userId].close()
    })

    // get local video input
    const myVideo = document.createElement('video')
    myVideo.muted = true

    // use this object to keep track of everyone you're connected to
    const peers = {}

    navigator.mediaDevices.getUserMedia({video:true, audio:true})
    .then(stream => {
        addVideoStream (myVideo, stream)
        //listen for when new users call you
        // myPeer.on('call', call => {
        //   call.answer(stream)
        //   const video = document.createElement('video')
        //   call.on('stream', userVideoStream => {
        //     addVideoStream(video, userVideoStream)
        //   })
        // })
        //send your video input to other users
        socket.on('user_connected', userId => {
          connectToNewUser(userId, stream)
        })          
    })
    .catch(function(error) {
        console.warn(error.message)
    }); 
    
    function connectToNewUser (userId, stream) {
      // const call = myPeer.call(userId, stream)
      const video = document.createElement('video')

      call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
      })

      call.on('close', () => {
        video.remove()
      })

      //link every user id to a call that is made
      peers[userId] = call
    }

    function addVideoStream (video, stream) {
      video.srcObject = stream
      video.addEventListener ('loadedmetadata', () => {
        video.play()
      })
      video_area.append(video)
    }
})