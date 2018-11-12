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
//var userColors = [];
io.on('connection', (socket) => {
    console.log('Client connected');
    socket.on('disconnect', () => console.log('Client disconnected'));

    socket.on('user-login', function (data) {
        var name = data.t;
        var u = true;

        for (var i = 0; i < users.length; i++) {
            if (name == users[i]) {
                socket.emit('rejected-login', "username taken!");
                u = false;
            }
        }

        if (u) {
            users.push(name); //store user in an array
            console.log(name + ' connected\nusers: ' + users.length); //log the connection
            socket.user = data.t;
            socket.emit('validated-login', {
                name: name
            });
        }

    });

    socket.on('message', function (data) {
        genId = generateId();
        var message = {
            user: data.name,
            message: data.t,
            id: genId
        };
        io.sockets.emit('message', message);

        console.log(data.name + ': ' + data);
    });
    
    socket.on('sh-message', function (data) {
        genId = generateId();
        var message = {
            user: data.name,
            message: data.t
        };
        io.emit('sh-message', message);
    });
    
    socket.on('sh-player-joined', function(data){
        if(!shPlayers.includes(data)){
            shPlayers.push(data);
            io.emit('sh-player-joined', {
                name: data
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

    socket.on('disconnect', function () {
        if (!socket.user) //make sure socket has a user before proceeding
            return;

        if (users.indexOf(socket.user) > -1) {
            users.splice(users.indexOf(socket.user), 1);
            socket.broadcast.emit('otherUserDisconnect', socket.user);
            console.log(socket.user + 'disconnected\nusers: ' + users.length);
        }
    });
    
    /*
    socket.on('user-login-bypass', function (data) {
        var name = data.name;
        socket.emit('validated-login-bypass', {
            name: name
        });
        socket.broadcast.emit('otherUserConnect', {
            n: name //sends taken name from client back to all clients
        });
    });
    */

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

/*

io.sockets.on('connection', function (socket) {

    
*/
