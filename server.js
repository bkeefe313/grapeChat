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

var users = [];
var shPlayers = [];
var userColors = [];
io.on('connection', (socket) => {
    socket.on('disconnect', () => console.log('Client disconnected'));

    socket.on('user-login', function (data) {
        var name = data.t;
        var color = '#'+Math.floor(Math.random()*16777215).toString(16);
        var u = true;

        for (var i = 0; i < users.length; i++) {
            if (name == users[i]) {
                socket.emit('rejected-login', "username taken!");
                u = false;
            }
        }

        if (u) {
            users.push(name); //store user in an array
            userColors.push(color);
            console.log(name + ' connected\nusers: ' + users.length); //log the connection
            socket.user = data.t;
            socket.emit('validated-login', {
                name: name,
                c: color
            });
        }

    });
    
    socket.on('request-new-color', function(data){
        userColors[users.indexOf(data)] = '#'+Math.floor(Math.random()*16777215).toString(16);
    });

    socket.on('message', function (data) {
        var message = {
            user: data.name,
            message: data.t,
            c: userColors[users.indexOf(data.name)]
        };
        io.sockets.emit('message', message);

        console.log(data.name + ': ' + data);
    });
    
    socket.on('sh-message', function (data) {
        var message = {
            user: data.name,
            message: data.t,
            c: userColors[users.indexOf(data.name)]
        };
        io.emit('sh-message', message);
    });
    
    socket.on('sh-player-joined', function(data){
        var color = userColors[users.indexOf(data)];
        if(!shPlayers.includes(data)){
            shPlayers.push(data);
            io.emit('sh-player-joined', {
                name: data,
                c: color
            });
        } else {
            socket.emit('sh-failed-join');
        }
    });
    
    socket.on('sh-player-left', function(data){
        shPlayers.splice(shPlayers.indexOf(data), 1);
        io.emit('sh-player-left', {
            name: data
        });
    });
    
    socket.on('entered-sh-page', function(){
        socket.emit('show-active-players', shPlayers);
    })

    socket.on('disconnect', function () {
        if (!socket.user) //make sure socket has a user before proceeding
            return;

        if (users.indexOf(socket.user) > -1) {
            users.splice(users.indexOf(socket.user), 1);
            socket.broadcast.emit('otherUserDisconnect', socket.user);
            console.log(socket.user + 'disconnected\nusers: ' + users.length);
        }
    });
});

/*

io.sockets.on('connection', function (socket) {

    
*/
