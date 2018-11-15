var socket = io();
var loggedIn = localStorage.getItem("loggedIn");
var currentUser = localStorage.getItem("currentUser");
var nameOfHitler = 'Khomeini';
var nameOfChancellor = 'Ayatollah';
var nameOfPresident = 'Shah';
var nameOfFascists = 'Traditionalist';
var nameOfLiberals = 'Progressive';

//var inGame = false;
var gameState = false;
var liberals = [];
var fascists = [];
var players = [];
var hitler = '';
var choosingChancellor = false;
var voting = false;
var president = '';
var chancellor = '';

function setup() {
    $('#controls').hide();
    $('#play-sh').hide();
    $('#leave-sh').hide();
    $('#ready-up').hide();
    $('#unready').hide();
    $('#leave-sh').prop("disabled", true);
    $('#voting').hide();

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
        $('#players').append('<button id="' + data.name + '" class="player">' + data.name + "</button>");
        for(var i = 0; i < data.rp.length; i++){
            $('#' + data.rp[i]).attr('class', 'player-ready');
        }
        if (data.name == currentUser) {
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
        if (data.h != '') {
            if (data.h == data.name && data.gs) {
                setTimeout(socket.emit('sh-end-game', nameOfHitler +" left,"), 5000);
                gameState = false;
            } else if (data.nl < 1 && data.gs) {
                setTimeout(socket.emit('sh-end-game', "ALL " + nameOfLiberals + "s LEFT,"), 5000);
                gameState = false;
            } else if (data.nf < 1 && data.gs) {
                setTimeout(socket.emit('sh-end-game', "ALL "+ nameOfFascists + "s LEFT,"), 5000);
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
        for (var i = 0; i < data.p.length; i++) {
            $('#players').append('<div id="' + data.p[i] + '" class="player">' + data.p[i] + "</div>");
            if (data.rp.includes(data.p[i])) {
                $('#' + data.p[i]).attr('class', 'player-ready');
            }
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
        hitler = data.h;
        liberals = data.l;
        fascists = data.f;
        players = data.p;
        if (hitler == currentUser) {
            socket.emit('join-sh-hitler');
            $('#assignment').append('<div class="role">You are' + nameOfHitler + ', and a ' + nameOfFascists + '.</div>');
            $('#assignment').append('<div class="guide">Your goal is to enact 6 ' + nameOfFascists + ' policies or be elected as' + nameOfChancellor + 'after 3 ' + nameOfFascists + ' policies are enacted.</div>');
        } else if (fascists.includes(currentUser)) {
            socket.emit('join-sh-fascists');
            $('#assignment').append('<div class="role">You are a ' + nameOfFascists + '.</div>');
            $('#assignment').append('<div class="guide">Your goal is to enact 6 ' + nameOfFascists + ' policies or to elect' + nameOfHitler + ' as ' + nameOfChancellor + ' after 3 ' + nameOfFascists + 'policies are enacted.</div>');
        } else if (liberals.includes(currentUser)) {
            socket.emit('join-sh-liberals');
            $('#assignment').append('<div class="role">You are a' + nameOfLiberals + '.</div>');
            $('#assignment').append('<div class="guide">Your goal is to enact 5 ' + nameOfLiberals + ' policies or to assassinate' + nameOfHitler + '.</div>');
        }
        console.log(data.pres);
        $('#' + data.pres).css('border', 'solid cyan 2px');
        showRoles();
        if (data.pres == currentUser) {
            nominateChancellor();
        }
    });

    socket.on('reset-sh', function (data) {
        flushChat();
        chat(data + " GAME ENDING...", '#ff0000');
        resetVars();
        var int = setInterval(function () {
            location.reload();
            clearInterval(int);
        }, 5000);
    });

    socket.on('otherUserDisconnect', function (data) {
        chat(data.name + " has disconnected from the lobby!");
        $('#' + data.name).remove();
        if (data.h != '') {
            if (data.h == data.name && data.gs) {
                setTimeout(socket.emit('sh-end-game', nameOfHitler + " left,"), 5000);
                gameState = false;
            } else if (data.nl < 1 && data.gs) {
                setTimeout(socket.emit('sh-end-game', "ALL " + nameOfLiberals + "s left,"), 5000);
                gameState = false;
            } else if (data.nf < 1 && data.gs) {
                setTimeout(socket.emit('sh-end-game', "ALL " + nameOfFascists + "s left,"), 5000);
                gameState = false;
            }
        }
    });

    socket.on('chancellor-nominated', function (data) {
        console.log('#' + data.c);
        console.log($('#' + data.c));
        $('#' + data.c).css('border', 'solid red 2px');
        chat(data.c + " has been nominated as" + nameOfChancellor + ".", 'cyan');
        chat("Vote for whether or not you support this government.", 'cyan');
        $('#voting').show();
    });

    socket.on('yes-for-gov', function (data) {
        chat(data + " voted FOR this government.", 'green');
    });

    socket.on('no-for-gov', function (data) {
        chat(data + " voted AGAINST this government.", 'red');
    });

    socket.on('voting-failed', function (data) {
        chat("The election failed. The next nominee for " + nameOfPresident + " is " + data.presNom);
    });

    socket.on('voting-passed', function (data) {
        president = data.pres;
        chancellor = data.chan;
        chat("The election was successful. " + president + " is the new " + nameOfPresident + " and " + chancellor + " is the new " + nameOfChancellor + ".", 'cyan');
        if (president == currentUser) {
            socket.emit('action-phase');
        }
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
            $('#unready').hide();
            if (gameState == true)
                $('#play-sh').hide();
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
            //inGame = true;
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

    $('#purge-sh').click(function () {
        var input = $('#purge-password');
        var text = input.val().trim();
        if (text == "purge13") {
            setTimeout(socket.emit('sh-end-game', "GAME PURGED,"), 5000);
            gameState = false;
        }
    });

    $('#gov-yes').click(function () {
        socket.emit('yes-for-gov', currentUser);
        $('#voting').hide();
    });

    $('#gov-no').click(function () {
        socket.emit('no-for-gov', currentUser);
        $('#voting').hide();
    });
}

function draw() {
    $('.player').click(function () {
        var text = $(this).attr('id');
        if (choosingChancellor && text != currentUser) {
            console.log('player clicked');
            socket.emit('chancellor-nominated', text);
            choosingChancellor = false;
        }
    });
}

function flushChat() {
    $('#log').remove();
    $('#chat').append('<div id="log"></div>');
}

function showRoles() {
    var numPlayers = players.length;
    if (numPlayers <= 6) {
        if (fascists.includes(currentUser)) {
            for (var i = 0; i < fascists.length; i++) {
                if (fascists[i] != hitler) {
                    $('#' + fascists[i]).html(fascists[i] + ': ' nameOfFascists);
                } else {
                    $('#' + fascists[i]).html(fascists[i] + ': ' + nameOfHitler);
                }
            }
        }
    } else if (numPlayers > 6) {
        if (fascists.includes(currentUser) && currentUser != hitler) {
            for (var i = 0; i < fascists.length; i++) {
                if (fascists[i] != hitler) {
                    $('#' + fascists[i]).html(fascists[i] + ': ' nameOfFascists);
                } else {
                    $('#' + fascists[i]).html(fascists[i] + ': ' nameOfHitler);
                }
            }
        }
    }

    for (var i = 0; i < numPlayers; i++) {
        $('#' + players[i]).attr('class', 'player');
    }
}

function nominateChancellor() {
    chat("You are the " + nameOfPresident. + " Choose a " + nameOfChancellor + " candidate.", 'cyan');
    choosingChancellor = true;
}

function chat(msg, c) { //broadcast function
    if (c)
        $('#log').append('<div class="msg" style="border: solid ' + c + ' 3px">' + msg + '</div>');
    else
        $('#log').append('<p>' + msg + '</p>');

    document.getElementById('log').scrollTop = document.getElementById('log').scrollHeight;
}

function resetVars() {
    gameState = false;
    liberals = [];
    fascists = [];
    players = [];
    hitler = '';
    choosingChancellor = false;
    voting = false;
    president = '';
    chancellor = '';
}
