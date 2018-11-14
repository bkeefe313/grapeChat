var socket = io();
var loggedIn = localStorage.getItem("loggedIn");
var currentUser = localStorage.getItem("currentUser");


function setup() {
    $('#logout-button').hide();
    $('#new-color').hide();

    if (loggedIn && currentUser != "") {
        $('#login').hide();
        $('#logout-button').show();
        $('#new-color').show();
        $('#logged-in').append('<p class="warning">You are logged in as ' + currentUser + '</div>');
        $('#controls').show();
        $('#message').prop("disabled", false);
        $('#send').prop("disabled", false);
    }

    socket.on('welcome', function (data) {
        chat(data.text);
    });

    socket.on('otherUserConnect', function (data) {
        chat(data.n + ' conncected! Welcome to Grape Chat!'); //says someone connected
    });

    socket.on('otherUserDisconnect', function (data) {
        chat(data.name + ' disconnected'); //says someone disconnected
    });

    socket.on('message', function (data) {
        chat(data.user + ': ' + data.message, data.c);
    });

    socket.on('validated-login', function (data) {
        $('#login').hide();
        $('#logout-button').show();
        $('#new-color').show();
        $('#controls').show();
        $('#message').prop('disabled', false);
        $('#send').prop('disabled', false);

        localStorage.setItem("currentEmail", data.e);
        localStorage.setItem("currentUser", data.name);
        localStorage.setItem("loggedIn", true);

        currentUser = localStorage.getItem("currentUser");

        $('#logged-in').append('<p class="warning">You are logged in as ' + currentUser + '</div>');
    });

    socket.on('rejected-login', function (data) {
        $('<div/>').text("Failed login. " + data).appendTo('#logged-in');
    });

    socket.on('new-color-created', function (data) {
        c = data;
    });

    $('#logout-button').click(function () {
        loggedIn = false;
        localStorage.setItem("loggedIn", false);
        localStorage.setItem("currentUser", "");
        location.reload();
    });

    $('#login-button').click(function () {
        console.log('user attempting login');
        var username = $('#username');
        var txt = username.val().trim();
        if (txt.length > 0 && !txt.includes(' ') && !txt.includes('.') && !txt.charAt(0) == ('_')) {
            username.prop('disabled', true);
            socket.emit('user-login', {
                t: txt
            });
        } else {
            $('<div/>').text("invalid username, no spaces or periods, and first character must be a letter").appendTo('#logged-in');
        }
    });

    $('#new-color').click(function () {
        socket.emit('request-new-color', currentUser);
    });

    $('#send').click(function () {
        var input = $('#message');
        var text = input.val().trim();
        if (text.length > 0 && text.length < 250) {
            socket.emit('message', {
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
    

}



function draw() { //calls constantly
    
}


function chat(msg, c) { //broadcast function
    $('#log').append('<p class="msg" style="border: solid' + c + ' 3px">' + msg + '</div>');
    document.getElementById('log').scrollTop = document.getElementById('log').scrollHeight;
}

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

