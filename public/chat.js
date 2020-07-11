$(function(){
    //make connection
    var socket = io()

    //buttons and inputs
    var message = $('#message')
    var username = $('#username')
    var send_message = $('#send_message')
    var send_username = $('#send_username')
    var chatroom = $('#chatroom')

    let isAlreadyCalling = false;
    let getCalled = false;

    const { RTCPeerConnection, RTCSessionDescription } = window;
    const peerConnection = new RTCPeerConnection();


    // Emit a username
    send_username.click(function() {
        socket.emit('change_username', {username : username.val() })
    })

    // Emit message
    send_message.click(function() {
        socket.emit('new_message', {message:message.val() })
        message.val('')
    })

    //Listen on new_message
    socket.on('new_message', (data) => {
        chatroom.append("<p class='message'>" + data.username + ": " + data.message + "</p>")
    })

    //send message on press of enter inside the message box
    message.keypress(function(e){
        if(e.keyCode==13)
            send_message.click();
      })

    
    socket.on('update-user-list', ({users}) => {
        updateUserList(users)
    })  

    socket.on('remove-user', ({socketId}) => {
        const elementtoRemove = document.getElementById(socketId)
        if (elementtoRemove) {
            elementtoRemove.remove()
        }
    })

    function updateUserList(socketIds) {
        const activeUserContainer = document.getElementById('active-user-container');
        
        socketIds.forEach(socketId => {
          const alreadyExistingUser = document.getElementById(socketId);
          if (!alreadyExistingUser) {
            const userContainerEl = createUserItemContainer(socketId);
            activeUserContainer.appendChild(userContainerEl);
          }
        });
       }

       function createUserItemContainer(socketId) {
        const userContainerEl = document.createElement("div");
        
        const usernameEl = document.createElement("p");
        
        userContainerEl.setAttribute("class", "active-user");
        userContainerEl.setAttribute("id", socketId);
        usernameEl.setAttribute("class", "username");
        usernameEl.innerHTML = `Socket: ${socketId}`;
        
        userContainerEl.appendChild(usernameEl);
        
        userContainerEl.addEventListener("click", () => {
          unselectUsersFromList();
          userContainerEl.setAttribute("class", "active-user active-user--selected");
          const talkingWithInfo = document.getElementById("talking-with-info");
          talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
          callUser(socketId);
        }); 
        return userContainerEl;
       }


       async function callUser(socketId) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
        
        socket.emit("call-user", {
          offer,
          to: socketId
        });
       }

       function unselectUsersFromList() {
        const alreadySelectedUser = document.querySelectorAll(
          ".active-user.active-user--selected"
        );
      
        alreadySelectedUser.forEach(el => {
          el.setAttribute("class", "active-user");
        });
      }

       socket.on("call-made", async data => {
        if (getCalled) {
            const confirmed = confirm(
              `User "Socket: ${data.socket}" wants to call you. Do accept this call?`
            );
        
            if (!confirmed) {
              socket.emit("reject-call", {
                from: data.socket
              });
        
              return;
            }
          }
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
        
        socket.emit("make-answer", {
          answer,
          to: data.socket
        });
        getCalled = true;
       });

       socket.on("answer-made", async data => {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        
        if (!isAlreadyCalling) {
          callUser(data.socket);
          isAlreadyCalling = true;
        }
       });

       socket.on("call-rejected", data => {
        alert(`User: "Socket: ${data.socket}" rejected your call.`);
        unselectUsersFromList();
      });

       peerConnection.ontrack = function({ streams: [stream] }) {
        const remoteVideo = document.getElementById("remote-video");
        if (remoteVideo) {
          remoteVideo.srcObject = stream;
        }
    }
    

    // add audio and video tracks to peer connection
    // get local video input
    navigator.mediaDevices.getUserMedia({video:true, audio:true})
    .then(function(stream) {
        const localVideo = document.getElementById("local-video")
        if(localVideo){
            localVideo.srcObject = stream
        }

        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
          
    })
    .catch(function(error) {
        console.warn(error.message)
    });      

})

