var socket = io();
var loggedIn = localStorage.getItem("loggedIn");
var currentUser = localStorage.getItem("currentUser");
var inGame = false;
var gameState = false;

function setup() {
    $('#controls').hide();
    $('#play-sh').hide();
    $('#leave-sh').hide();
    $('#ready-up').hide();
    $('#unready').hide();
    $('#leave-sh').prop("disabled", true);

    socket.emit('entered-sh-page');


    if (loggedIn && currentUser != "") {
        $('#logged-in').append('<div class="warning">You are logged in as ' + currentUser + '.</div>');
        $('#controls').show();
        $('#message').prop("disabled", true);
        $('#play-sh').show();
        $('#send').prop("disabled", true);
    } else if (gameState == false) {
        $('<p/>').text("You are not logged in and cannot play Secret Hitler. To log in, go back to the Chat page.").appendTo('#logged-in');
    } else if (gameState == true) {
        $('<p/>').text("Game in progress. You cannot play right now.").appendTo('#logged-in');
    }

    socket.on('sh-message', function (data) {
        console.log('sh-message');
        chat(data.user + ': ' + data.message, data.c);
    });

    socket.on('sh-player-joined', function (data) {
        console.log('sh-player-joined');
        chat(data.name + " has joined the lobby!");
        $('#players').append('<div id="' + data.name + '" class="player">' + data.name + "</div>");
        if (inGame) {
            $('#ready-up').show();
        }
        if (data.name == currentUser) {
            socket.emit('join-sh-lobby');
        }
    });

    socket.on('sh-in-progress', function () {
        console.log('sh-in-progress');
        $('#play-sh').hide();
        $('#logged-in').append('<div class="warning">You cannot join right now, there is a game in progress.</div>');
    });

    socket.on('sh-player-left', function (data) {
        console.log('sh-player-left');
        chat(data.name + " has left the lobby!");
        $('#' + data.name).remove();
        if (data.num != null && data.gs != null) {
            if (data.num < 5 && data.gs) {
                chat("NOT ENOUGH PLAYERS TO CONTINUE, ENDING GAME...", red);
                setTimeout(socket.emit('sh-end-game'), );
                gameState = false;
            }
        }
    });

    socket.on('sh-failed-join', function () {
        console.log('sh-failed-join');
        $('<div/>').text("failed to join, already in game").appendTo('#logged-in');
    });

    socket.on('show-active-players', function (data) {
        console.log('sh-show-active-players');
        for (var i = 0; i < data.length; i++) {
            $('#players').append('<div id="' + data[i] + '" class="player">' + data[i] + "</div>");
        }

    });

    socket.on('sh-ready-up', function (data) {
        console.log('sh-ready-up');
        $('#' + data).attr('class', 'player-ready');
        chat(data + ' is ready to start!');
    });

    socket.on('sh-unready', function (data) {
        console.log('sh-unready');
        $('#' + data).attr('class', 'player');
    });

    socket.on('start-sh', function (data) {
        console.log('start-sh');
        gameState = true;
        $('#unready').hide();
        $('#ready-up').hide();
        $('#play-sh').prop('disable', true);
        chat("STARTING GAME WITH " + data + " PLAYERS...", '#ff0000');
    });

    socket.on('choose-roles', function (data) {
        console.log('sh-choose-roles');
        if (data.h == currentUser) {
            socket.emit('join-sh-hitler');
            $('#assignment').append('<div class="role">You are Khomeini.</div>');
        }
        if (data.f.includes(currentUser)) {
            socket.emit('join-sh-fascists');
            $('#assignment').append('<div class="role">You are a Fanatic.</div>');
        } else if (data.l.includes(currentUser)) {
            socket.emit('join-sh-liberals');
            $('#assignment').append('<div class="role">You are a Progressive.</div>');
        }
    });

    socket.on('reset-sh', function () {
        flushChat();
        location.reload();
    });

    $('#send').click(function () {
        var input = $('#message');
        var text = input.val().trim();
        if (text.length > 0 && text.length < 250) {
            socket.emit('sh-message', {
                t: text,
                name: currentUser
            });
            input.val('');
        }
    });

    $('#message').on('keyup', function (e) {
        var ENTER_KEY = 13;
        if (e.keyCode === ENTER_KEY) {
            $('#send').click(); //sends message with enter key
        }
    });

    $('#leave-sh').click(function () {
        if (loggedIn) {
            $('#message').prop("disabled", true);
            $('#send').prop("disabled", true);
            $('#leave-sh').hide();
            $('#leave-sh').prop("disabled", true);
            $('#play-sh').show();
            $('#play-sh').prop("disabled", false);
            $('#ready-up').hide();
            socket.emit('sh-player-left', currentUser);
        } else {

        }
    });

    $('#chat-nav').click(function () {
        if (loggedIn) {
            socket.emit('sh-player-left', currentUser);
        } else {

        }
    });

    $('#play-sh').click(function () {
        if (loggedIn) {
            $('#message').prop("disabled", false);
            $('#send').prop("disabled", false);
            $('#play-sh').hide();
            $('#play-sh').prop("disabled", true);
            $('#leave-sh').show();
            $('#leave-sh').prop("disabled", false);
            inGame = true;
            socket.emit('sh-player-joined', currentUser);
        } else {

        }
    });

    $('#ready-up').click(function () {
        socket.emit('sh-ready-up', currentUser);
        $('#ready-up').hide();
        $('#unready').show();
    });

    $('#unready').click(function () {
        socket.emit('sh-unready', currentUser);
        $('#ready-up').show();
        $('#unready').hide();
    });
}


function chat(msg, c) { //broadcast function
    if (c)
        $('#log').append('<div class="msg" style="border: solid' + c + ' 3px">' + msg + '</div>');
    else
        $('#log').append('<p>' + msg + '</p>');
}

function flushChat() {
    $('#log').remove();
    $('#chat').append('<div id="log"></div>');
}
