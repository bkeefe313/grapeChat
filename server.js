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
var readyPlayers = [];

var numLiberals = 0;
var numFascists = 0;
var fascists = [];
var liberals = [];
var hitler = '';
var shGameActive = false;

io.on('connection', (socket) => {
    socket.on('disconnect', () => console.log('Client disconnected'));

    socket.on('user-login', function (data) {
        var name = data.t;
        var color = '#' + Math.floor(Math.random() * 16777215).toString(16);
        var u = true;

        u = users.includes(name);

        if (!u) {
            users.push(name); //store user in an array
            userColors.push(color);
            console.log(name + ' connected\nusers: ' + users.length); //log the connection
            socket.user = data.t;
            socket.emit('validated-login', {
                name: name,
                c: color
            });
        } else {
            socket.emit('rejected-login', "username taken!");
        }

    });

    socket.on('request-new-color', function (data) {
        userColors[users.indexOf(data)] = '#' + Math.floor(Math.random() * 16777215).toString(16);
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

    socket.on('sh-player-joined', function (data) {
        var color = userColors[users.indexOf(data)];

        if (!shPlayers.includes(data)) {
            shPlayers.push(data);
            io.emit('sh-player-joined', {
                name: data,
                c: color,
                num: shPlayers.length
            });
        } else {
            socket.emit('sh-failed-join');
        }
    });

    socket.on('sh-player-left', function (data) {
        console.log('player-left');
        if (readyPlayers.includes(data)) {
            readyPlayers.splice(readyPlayers.indexOf(data), 1);
        }
        shPlayers.splice(shPlayers.indexOf(data), 1);
        io.emit('sh-player-left', {
            name: data,
            num: shPlayers.length,
            gs: shGameActive
        });
        shGameActive = false;
    });

    socket.on('entered-sh-page', function () {
        socket.emit('show-active-players', shPlayers);
        if (shGameActive)
            socket.emit('sh-in-progress')
    });

    socket.on('sh-ready-up', function (data) {
        readyPlayers.push(data);
        io.emit('sh-ready-up', data);
        if (readyPlayers.length == shPlayers.length && readyPlayers.length >= 1) {
            io.emit('start-sh', readyPlayers.length);
            io.to('sh-lobby').emit('choose-roles', setRoles());
            shGameActive = true;
        }
    });

    socket.on('sh-unready', function (data) {
        readyPlayers.splice(readyPlayers.indexOf(data), 1);
        io.emit('sh-unready', data);
    });

    socket.on('disconnect', function () {
        if (!socket.user) //make sure socket has a user before proceeding
            return;

        if (users.indexOf(socket.user) > -1) {
            users.splice(users.indexOf(socket.user), 1);
            socket.broadcast.emit('otherUserDisconnect', socket.user);
            console.log(socket.user + 'disconnected\nusers: ' + users.length);

            if (shPlayers.includes(socket.user)) {
                io.emit('sh-player-left', socket.user);
                shPlayers.splice(shPlayers.indexOf(socket.user, 1));
                if (readyPlayers.includes(data)) {
                    readyPlayers.splice(readyPlayers.indexOf(data), 1);
                }
            }
        }
    });

    socket.on('choose-roles', function () {

    });

    socket.on('join-sh-lobby', function () {
        socket.join('sh-lobby');
    });

    socket.on('join-sh-hitler', function () {
        socket.join('sh-hitler');
    });

    socket.on('join-sh-liberals', function () {
        socket.join('sh-liberals');
    });

    socket.on('join-sh-fascists', function () {
        socket.join('sh-fascists');
    });

    socket.on('sh-end-game', function () {
        for (var i = 0; i < shPlayers.length; i++) {
            io.emit('sh-player-left', shPlayers[i]);
        }
        shPlayers.splice(0, shPlayers.length);
        io.emit('reset-sh');
    });

});

function draw() {}

function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function setRoles() {
    shuffle(shPlayers);

    var hIndex = 0;

    if (shPlayers.length < 5) {
        numFascists = shPlayers.length;
    } else if (shPlayers.length == 5) {
        numFascists = 2;
        numLiberals = 3
    } else if (shPlayers.length == 6) {
        numFascists = 3;
        numLiberals = 3
    } else if (shPlayers.length == 7) {
        numFascists = 3;
        numLiberals = 4;
    } else if (shPlayers.length == 8) {
        numFascists = 3;
        numLiberals = 5;
    }

    hitler = shPlayers[hIndex];

    var i = 0;
    while (i < shPlayers.length) {
        for (var z = 0; z < numFascists; z++) {
            fascists.push(shPlayers[i]);
            console.log("added fascist");
            i++;
        }
        for (var f = 0; f < numLiberals; f++) {
            liberals.push(shPlayers[i]);
            console.log("added liberal");
            i++
        }
    }

    var roles = {
        h: hitler,
        f: fascists,
        l: liberals
    };
    console.log("chose roles.");
    console.log("fascists = " + fascists);
    console.log("liberals = " + liberals);
    console.log("shPlayers = " + shPlayers);
    console.log("numFascists = " + numFascists);
    console.log("numLiberals = " + numLiberals);

    return roles;

}
