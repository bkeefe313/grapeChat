var socket = io.connect('http://localhost:3000');
var userColor = '';

function setup() {
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
        chat(data.user + ': ' + data.message, data.c, data.user, data.id);
        console.log("id = " + data.id); //sends the message
    });

    $('#user-save').click(function () {
        console.log('user click');
        var username = $('#user-name');
        var txt = username.val().trim();
        userColor = (function (m, s, c) {
            return (c ? arguments.callee(m, s, c - 1) : '#') +
                s[m.floor(m.random() * s.length)]
        })(Math, '0123456789ABCDEF', 5); //makes the random user color
        console.log(userColor);
        if (txt.length > 0) {
            username.prop('disabled', true);
            $(this).hide();
            $('#controls').show();
            $('#message').prop('disabled', false);
            $('#send').prop('disabled', false);
            socket.emit('user', {
                t: txt,
                c: userColor //sends text and random^^^ color to the server
            });
        }
    });

    $('#send').click(function () {
        var input = $('#message');
        var text = input.val().trim();
        if (text.length > 0) {
            socket.emit('message', text); //message button code, sends to server before passing back to client so everyone can see
        }
        input.val('');
    });

    $('#user-name').on('keyup', function (e) {
        var ENTER_KEY = 13;
        if (e.keyCode === ENTER_KEY) {
            $('#user-save').click(); //saves username with enter key
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


function chat(msg, color, user, id) { //broadcast function
    $(document).ready(function () {
        var genId = generateId();
        console.log(genId);
        var chatLog = document.getElementById('log');
        var messageObj = document.createElement('div');
        var txt = document.createTextNode('\n' + msg);
        messageObj.appendChild(txt);
        chatLog.appendChild(messageObj);
        if (user) {
            messageObj.setAttribute("id", genId);
            console.log("new id = " + genId);
        }
        if (document.getElementById(genId)){
            document.getElementById(genId).style.color = color;
        }
        console.log(genId + "; " + color);
    });

    //$('<div/>').text(msg).appendTo('#log');
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
