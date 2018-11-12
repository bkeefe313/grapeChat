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
var passwords = [];
//var userColors = [];
io.on('connection', (socket) => {
    console.log('Client connected');
    socket.on('disconnect', () => console.log('Client disconnected'));


    //on each user's connection
    socket.on('new-user', function (data) {
        var name = data.t;
        var pw = data.pw;
        var u = true;
        var p = true;

        for (var i = 0; i < users.length; i++) {
            if (name == users[i]) {
                socket.emit('rejected-account', "username taken!");
                u = false;
            }
        }

        if (pw.length < 6 || pw.length > 30) {
            socket.emit('rejected-account', "password too long/short!");
            u = false;
        }

        if (u && p) {
            users.push(data.t); //store user in an array
            passwords.push(data.pw);
            console.log(data.t + ' connected\nusers: ' + users.length); //log the connection
            socket.user = data.t;
            socket.emit('validated-account', {
                name: name,
                pw: pw
            });
        }
    });

    socket.on('user-login', function (data) {
        var index = -1;
        var name = data.t;
        var pw = data.pw;
        var validUsername = false;

        console.log("attempted login - " + name + ". Password - " + pw + ". The list of actuals is as follows: " + users + "\n" + passwords);

        for (var i = 0; i < users.length; i++) {
            if (name == users[i]) {
                index = i;
                validUsername = true;
                console.log("username validated");
            }
        }

        if (validUsername) {
            if (pw == passwords[index]) {
                socket.emit('validated-login', {
                    name: name,
                    pw: pw
                });
                socket.broadcast.emit('otherUserConnect', {
                    n: name //sends taken name from client back to all clients
                });
            } else {
                socket.emit('rejected-login', "Incorrect password.");
            }
        } else {
            console.log("username rejected");
            socket.emit('rejected-login', "That username doesn't exist.");
        }

    });

    socket.on('user-login-bypass', function (data) {
        var name = data.name;
        socket.emit('validated-login-bypass', {
            name: name
        });
        socket.broadcast.emit('otherUserConnect', {
            n: name //sends taken name from client back to all clients
        });
    });

    socket.on('post-added', function (data) {
        console.log("post data received by server");
        var postData = {
            title: data.title,
            author: data.author,
            content: data.content
        }
        io.sockets.emit('post-completed', postData);
    });

    socket.on('message', function (data) {
        genId = generateId();
        /*var color = (function(){
            for (var i = 0; i < users.length; i++){
                if(socket.user == users[i]){
                    if(userColors[i])
                        return userColors[i];
                    else
                        return '#000000';
                }
            }
            
            return '#000000';
        });*/
        var message = {
            user: data.name,
            message: data.t,
            id: genId
            //c : color
        };
        io.sockets.emit('message', message);

        console.log(data.name + ': ' + data);
    });

    socket.on('disconnect', function () {
        if (!socket.user) //make sure socket has a user before proceeding
            return;

        if (users.indexOf(socket.user) > -1) {
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

/*

io.sockets.on('connection', function (socket) {

    
*/
