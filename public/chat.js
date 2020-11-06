$(function(){
    //make connection
    const socket = io()

    //buttons and inputs
    var message = $('#message')
    var send_message = $('#send_message')
    var chatroom = $('#chatroom')
    var video_area = $('#video-area')

    // Peer takes 1- ID, put undefined to let the server handle that
    // then { host: 3001 locally or 'your-app-name.herokuapp.com', port is either 9000 or 443(if using https)}
    // if using https include secure: true
    const myPeer = new Peer ()

    myPeer.on('open', id => {
      room = JSON.parse(ROOM_ID)
      socket.emit('join_room', room, id)       
    })

    // Emit message
    send_message.click(function() {
        var name = JSON.parse(USER).name
        socket.emit('new_chat_message', {message:message.val(), user: name, roomId: ROOM_ID})
        message.val('')
    })

    //send message on press of enter inside the message box
    message.keypress(function(e){
      if(e.keyCode==13)
          send_message.click();
    })

    //Listen on new_chat_message
    socket.on('new_chat_message', (data) => {
      var current_user = JSON.parse(USER).name     

      // change formatting based on who sent the message
      if (current_user === data.name) {
          // show the message in the chatroom area
          chatroom.append("<p class='chat_message myMessage'>" + data.message + "</p>")
      } else {
          // show the message in the chatroom area
          chatroom.append("<p class='chat_message otherMessage'> <em>" + data.name + "</em>: " + data.message + "</p>")
      }      
    })

    socket.on('user_connected', userId => {
      chatroom.append("<p class='chat_message myMessage'>" + data.name + "has joined the chat </p>")
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
        myPeer.on('call', call => {
          call.answer(stream)
          const video = document.createElement('video')
          call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
          })
        })
        //send your video input to other users
        socket.on('user_connected', userId => {
          connectToNewUser(userId, stream)
        })
        // stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
          
    })
    .catch(function(error) {
        console.warn(error.message)
    }); 
    
    function connectToNewUser (userId, stream) {
      const call = myPeer.call(userId, stream)
      const video = document.createElement('video')
      console.log("showing video")

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