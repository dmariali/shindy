$(function(){
    //make connection
    const socket = io('/chatNsp')

    //buttons and inputs
    var message = $('#message')
    var send_message = $('#send_message')
    var chatroom = $('#chatroom')
    var video_area = $('#video-area')
    var content_container = $('.content-container')
    var user_list_area = $('#room-users-list')
    var room = JSON.parse(ROOM_ID)
    var user = JSON.parse(USER)
    var debug_btn = $(".debug_btn")

    //sliders
    var video_slider = $('.video-slider')
    var game_bottom_slider = $('.game-bottom-slider')
    var chat_slider = $('.chat-slider')
    var game_side_slider = $('.game-side-slider')
    

    // Peer takes 1- ID, put undefined to let the server handle that
    // then { host: 3001 locally or 'your-app-name.herokuapp.com', port is either 9000 or 443(if using https)}
    // if using https include secure: true
    const myPeer = new Peer ()
    var gblPartnerPeerId = "NoPartner"
    var gblUsrVideoStream = ""
    var gblUsrMediaConnection = ""

    myPeer.on('open', id => {
      user.peerId = id //bind a user's peerID to the user object
      user.room = room //Room id
      user.socketid = socket.id //socket id of the user connection
      socket.emit('join_room',  user)       
    })


//################ PEER JS SIGNALS ########################
    // Get local video input
    //navigator.mediaDevices gets the media stream of the local video and/or audio stream.
    navigator.mediaDevices.getUserMedia({video:true, audio:false})
    .then(stream => {
        addVideoStream (stream, muted=true)

        myPeer.on('call', call => {
          // When someone calls you answer the call and send your video stream
          gblUsrMediaConnection = call
          call.answer(stream)
          console.log("PeerId on other end of this call: ",call.peer)
          
          gblPartnerPeerId = call.peer //saving the peerid of the person on the other side of the call to a global variable

          // send your stream when a new user joins the call
          call.on('stream', userVideoStream => {
            //Add the user's video stream to the pa when they start sending it.
            gblUsrVideoStream = userVideoStream
            addVideoStream(userVideoStream)
            console.log("I have initiated this call")
            console.log("Media Stream of Peer: ",userVideoStream)
         
          })
        })

//################ SOCKET IO SIGNALS ########################

        //Emitted to everyone except the user who connected
        socket.on('user_connected', (user, user_list) => {
          //send your video input to other users
          connectToNewUser(user.peerId, stream)
          chatroom.append("<p class='chat_message myMessage'>" + user.name + " has joined the chat </p>") 
          user_list.forEach(user => {            
            updateUserList (user)
          })            
        })          

    .catch(function(error) {
        console.warn(error.message)
    })
    
        })          
          .catch(function(error) {
              console.warn(error.message)
          }); 

            // Emit message
            send_message.click(function() {
                
              socket.emit('new_chat_message', {message:message.val(), user: user.name}, room)
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
            // change formatting based on who sent the message
            if (user.name === data.name) {
                // show the message in the chatroom area
                chatroom.append("<p class='chat_message myMessage'>" + data.message + "</p>")
            } else {
                // show the message in the chatroom area
                chatroom.append("<p class='chat_message otherMessage'> <em>" + data.name + "</em>: " + data.message + "</p>")
            }      
          })

        socket.on('user_disconnected',(userWhoLeft)=>{
          console.log("User Disconnected event in Chat JS fired")
          console.log("PeerId of user who left: ",userWhoLeft.peerId)
          console.log("Partner PeerId: ",gblPartnerPeerId)
          console.log("MediaConnection of Call: ",gblUsrMediaConnection)
          
        //  if(gblPartnerPeerId == userWhoLeft.peerId){
            // console.log("video Closed")
            // console.log("Media Stream of Peer after user disconnected: ",stream)
           
            gblUsrMediaConnection.close() //Closes the media connection
            gblUsrMediaConnection.on('close', () => {
            console.log("Call OVER!")
            video.remove()
            })
            console.log("Is the Stream still Open?: ",gblUsrMediaConnection.open)
            removeVideoStream(gblUsrVideoStream)
            //video.remove()
        //  }
        })
         
//################ HELPER FUNCTIONS ########################


      function connectToNewUser (peerId, stream) {
        const call = myPeer.call(peerId, stream) //call is a mediaConnection object
        gblUsrMediaConnection = call
        // when OTHER user sends back their video stream, we get this
        // signal 'stream' which provides THEIR mediaConnection stream object and we add it to
        //a video/canvas element using the addVideoStream function.
        call.on('stream', userVideoStream => {
         // console.log(userVideoStream)
         gblUsrVideoStream = userVideoStream
          addVideoStream(userVideoStream)
        })

      }

    //addVideoStream sets up the video element of the page with the stream and starts playing it.
    //It also takes case of the canvas layout and positioning of the video on the page
    function addVideoStream (stream, muted = true) {
      const video = document.createElement('video')
      video.muted = muted
      video.srcObject = stream
      video.addEventListener ('loadedmetadata', () => {
        // once this stream is loaded onto our page, play the video
        video.play()
      })
      const vid_div = document.createElement("div")
      vid_div.className = "vid_div"
      vid_div.id = stream.id
      vid_div.appendChild(video)

      const video_toggle = document.createElement("div");
      video_toggle.className = "video_toggle";
      vid_div.appendChild(video_toggle)

      const audio_toggle = document.createElement("div");
      audio_toggle.className = "audio_toggle";
      vid_div.appendChild(audio_toggle)

      video_area.append(vid_div)
    } 

    //Removes a video stream from the canvas
    function removeVideoStream(stream) { 
      console.log(`"Stream ID inside removeVideoStream:" #${stream.id}`)
      $(`#${stream.id}`).remove()
    }

    //A debug Button used for getting the value of variables at any point.
    debug_btn.click(() =>{
      console.log(myPeer.connections)
    })
    
    // Add grid changes when sliders are clicked
    video_slider.click(function() {
      if (content_container.css("grid-template-areas") === '"game game" "video video"') {
        // if chat already hidden - show only game
        content_container.css("grid-template-areas", '"game game" "game game"')
      } else {
        content_container.css("grid-template-areas", '"game chat" "game chat"')
      }
      game_bottom_slider.css("display", "block")   
    })
    chat_slider.click(function() {
      if (content_container.css("grid-template-areas") === '"game chat" "game chat"') {
        content_container.css("grid-template-areas", '"game game" "game game"')
      } else {
        content_container.css("grid-template-areas", '"game game" "video video"')
      } 
      game_side_slider.css("display", "block")   
    })
    game_bottom_slider.click(function() {
      if (content_container.css("grid-template-areas") === '"game game" "game game"') {
        content_container.css("grid-template-areas", '"game game" "video video"')
      } else {
        content_container.css("grid-template-areas", '"game chat" "video chat"')
      }
      game_bottom_slider.css("display", "none")      
    })
    game_side_slider.click(function() { 
      if (content_container.css("grid-template-areas") === '"game game" "game game"') {
        content_container.css("grid-template-areas", '"game chat" "game chat"')
      } else {
        content_container.css("grid-template-areas", '"game chat" "video chat"')
      }    
      game_side_slider.css("display", "none")      
    })

    function updateUserList (user) {
      const user_div = document.createElement("div")
      user_div.className = "user_div"

      const first_letter = user.username[0]
      const initial_text = document.createElement("p")
      initial_text.innerHTML = first_letter
      user_div.appendChild(initial_text)

      user_list_area.append(user_div)
    }
})