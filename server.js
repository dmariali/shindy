if (process.env.NODE_ENV !== "production") {
  require('dotenv').config()
}


//  LAUNCH SERVER AND ALL PACKAGES
const express = require ('express')
const app = express()
// express ejs layouts allows you to build a page template for all pages in your app
const expressLayouts = require('express-ejs-layouts')
// use the environment port (for heroku deployment) or 3000 if used locally
const PORT = process.env.PORT || 3000

//Import utility functions for user actions from utils.js
const {userJoin,userLeave, getRoomUsers} = require('./utils')
// show flash messages
const flash = require ('express-flash')
const session = require ('express-session')
//allows us to use methods other than POST and GET in forms
const methodOverride = require ('method-override')
// make it easier to access the different input elements from our server
const bodyParser = require('body-parser')

// integrate mongodb into our application
const mongoose = require('mongoose')
// set up database connection
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true
})
const db = mongoose.connection 
db.on('error', error => console.error(error))
db.once('open', () => console.log("Connected to Mongoose"))

//connect router files
const userRouter = require("./routes/users")
const indexRouter = require("./routes/index")

const User = require('./models/user')

//set up how we will access our views - using ejs which we installed
app.set('view engine', 'ejs')

//define where our views will be stored (in a folder named views that's in our current directory)
app.set("views", __dirname+'/views')

// define where the layout file will be 
app.set('layout', 'layouts/layout')

//middlewares
app.use(express.static('public')) // all our js and css will be inside 'public' folder
app.use(expressLayouts)
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session ({
  secret: 'some-secret',
  resave: false,
  saveUninitialized : false
}))

app.use(methodOverride('_method'))
app.use(bodyParser.urlencoded({limit:'10mb', extended: false}))

//------ HANDLE ROUTING -------

// got to UserRouter for anything with subdomain /users
app.use('/users', userRouter)
app.use('/', indexRouter)

//------------ CONFIGURING SOCKET.IO ----------------

const server = require('http').Server(app)
// Listen on whatever the defined port is (not only 3000)
server.listen(PORT, () => {
    console.log(`listening on ${PORT}`)
})

//socket.io instantiation
const io = require("socket.io")(server)

//Tic tac toe game variables
var gameIndex = 0, games = {};
var unpairedPins = [], maxPin = 10000, pinCount = 0;

//listen on every connection 
io.on('connection', socket => {
    
    //default username
    socket.username = "Anonymous"

    socket.on('join_room', (user, roomid, socketid,peerId) => {
	  socket.join(roomid)
	  userJoin(user.name,socketid,roomid)
	  socket.to(roomid).broadcast.emit('user_connected', user,peerId)
	  
    })    

    //listen on new_chat_message
    socket.on('new_chat_message', (data, roomId) => {
        //emit the new message
		io.to(roomId).emit('new_chat_message', {message:data.message, name: data.user})
    })  


    //Tic-Tac-Toe

  	addPlayer(socket);

	socket.on('disconnect', function() {
		userLeave(socket.id)
		
		if (socket.paired) {
			io.to(socket.gameId).emit('opponent-disconnected');
			games[socket.gameId].players[0].socket.paired = false;
			games[socket.gameId].players[1].socket.paired = false;
			delete games[socket.gameId];
			delete socket.gameId;
		} else {
			delete unpairedPins[socket.pin];
			delete socket.pin;
			pinCount--;
		}

		
	});

	socket.on('move', function(index) {
		var game = games[socket.gameId];
		index = parseInt(index, 10);

		if (socket.paired && typeof index === 'number' && 0 <= index && index < 10 && game.players[game.turn].socket.id === socket.id && typeof game.filled[index] !== 'number') {
			game.filled[index] = game.turn;
			game.turn++;
			game.turn %= 2;

			io.to(game.players[game.turn].socket.id).emit('opponent-moved', index);

			if (isFinished(game.filled)) {
				game.players[0].socket.paired = false;
				game.players[1].socket.paired = false;
				delete games[socket.gameId];
				delete game.players[0].socket.gameId;
				delete game.players[1].socket.gameId;
			}
		}
	});

	socket.on('play-again', function() {
		if (!socket.paired) {
			addPlayer(socket);
		}
	});

	socket.on('enter-pin', function(opponentPin) {
		if (!socket.paired && typeof unpairedPins[opponentPin] === 'object' && opponentPin != socket.pin && unpairedPins[opponentPin].pin === opponentPin && typeof socket.pin === 'number') {
			pairPlayers(socket, unpairedPins[opponentPin]);
		} else {
			socket.emit('invalid-pin');
		}
	});
});

var addPlayer = function(socket) {
	socket.pin = generatePin();
	unpairedPins[socket.pin] = socket;
	pinCount++;
	socket.emit('pin', socket.pin);
  //console.log("AddPlayer Function Run on server with socket.pin ", socket.pin," emitted")
};

var pairPlayers = function(socket1, socket2) {
	if (socket1 !== socket2 && !socket1.paired && !socket2.paired) {
		var gameId = 'game' + gameIndex;
		gameIndex++;

		socket1.paired = true;
		socket2.paired = true;
		socket1.gameId = gameId;
		socket2.gameId = gameId;
		socket1.join(gameId);
		socket2.join(gameId);

		delete unpairedPins[socket1.pin];
		delete unpairedPins[socket2.pin];
		delete socket1.pin;
		delete socket2.pin;

		pinCount -= 2;

		var firstTurn = Math.floor(Math.random() * 2);


    //Games definition
		games[gameId] = {
			'players':[
				{'socket': socket1, 'id': socket1.id},
				{'socket': socket2, 'id': socket2.id}
			],
			'turn': firstTurn,
			'filled': []
		};

		io.to(socket1.id).emit('start-game', firstTurn);
		io.to(socket2.id).emit('start-game', 1 - firstTurn);
	}
};

var isFinished = function(filled) {
	var positions = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
	var i, filledCount = 0;

	for (i = 0; i < positions.length; i++) {
		if (typeof filled[positions[i][0]] === 'number' && filled[positions[i][0]] === filled[positions[i][1]] && filled[positions[i][1]] === filled[positions[i][2]]) {
			return true;
		}
	}

	for (i = 0; i < filled.length; i++) {
		if (typeof filled[i] === 'number') filledCount++;
	}

	return filledCount >= 9;
};


var generatePin = function() {
	if (2 * pinCount > maxPin) {
		maxPin *= 2;
	}

	var pin;

	do {
		pin = Math.floor(Math.random() * maxPin);
	} while (typeof unpairedPins[pin] !== 'undefined');

	return pin;
};
