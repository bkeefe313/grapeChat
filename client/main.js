var socket = io();
var loggedIn = localStorage.getItem("loggedIn");
var currentUser = localStorage.getItem("currentUser");


function setup() {
    $('#logout-button').hide();

    if (loggedIn && currentUser != "") {
        $('#login').hide();
        $('#logout-button').show();
        $('<a/>').text("You are logged in as " + currentUser).appendTo('#logged-in');

        socket.emit('user-login-bypass', {
            name: currentUser
        });
    }

    socket.on('welcome', function (data) {
        chat(data.text);
    });

    socket.on('otherUserConnect', function (data) {
        chat(data.n + ' conncected! Welcome to Grape Chat!'); //says someone connected
    });

    socket.on('otherUserDisconnect', function (data) {
        chat(data + ' disconnected'); //says someone disconnected
    });

    socket.on('message', function (data, id) {
        chat(data.user + ': ' + data.message, /*data.c,*/ data.user, data.id);
        console.log("id = " + data.id); //sends the message
    });

    socket.on('validated-account', function (data) {
        $('<div/>').text("Account created!").appendTo('#logged-in');
        $('#new-username').prop('disabled', true);
        $('#new-user-pw').prop('disabled', true);
        $('#create-account').prop('disabled', true);
    });

    socket.on('validated-login', function (data) {
        $('<div/>').text("You are now logged in as " + data.name + ".").appendTo('#logged-in');
        $('#login-button').prop('disabled', true);
        $('#new-username').prop('disabled', true);
        $('#new-user-pw').prop('disabled', true);
        $('#old-username').prop('disabled', true);
        $('#old-user-pw').prop('disabled', true);
        $('#create-account').prop('disabled', true);
        $('#controls').show();
        $('#message').prop('disabled', false);
        $('#send').prop('disabled', false);

        localStorage.setItem("currentUser", data.name);
        localStorage.setItem("loggedIn", true);
    });

    socket.on('validated-login-bypass', function (data) {
        $('#login-button').prop('disabled', true);
        $('#new-username').prop('disabled', true);
        $('#new-user-pw').prop('disabled', true);
        $('#old-username').prop('disabled', true);
        $('#old-user-pw').prop('disabled', true);
        $('#create-account').prop('disabled', true);
        $('#controls').show();
        $('#message').prop('disabled', false);
        $('#send').prop('disabled', false);

        localStorage.setItem("currentUser", data.name);
        localStorage.setItem("loggedIn", true);
    });

    socket.on('rejected-account', function (data) {
        $('<div/>').text("Failed account creation. " + data).appendTo('#logged-in');
        $('#new-username').prop('disabled', false);
        $('#new-user-pw').prop('disabled', false);
        $('#login-button').show();
    });

    socket.on('rejected-login', function (data) {
        $('<div/>').text("Failed login. " + data).appendTo('#logged-in');
        $('#old-username').prop('disabled', false);
        $('#old-user-pw').prop('disabled', false);
    });

    $('#logout-button').click(function () {
        loggedIn = false;
        localStorage.setItem("loggedIn", false);
        localStorage.setItem("currentUser", "");
        location.reload();
    });

    $('#create-account').click(function () {
        console.log('username saved');
        var username = $('#new-username');
        var txt = username.val().trim();
        var password = $('#new-user-pw');
        var pw = password.val().trim();
        if (txt.length > 0) {
            username.prop('disabled', true);
            password.prop('disabled', true);
            $('#controls').show();
            $('#message').prop('disabled', false);
            $('#send').prop('disabled', false);
            socket.emit('new-user', {
                t: txt,
                pw: pw
            });
        }
    });

    $('#login-button').click(function () {
        console.log('user attempting login');
        var username = $('#old-username');
        var txt = username.val().trim();
        var password = $('#old-user-pw');
        var pw = password.val().trim();
        if (txt.length > 0) {
            username.prop('disabled', true);
            password.prop('disabled', true);
            socket.emit('user-login', {
                t: txt,
                pw: pw
            });
        }
    });

    $('#send').click(function () {
            var input = $('#message');
            var text = input.val().trim();
            if (text.length > 0) {
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


    function chat(msg, user, id) { //broadcast function
        $('<div/>').text(msg).appendTo('#log');
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
