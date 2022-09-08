'use strict'





var http = require('http');
var express = require('express');

var serveIndex = require('serve-index');

var fs = require('node:fs');

var app = express();

app.use(serveIndex('./dist'));
app.use(express.static('./dist'));


var options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
};

var http_server = http.createServer(app);
http_server.listen(3003);

var io = require('socket.io')(http_server,{path:'/rtcket'});
    
  http_server.on('listening', onListening);
function onListening() {
	var addr = http_server.address();
  console.log(addr)
	var bind = typeof addr === 'string'
	  ? 'pipe ' + addr
	  : 'port ' + addr.port;
	console.log('Listening on ' + addr.address);
  }

var roomid = ''
var personListMap = {}
//connection
io.on('connection', (socket)=>{
	console.log("连接")
	socket.on('message', (room, data)=>{
		if(data ===  undefined){
			return
		}
		socket.to(room).emit('message', room, socket.id, data)
	});


	socket.on('join', (obj)=> {
    console.log("join")
		var room = obj.room
		roomid = room
		socket.join(room);

		personListMap[socket.id] = obj

		var myRoom = io.sockets.adapter.rooms[room];
		var users = Object.keys(myRoom.sockets).length;

		if(users < 3) {
			console.log(obj)
			socket.emit('joined', personListMap, socket.id);
			socket.to(room).emit('otherjoin', obj)
		}else {
			personListMap[socket.id] = null
			socket.leave(room);
			socket.emit('full', room, personListMap);	
		}

	});

	socket.on('leave', (room)=> {
		console.log(room);
		console.log('leave')
		var myRoom = io.sockets.adapter.rooms[room];
		personListMap[socket.id] = null
		socket.leave(room);
		socket.to(room).emit('bye', room, socket.id)
	 	socket.emit('leaved', room, socket.id);	
	});

	socket.on('disconnect', function () {
		
		socket.to(roomid).emit('otherleave')
		socket.leave(roomid);
		personListMap[socket.id] = null
		console.log('disconnect')

	});
	socket.on('connect', function () {

		console.log('connect')

	});

});





