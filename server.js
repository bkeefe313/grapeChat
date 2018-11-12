
const express = require('express');
const socketio = require('socket.io');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const INDEX = __dirname + '/client/';

const server = app
    .use(express.static(INDEX))
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));   



const io = socketio(server);


io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
});

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);


/*
var users = [];
var userColors = [];
io.sockets.on('connection', function (socket) {

    //on each user's connection
    socket.on('user', function (data) {
        var name = data.t;
        var color = data.c; //takes color and name^^^ from client
        users.push(data.t); //store user in an array
        userColors.push(data.c); //store user's color
        console.log(data.t + ' connected\nusers: ' + users.length); //log the connection
        console.log(data.c);
        socket.user = data.t;
        socket.broadcast.emit('otherUserConnect', {
            n: name, //sends taken name from client back to all clients
            c: color //sends taken color from client back to all clients
        });
    });

    socket.on('message', function (data) {
        genId = generateId();
        var color = (function(){
            for (var i = 0; i < users.length; i++){
                if(socket.user == users[i]){
                    if(userColors[i])
                        return userColors[i];
                    else
                        return '#000000';
                }
            }
            
            return '#000000';
        });
        var message = {
            user: socket.user,
            message: data,
            id : genId,
            c : color
        };
        io.sockets.emit('message', message);

        console.log(socket.user + ': ' + data);
    });

    var message = {
        text: 'Hi! This is Grape Chat!'
    };
    socket.emit('welcome', message, null);

    socket.on('disconnect', function () {
        if (!socket.user) //make sure socket has a user before proceeding
            return;

        if (users.indexOf(socket.user) > -1) {
            users.splice(users.indexOf(socket.user), 1);
            socket.broadcast.emit('otherUserDisconnect', socket.user);
            console.log(socket.user + 'disconnected\nusers: ' + users.length);
        }
    });

    function generateId() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        //for (var z = 0; z < idLog.length; z++) {
            //if (text == idLog[i]) {
                for (var i = 0; i < 5; i++) {
                    text += possible.charAt(Math.floor(Math.random() * possible.length));
                }
            //} else {

            //}
        //}
        return text;
    }
});

*/
