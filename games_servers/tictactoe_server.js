function tictactoe_server(){

const io = require('../server').io

//Tic tac toe game variables
var gameIndex = 0, games = {};
var unpairedPins = [], maxPin = 10000, pinCount = 0;

//Game Namespace
const gameNsp = io.of('/gameNsp')

	//listen on every connection
gameNsp.on('connection', socket => {
  	addPlayer(socket);

	socket.on('disconnect', function() {
		
		
		if (socket.paired) {
			gameNsp.to(socket.gameId).emit('opponent-disconnected');
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

			gameNsp.to(game.players[game.turn].socket.id).emit('opponent-moved', index);

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


//Tictactoe Game functions

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

		gameNsp.to(socket1.id).emit('start-game', firstTurn);
		gameNsp.to(socket2.id).emit('start-game', 1 - firstTurn);
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

}

module.exports.tictactoe_server = tictactoe_server