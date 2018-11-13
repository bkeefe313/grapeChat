var socket = io();
var loggedIn = localStorage.getItem("loggedIn");
var currentUser = localStorage.getItem("currentUser");
var gameState = false;

function setup() {
    $('#controls').hide();
    $('#play-sh').hide();
    $('#leave-sh').hide();
    $('#ready-up').hide();
    $('#unready').hide();
    $('#leave-sh').prop("disabled", true);
    msgCount = 0;

    socket.emit('entered-sh-page');

    if (loggedIn && currentUser != "") {
        $('<p/>').text("You are logged in as " + currentUser).appendTo('#logged-in');
        $('#controls').show();
        $('#message').prop("disabled", true);
        $('#play-sh').show();
        $('#send').prop("disabled", true);
    } else {
        $('<p/>').text("You are not logged in and cannot play Secret Hitler. To log in, go back to the Chat page.").appendTo('#logged-in');
    }

    socket.on('sh-message', function (data) {
        chat(data.user + ': ' + data.message, data.c);
    });

    socket.on('sh-player-joined', function (data) {
        chat(data.name + " has joined the lobby!");
        $('#players').append('<div id="' + data.name + '" class="player">' + data.name + "</div>");
    });

    socket.on('sh-player-left', function (data) {
        chat(currentUser + " has left the lobby!");
        $('#' + currentUser).remove();
    });

    socket.on('sh-failed-join', function () {
        $('<div/>').text("failed to join, already in game").appendTo('#logged-in');
    });

    socket.on('show-active-players', function (data) {
        for (var i = 0; i < data.length; i++) {
            $('#players').append('<div id="' + data[i] + '" class="player">' + data[i] + "</div>");
        }
    });

    socket.on('sh-ready-up', function (data) {
        $('#' + data).attr('class', 'player-ready');
        chat(data + ' is ready to start!');
    });

    socket.on('sh-unready', function (data) {
        $('#' + data).attr('class', 'player');
    });

    socket.on('start-sh', function (data) {
        var i = 5;
        chat("STARTING GAME WITH " + data + " PLAYERS...", '#ff0000');
        var int = setInterval(function(){
            chat(i+'...', '#ff0000'); 
            if(i!=0)
                i--;
            else
                clearInterval(int);
        }, 1000);
        socket.emit('choose-roles');
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
            $('#ready-up').show();
            $('#leave-sh').prop("disabled", false);
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

function flushChat(){
    $('#log').remove();
    $('#chat').append('<div id="log"></div>');
}
