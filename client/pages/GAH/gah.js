var socket = io();
var loggedIn = localStorage.getItem('loggedIn');
var currentUser = localStorage.getItem('currentUser');

var inLobby = false;
var players = [];
var whiteDeck = [];
var blueDeck = [];
var host = false;
var choosingCard = false;
var confirmingCard = false;
var choosingWinner = false;
var confirmingWinner = false;
var possibleWinners = [];
var possibleCardWinners = [];
var gameState = false;

function setup() {

    enteredPage();

    socket.on('show-gah-players', function (data) {
        for (var i = 0; i < data.p.length; i++) {
            if (data.rp.includes(data.p[i])) {
                $('#player-list').append('<div id="' + data.p[i] + '" class="ready-player-card">' + data.p[i] + '</div>');
            } else {
                $('#player-list').append('<div id="' + data.p[i] + '" class="player-card">' + data.p[i] + '</div>');
            }
        }
        players = data.p;
        
        if(data.gs){
            gameState = true;
            $('#join-leave-gah').hide();
            $('#logged-in').append('<p class="warning">You cannot join a game in progress.</div>')
        }
    });

    socket.on('g-message', function (data) {
        chat(data.user + ": " + data.message, data.c)
    });

    socket.on('player-joined-gah', function (data) {
        $('#player-list').append('<div id="' + data + '" class="player-card">' + data + '</div>');
    });

    socket.on('player-left-gah', function (data) {
        $('#' + data).remove();
    });

    socket.on('gah-ready', function (data) {
        $('#' + data).attr('class', 'ready-player-card');
    });

    socket.on('gah-unready', function (data) {
        $('#' + data).attr('class', 'player-card');
    });

    socket.on('reset-gah', function () {
        chat(" GAME ENDING...", '#ff0000');
        resetVars();
        var int = setInterval(function () {
            location.reload();
            gameState = false;
            clearInterval(int);
        }, 5000);
    });

    socket.on('start-gah', function (data) {
        chat('Starting game with ' + data.num + ' players...', 'darkgreen');
        socket.emit('get-cards-initial-gah');
        $('#ready-toggle').hide();
        gameState = true;
        if(currentUser == data.j)
            socket.emit('new-round-gah');
    });

    socket.on('initial-cards-gah', function (data) {
        for (var i = 0; i < data.length; i++) {
            $('#player-cards').append('<div class="white-card">' + data[i] + '</div>');
        }
    });

    socket.on('card-drawn-gah', function (data) {
        $('#player-cards').append('<div class="white-card">' + data + '</div>');
    })

    socket.on('new-round-gah', function (data) {
        $('.blue-card').remove();
        $('#judge-cards').append('<div class="blue-card">' + data.c + '</div>');
        if(currentUser != data.j){
            socket.emit('draw-card-gah');
        }
        chat(data.j + ' is the judge this round.', 'green');
        $('#' + data.j).attr('class', 'judge');
        for (var i = 0; i < data.p.length; i++) {
            if (data.p[i] != data.j)
                $('#' + data.p[i]).attr('class', 'player-card');
        }
        if (currentUser == data.j) {
            $('#judge-cards').prop('disabled', false);
            $('#player-cards').prop('disabled', true);
        } else {
            $('#judge-cards').prop('disabled', true);
            $('#player-cards').prop('disabled', false);
            choosingCard = true;
        }
        
    });

    socket.on('host-permissions-gah', function () {
        $('#pack-choices').show();
        host = true;
    });

    socket.on('not-enough-cards-gah', function () {
        chat('Not enough packs selected to start game.', 'red');
    });

    socket.on('new-card-gah', function () {
        socket.emit('draw-card-gah');
    });

    socket.on('card-submitted-gah', function (data) {
        $('#judge-cards').append('<div class="hidden-card"></div>');
    });

    socket.on('start-judging-gah', function (data) {
        possibleWinners = data.u;
        possibleCardWinners = data.t;
        console.log(possibleWinners);
        console.log(possibleCardWinners);
        $('.hidden-card').remove();
        for (var i = 0; i < data.t.length; i++) {
            $('#judge-cards').append('<div class="judge-choice" id="' + data.t[i] + '">' + data.t[i] + '</div>');
        }
        if (currentUser == data.j) {
            choosingWinner = true;
        }
    });

    socket.on('winner-chosen-gah', function (data) {
        $('#judge-cards').append('<div class="winner">' + data.t + ': submitted by ' + data.u + '</div>');
        chat(data.u + ' won the round!', 'green');
        $('#' + data.u).html(data.u + ': ' + data.score);
        setTimeout(function () {
            $('.judge-choice').remove();
            $('.winner').remove();
            if(currentUser == data.j)
                socket.emit('new-round-gah');
        }, 5000);

    });

    $('#send').click(function () {
        var input = $('#message');
        var text = input.val().trim();
        if (text.length > 0 && text.length < 250) {
            socket.emit('gah-message', {
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

    $('#join-leave-gah').click(function () {
        if ($(this).attr('class') == 'not-in-game') {
            if (!players.includes(currentUser)) {
                $(this).html("Leave Game");
                $(this).attr("class", 'in-game');
                $('#ready-toggle').show();
                enableControls();
                $('#ready-toggle').html("Ready Up");
                $('#ready-toggle').attr("class", 'ready-button');
                socket.emit('join-gah', currentUser);
                inLobby = true;
            } else {
                $('#logged-in').append('<div class="warning">Cannot join, already in game</div>');
            }
        } else if ($(this).attr('class') == 'in-game') {
            $(this).html("Join Game");
            $(this).attr("class", 'not-in-game');
            $('#ready-toggle').hide();
            socket.emit('leave-gah', currentUser);
            disableControls();
            inLobby = false;
            if(gameState){
                $(this).hide();
            }
        }
    });

    $('#ready-toggle').click(function () {
        if ($(this).attr('class') == 'ready-button') {
            $(this).html("Unready");
            $(this).attr("class", 'unready-button');
            socket.emit('gah-ready', currentUser);
        } else if ($(this).attr('class') == 'unready-button') {
            $(this).html("Ready Up");
            $(this).attr("class", 'ready-button');
            socket.emit('gah-unready', currentUser);
        }
    });

    $('#purge-gah').click(function () {
        var input = $('#purge-password');
        var text = input.val().trim();
        if (text == "purge13") {
            socket.emit('reset-gah');
        }
    });

    $('#chat-link').click(function () {
        $(this).html("Join Game");
        $(this).attr("class", 'not-in-game');
        $('#ready-toggle').hide();
        socket.emit('leave-gah', currentUser);
        socket.emit('left-gah-page');
        disableControls();
        inLobby = false;
    });

    $('#confirm-packs').click(function () {
        if (host) {
            socket.emit('selected-packs-gah', choosePacks());
        }
        $('#pack-choices').hide();
    });

    $('#confirm-card').click(function () {
        if (confirmingCard) {
            var content = $('.chosen-card').text();
            socket.emit('card-chosen-gah', {
                t: content,
                u: currentUser
            });
            confirmingCard = false;
            choosingCard = false;
            $('.chosen-card').remove();
            $('#confirm-card').prop('disabled', true);
        }
    });

    $('#confirm-judge-choice').click(function () {
        if (confirmingWinner) {
            var content = $('.judge-chosen-card').attr('id');
            console.log(content);
            var user = possibleWinners[possibleCardWinners.indexOf(content)];
            console.log(user);
            socket.emit('judge-chose-winner-gah', {
                t: content,
                u: user
            });
            confirmingWinner = false;
            choosingWinner = false;
            $(this).prop('disabled', true);
            $('.judge-chosen-card').attr('class', 'judge-choice');
        }
    });

}

function draw() {
    $('.white-card').click(function () {
        if (choosingCard) {
            confirmingCard = true;
            $('.chosen-card').attr('class', 'white-card');
            $(this).attr('class', 'chosen-card');
            $('#confirm-card').prop('disabled', false);
        }
    });

    $('.judge-choice').click(function () {
        if (choosingWinner) {
            confirmingWinner = true;
            $('.judge-chosen-card').attr('class', 'judge-choice');
            $(this).attr('class', 'judge-chosen-card');
            $('#confirm-judge-choice').prop('disabled', false);
        }
    });
}

function chat(msg, c) { //broadcast function
    $('#log').append('<p class="msg" style="border: solid' + c + ' 3px">' + msg + '</div>');
    document.getElementById('log').scrollTop = document.getElementById('log').scrollHeight;
}

function disableControls() {
    $('#message').prop('disabled', true);
    $('#send').prop('disabled', true);
    $('#player-cards').prop('disabled', true);
    $('#judge-cards').prop('disabled', true);
}

function enableControls() {
    $('#message').prop('disabled', false);
    $('#send').prop('disabled', false);
}

function enteredPage() {
    disableControls();

    $('#ready-toggle').hide();
    socket.emit('on-gah-page');
    $('#pack-choices').hide();

    if (loggedIn && currentUser != "") {
        $('#logged-in').append('<p class="warning">You are logged in as ' + currentUser + '</div>');
        $('#controls').show();
    } else {
        $('#logged-in').append('<p class="warning">You are not logged in. Go to the chat page to login.</div>');
    }
}

function resetVars() {
     players = [];
     whiteDeck = [];
     blueDeck = [];
     host = false;
     choosingCard = false;
     confirmingCard = false;
     choosingWinner = false;
     confirmingWinner = false;
     possibleWinners = [];
     possibleCardWinners = [];
     gameState = false;
}

function choosePacks() {
    var basePackChosen = $('#base-pack').val();
    var personalPackChosen = $('#personal-pack').val();

    console.log(basePackChosen == 'on');
    console.log(personalPackChosen == 'on');

    var packsChosen = [];

    if (basePackChosen == 'on') {
        packsChosen.push('base');
    }
    if (personalPackChosen == 'on') {
        packsChosen.push('personal');
    }

    return packsChosen;
}
