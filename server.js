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

//non-resettable (^those too^)
var users = [];
var userColors = [];
var lWins = 0;
var fWins = 0;

//resettable
var shPlayers = [];
var readyPlayers = [];
var numLiberals = 0;
var numFascists = 0;
var fascists = [];
var liberals = [];
var hitler = '';
var shGameActive = false;
var president = '';
var chancellor = '';
var undesirables = [];
var votesForGov = 0;
var votesAgainstGov = 0;
var rejectedGovs = 0;
var topThreePolicies = [];
var chanNom = '';
var presNom = '';
var prevPresNom = '';
var presIndex = 0;
var fPols = 0;
var lPols = 0;
var turnNum = 0;
var deck = [];
var votersForGov = [];
var votersAgainstGov = [];

io.on('connection', (socket) => {

    socket.on('user-login', function (data) {
        var name = data.t;
        var color = '#' + Math.floor(Math.random() * 16777215).toString(16);
        var u = true;

        u = users.includes(name) || shPlayers.includes(name);

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

    //Secret Hitler
    {
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
                if (readyPlayers.includes(data))
                    readyPlayers.splice(readyPlayers.indexOf(data), 1);
                io.emit('sh-player-joined', {
                    name: data,
                    c: color,
                    num: shPlayers.length,
                    rp: readyPlayers
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
            if (liberals.includes(data)) {
                liberals.splice(liberals.indexOf(data), 1);
            }
            if (fascists.includes(data)) {
                fascists.splice(fascists.indexOf(data), 1);
            }
            shPlayers.splice(shPlayers.indexOf(data), 1);
            io.emit('sh-player-left', {
                name: data,
                h: hitler,
                gs: shGameActive,
                nl: liberals.length,
                nf: fascists.length
            });
        });

        socket.on('entered-sh-page', function () {
            socket.emit('show-active-players', {
                p: shPlayers,
                rp: readyPlayers
            });
            if (shGameActive)
                socket.emit('sh-in-progress')
        });

        socket.on('sh-ready-up', function (data) {
            readyPlayers.push(data);
            io.emit('sh-ready-up', data);
            if (readyPlayers.length == shPlayers.length && readyPlayers.length >= 5) {
                io.emit('start-sh', readyPlayers.length);
                io.emit('choose-roles', setRoles());
                shGameActive = true;
                turnNum++;
                if (deck.length >= 3)
                    topThreePolicies = [deck.pop(), deck.pop(), deck.pop()];
                else
                    buildDeck();
            } else if (readyPlayers.length == shPlayers.length && readyPlayers.length < 5) {
                io.to('sh-lobby').emit('not-enough-players', setRoles());
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
                socket.broadcast.emit('otherUserDisconnect', {
                    name: socket.user,
                    h: hitler,
                    gs: shGameActive
                });
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

        socket.on('join-sh-chancellor', function (data) {
            socket.join('sh-chancellor');
        });

        socket.on('sh-end-game', function (data) {
            var reason = data;
            for (var i = 0; i < shPlayers.length; i++) {
                io.emit('sh-player-left', shPlayers[i]);
            }
            resetShVars();
            io.emit('reset-sh', reason);
        });

        socket.on('chancellor-nominated', function (data) {
            chanNom = data;
            io.emit('chancellor-nominated', {
                c: chanNom,
                p: presNom,
                shp: shPlayers
            });
        })

        socket.on('yes-for-gov', function (data) {
            votesForGov++;
            console.log("Players: " + shPlayers + "; Votes for: " + votesForGov + "; Votes against: " + votesAgainstGov + "; Total votes: " + (votesAgainstGov + votesAgainstGov));
            votersForGov.push(data);

            if (votesAgainstGov + votesForGov == shPlayers.length) {
                console.log("all votes in");
                if (votesAgainstGov >= votesForGov) {
                    console.log("voting failed");
                    nextPresident();
                    io.emit('voting-failed', {
                        presNom: presNom,
                        pres: prevPresNom,
                        chan: chanNom,
                        va: votersAgainstGov,
                        vf: votersForGov
                    });
                    votesForGov = 0;
                    votesAgainstGov = 0;
                    rejectedGovs++;
                    votersAgainstGov = [];
                    votersForGov = [];
                    if (rejectedGovs == 3) {
                        undesirables = [];
                        io.emit('sh-chaos', {
                            f: fPols,
                            l: lPols
                        });
                    }
                } else if (votesForGov > votesAgainstGov) {
                    console.log("voting passed");
                    president = presNom;
                    chancellor = chanNom;
                    undesirables.push(president);
                    undesirables.push(chancellor);
                    io.emit('voting-passed', {
                        pres: president,
                        chan: chancellor,
                        top: topThreePolicies,
                        fPols: fPols,
                        va: votersAgainstGov,
                        vf: votersForGov
                    });
                    votesForGov = 0;
                    votesAgainstGov = 0;
                    rejectedGovs = 0;
                    votersAgainstGov = [];
                    votersForGov = [];
                }
            }
        });

        socket.on('no-for-gov', function (data) {
            votesAgainstGov++;
            console.log("Players: " + shPlayers + "; Votes for: " + votesForGov + "; Votes against: " + votesAgainstGov + "; Total votes: " + (votesAgainstGov + votesAgainstGov));
            votersAgainstGov.push(data);

            if (votesAgainstGov + votesForGov == shPlayers.length) {
                console.log("all votes in");
                if (votesAgainstGov >= votesForGov) {
                    console.log("voting failed");
                    nextPresident();
                    io.emit('voting-failed', {
                        presNom: presNom,
                        pres: prevPresNom,
                        chan: chanNom,
                        va: votersAgainstGov,
                        vf: votersForGov
                    });
                    votesForGov = 0;
                    votesAgainstGov = 0;
                    rejectedGovs++;
                    votersAgainstGov = [];
                    votersForGov = [];
                    if (rejectedGovs == 3) {
                        undesirables = [];
                        socket.emit('sh-chaos', {
                            f: fPols,
                            l: lPols
                        })
                    }
                } else if (votesForGov > votesAgainstGov) {
                    console.log("voting passed");
                    president = presNom;
                    chancellor = chanNom;
                    undesirables.push(president);
                    undesirables.push(chancellor);
                    io.emit('voting-passed', {
                        pres: president,
                        chan: chancellor,
                        top: topThreePolicies,
                        fPols: fPols,
                        va: votersAgainstGov,
                        vf: votersForGov
                    });
                    votesForGov = 0;
                    votesAgainstGov = 0;
                    rejectedGovs = 0;
                    votersAgainstGov = [];
                    votersForGov = [];
                }
            }
        });

        socket.on('pres-chose-policies', function (data) {
            io.to('sh-chancellor').emit('policies-to-chancellor', data);
        });

        socket.on('chan-chose-policy', function (data) {
            console.log(deck);
            if (deck.length >= 3)
                topThreePolicies = [deck.pop(), deck.pop(), deck.pop()];
            else
                buildDeck();
            console.log(topThreePolicies);
            console.log(deck);

            if (data)
                fPols++;
            else
                lPols++;
            io.emit('policy-enacted', {
                policy: data,
                fPols: fPols,
                lPols: lPols,
                players: shPlayers.length,
                top: topThreePolicies
            });
            socket.leave('sh-chancellor');
        });

        socket.on('next-round', function (data) {
            votersForGov = [];
            votersAgainstGov = [];
            if (data == '') {
                nextPresident();
                turnNum++;
                io.emit('new-round', {
                    presNom: presNom,
                    pres: president,
                    chan: chancellor,
                    u: undesirables
                });
                undesirables.splice(0, 2);
            } else {
                turnNum++;
                presNom = data;
                io.emit('new-round', {
                    presNom: data,
                    pres: president,
                    chan: chancellor,
                    u: undesirables
                });
                undesirables.splice(0, 2);
            }
        });

        socket.on('sh-player-killed', function (data) {
            if (shPlayers.includes(data)) {
                shPlayers.splice(shPlayers.indexOf(data), 1);
            }
            if (readyPlayers.includes(data)) {
                readyPlayers.splice(readyPlayers.indexOf(data), 1);
            }
            if (liberals.includes(data)) {
                liberals.splice(liberals.indexOf(data), 1);
            }
            if (fascists.includes(data)) {
                fascists.splice(fascists.indexOf(data), 1);
            }

            io.emit('player-killed', data);
        });

        socket.on('liberals-win', function (data) {
            lWins++;
            io.emit('sh-game-finished', data);
        });

        socket.on('fascists-win', function (data) {
            fWins++;
            io.emit('sh-game-finished', data);
        });

        socket.on('reset-chancellor-nom', function (data) {
            io.emit('try-chan-nom-again', presNom);
        });

        socket.on('chaos-policy-enacted', function (data) {
            if (deck.length >= 3)
                topThreePolicies = [deck.pop(), deck.pop(), deck.pop()];
            else
                buildDeck();

            if (data)
                fPols++;
            else
                lPols++;
            rejectedGovs = 0;
            undesirables = [];
        });

        socket.on('player-investigated', function (data) {
            io.emit('notify-investigation', data);
        });
    }

    //Grapes Against Humanity
    {
        socket.on('joined-g', function () {
            socket.join('g-lobby');
        });

        socket.on('g-message', function (data) {
            var message = {
                user: data.name,
                message: data.t,
                c: userColors[users.indexOf(data.name)]
            };
            io.to('g-lobby').emit('g-message', message);
        });

    }
});

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

function buildDeck() {
    for (var i = 0; i < 11; i++) {
        deck.push(true);
    }
    for (var i = 0; i < 6; i++) {
        deck.push(false);
    }

    shuffle(deck);
    console.log('deck: ' + deck);
}

function setRoles() {
    shuffle(shPlayers);
    var hIndex = 0;

    buildDeck();

    if (shPlayers.length < 5) {
        numFascists = shPlayers.length / 2;
        numLiberals = shPlayers.length - numFascists;
    } else if (shPlayers.length == 5) {
        numFascists = 2;
        numLiberals = 3
    } else if (shPlayers.length == 6) {
        numFascists = 2;
        numLiberals = 4
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
        l: liberals,
        p: shPlayers,
        pres: shPlayers[Math.floor(Math.random() * (shPlayers.length))]
    };

    presNom = roles.pres;
    presIndex = shPlayers.indexOf(roles.pres);
    console.log("chose roles.");
    console.log("fascists = " + fascists);
    console.log("liberals = " + liberals);
    console.log("shPlayers = " + shPlayers);
    console.log("numFascists = " + numFascists);
    console.log("numLiberals = " + numLiberals);

    return roles;

}

function nextPresident() {
    var index = presIndex;
    prevPresNom = presNom;
    if (index == shPlayers.length - 1)
        presNom = shPlayers[0];
    else
        presNom = shPlayers[index + 1];

    presIndex = shPlayers.indexOf(presNom);
}

function resetShVars() {
    deck = [];
    shPlayers = [];
    readyPlayers = [];
    numLiberals = 0;
    numFascists = 0;
    fascists = [];
    liberals = [];
    hitler = '';
    shGameActive = false;
    president = '';
    chancellor = '';
    undesirables = [];
    votesForGov = 0;
    votesAgainstGov = 0;
    rejectedGovs = 0;
    topThreePolicies = [];
    chanNom = '';
    presNom = '';
    prevPresNom = '';
    presIndex = 0;
    fPols = 0;
    lPols = 0;
    turnNum = 0;
    votersForGov = [];
    votersAgainstGov = [];
}
