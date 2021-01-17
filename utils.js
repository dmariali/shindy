/*
This module should be used for Utility functions 
*/

//--USER FUNCTIONS --

const users = []; //{username, socketid, roomId}

//Get all users in a room. The function returns a user object in the form specified above.
function getRoomUsers(roomId) {
    
    //---DEBUG Logs
    //console.log("Room ID: ",roomId)
    // console.log("All Users: ",users)
    // console.log("Users in the room: ",users.filter(user => user.roomId==roomId))
    
    return users.filter(user => user.roomId==roomId)
    
}

//Adds a user to the users array
function userJoin(username,socketid, roomId){
    const user = {username,socketid,roomId}
    users.push(user)
    return user
}

//Drops a user from the user array
function userLeave(socketid){
    const index = users.findIndex(user => user.socketid==socketid)

    if(index!== -1){
        return users.splice(index,1)
    }
}


//Export modules for use in other modules.
module.exports = {
    userJoin,
    userLeave,
    getRoomUsers
}