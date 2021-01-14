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
      var room = JSON.parse(ROOM_ID)
      socket.emit('join_room', room, id)     
      console.log("Join room request emitted")  
    })

    // Emit message
    send_message.click(function() {
        var name = JSON.parse(USER).name
        var room = JSON.parse(ROOM_ID)
        socket.emit('new_chat_message', {message:message.val(), user: name}, room)
        message.val('')
    })

    //send message on press of enter inside the message box
    message.keypress(function(e){    
      
      if(e.keyCode==13){
          send_message.click()
      }
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
      // chatroom.append("<p class='chat_message myMessage'>" + userId + "has joined the chat </p>")
    })

    // get local video input
    const myVideo = document.createElement('video')
    myVideo.muted = true

    navigator.mediaDevices.getUserMedia({video:true, audio:false})
    .then(stream => {
        addVideoStream (myVideo, stream)

        myPeer.on('call', call => {
          // get stream when a new user joins the call
          call.answer(stream)

          // send your stream when a new user joins the call
          const video = document.createElement('video')
          call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
          })
        } )

        //send your video input to other users
        socket.on('user_connected', userId => {
          connectToNewUser(userId, stream)
        })          
    })
    .catch(function(error) {
        console.warn(error.message)
    }); 
    
    function connectToNewUser (userId, stream) {
      const call = myPeer.call(userId, stream)
      const video = document.createElement('video')

      // when OTHER user sends back their video stream, we get this
      // signal 'stream' which takes in THEIR stream
      call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
      })

      call.on('close', () => {
        video.remove()
      })
    }

    function addVideoStream (video, stream) {
      video.srcObject = stream
      video.addEventListener ('loadedmetadata', () => {
        // once this stream is loaded onto our page, play the video
        video.play()
      })
      const vid_div = document.createElement("div")
      vid_div.className = "vid_div"
      vid_div.appendChild(video)

      const video_toggle = document.createElement("div");
      video_toggle.className = "video_toggle";
      vid_div.appendChild(video_toggle)

      const audio_toggle = document.createElement("div");
      audio_toggle.className = "audio_toggle";
      vid_div.appendChild(audio_toggle)

      video_area.append(vid_div)
    } 
})