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

    //Variables passed in from Room ejs
    var room = JSON.parse(ROOM_ID)
    var user = JSON.parse(USER)


    //sliders
    var video_slider = $('.video-slider')
    var game_bottom_slider = $('.game-bottom-slider')
    var chat_slider = $('.chat-slider')
    var game_side_slider = $('.game-side-slider')
    
    //Global Variables
    var gblMyVideoStream = ""
    var peerConnections = [] // List of objects like {peerId: peerID, callId :mediaConnectionObj.connectionID, streamID: streamObj.ID}
    
    // Get your local video input and add it to the webpage page
    //navigator.mediaDevices gets the media stream of the local video and/or audio stream.
    navigator.mediaDevices.getUserMedia({video:true, audio:false})
    .then(stream => {
        addVideoStream (stream, muted=true)
        //Set the global video strem variable to your local stream. 
        //Everytime you make or answer a call you need to send this stream
        gblMyVideoStream = stream
        }).catch(function(error) {
          console.warn(error.message)
          }); 

//################ PEER JS SIGNALS ########################
    
    // Peer takes 1- ID, put undefined to let the server handle that
    // then { host: 3001 locally or 'your-app-name.herokuapp.com', port is either 9000 or 443(if using https)}
    // if using https include secure: true
    const myPeer = new Peer ()

    // Emitted when a connection to the PeerServer is established
    myPeer.on('open', id => {
      user.peerId = id //bind a user's peerID to the user object
      user.room = room //Room id
      user.socketid = socket.id //socket id of the user connection
      socket.emit('join_room',  user)       
    })

    //Emitted when a remote peer attempts to call you. The emitted mediaConnection is not yet active; 
    //you must first answer the call (mediaConnection.answer([stream]);). Then, you can listen for the stream event.
    myPeer.on('call', call => {
      
      //answer the call with your stream
      call.answer(gblMyVideoStream)

          // send your stream when a new user joins the call
          call.on('stream', userVideoStream => {

      // Listen for the User's Video Stream
      call.on('stream', userVideoStream => {

        //Add the user's video stream to the webpage when they start sending it.           
        addVideoStream(userVideoStream)

        //Update the PeerConnections array with the peerID of the person that called you, the mediaConnection Object and the stream object
        var newPeerData = {
          peerId : call.peer,
          call : call,
          stream : userVideoStream
          }
        peerConnections.push(newPeerData)

      })
    })


//################ SOCKET IO SIGNALS ########################

    //Emitted to everyone except the user who connected
    socket.on('user_connected', (user, user_list) => {
      //call the user who just connected
      connectToNewUser(user.peerId, gblMyVideoStream)

      chatroom.append("<p class='chat_message myMessage'>" + user.name + " has joined the chat </p>") 
      user_list.forEach(user => {            
        updateUserList (user)
      })            
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

      //Close the call and Remove the video stream of the user who left        
        peerConnections.filter(peer =>{
          if (peer.peerId == userWhoLeft.peerId){
            peer.call.close()
            if (peer.call.open == false){
              removeVideoStream(peer.stream)
            }
          }
        })
      
        //Remove the user who left from the PeerConnections array
        const index = peerConnections.findIndex(peer => peer.peerId == userWhoLeft.peerId )
        if(index!=-1){
          peerConnections.splice(index,1)
        }
        //  if(gblPartnerPeerId == userWhoLeft.peerId){
            // console.log("video Closed")
            // console.log("Media Stream of Peer after user disconnected: ",stream)
           

    })
         
//################ HELPER FUNCTIONS ########################

    //Call a new Peer
    function connectToNewUser (userPeerId, myStream) {
      const call = myPeer.call(userPeerId, myStream) //call is a mediaConnection object
      gblUserMediaConnection = call
      
      // The stream event of the call  returns a stream object from the person being called
      //This is then added to a video/canvas element using the addVideoStream function.
      call.on('stream', userVideoStream => {
        
        //Create object for new Peer Data and add this connection to the PeerConnections Array.
        var newPeerData = {
          peerId : userPeerId,
          call : call,
          stream : userVideoStream
          }

        peerConnections.push(newPeerData)

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

    //Update User List
    function updateUserList (user) {
      const user_div = document.createElement("div")
      user_div.className = "user_div"

      const first_letter = user.username[0]
      const initial_text = document.createElement("p")
      initial_text.innerHTML = first_letter
      user_div.appendChild(initial_text)

      user_list_area.append(user_div)
    }

//################################## EVENT HANDLING ###################################

    // Handle Button Click for Sending messages  
    send_message.click(function() {
      // Emit message  
      socket.emit('new_chat_message', {message:message.val(), user: user.name}, room)
      message.val('')      
  })

  //send message on press of enter inside the message box
  message.keypress(function(e){          
    if(e.keyCode==13){
        send_message.click()
    }
  })

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

    
})