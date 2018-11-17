var socket = io();
var loggedIn = localStorage.getItem('loggedIn');
var currentUser = localStorage.getItem('currentUser');

function setup(){
    
    if (loggedIn && currentUser != "") {
        $('#logged-in').append('<p class="warning">You are logged in as ' + currentUser + '</div>');
        $('#controls').show();
        $('#message').prop("disabled", false);
        $('#send').prop("disabled", false);
    } else {
        $('#logged-in').append('<p class="warning">You are not logged in. Go to the chat page to login.</div>');
    }
    
    socket.emit('joined-g');
    
    socket.on('g-message', function(data){
        chat(data.user + ": " + data.message, data.c)
    });
    
    $('#send').click(function () {
        var input = $('#message');
        var text = input.val().trim();
        if (text.length > 0 && text.length < 250) {
            socket.emit('g-message', {
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

function chat(msg, c) { //broadcast function
    $('#log').append('<p class="msg" style="border: solid' + c + ' 3px">' + msg + '</div>');
    document.getElementById('log').scrollTop = document.getElementById('log').scrollHeight;
}