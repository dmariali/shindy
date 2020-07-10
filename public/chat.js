$(function(){
    //make connection
    var socket = io()

    //buttons and inputs
    var message = $('#message')
    var username = $('#username')
    var send_message = $('#send_message')
    var send_username = $('#send_username')
    var chatroom = $('#chatroom')

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

    navigator.getUserMedia(
    { video: true, audio: true },
    stream => {
        const localVideo = document.getElementById("local-video");
        if (localVideo) {
        localVideo.srcObject = stream;
        }
    },
    error => {
        console.warn(error.message);
    }
    );
})

