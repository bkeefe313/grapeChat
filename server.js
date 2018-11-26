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

//resettable SH
{
    var shPlayers = [];
    var shReadyPlayers = [];
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
    var shDeck = [];
    var votersForGov = [];
    var votersAgainstGov = [];
}
//Bots
{
    var bots = [];
    var fascistBots = [];
    var liberalBots = [];
    var hitlerBots = [];
    var numBots = 0;
    var botNominee = [];
    var currentBot = 0;
    var gameOver = false;
    var fCardCount = 0;
    var fascistPres = false;
    var fascistChan = false;
    var presPolicies = [];
    var chanPolicy = false;
    var peekResult = 0;
    var target = '';
}
//SH names
{
    var nameOfHitler = 'Hitler';
    var nameOfChancellor = 'Chancellor';
    var nameOfPresident = 'President';
    var nameOfFascists = 'Fascist';
    var nameOfLiberals = 'Liberal';
}
//GAH resettable
{
    var gahJudge = '';
    var gahPlayers = [];
    var gahReadyPlayers = [];
    var blueDeck = [];
    var whiteDeck = [];
    var personalPack = false;
    var basePack = false;
    var gahGameActive = false;
    var submittedCardCount = 0;
    var submittedCards = [];
    var submittedCardUsers = [];
    var playerScores = [];
}
//GAH packs
{
    var basePackBlue = ["Call your doctor if you experience ____ for more than 4 hours.", "Today I learned that ____ can lead to erectile dysfunction.", "Airport security stopped and searched me when they noticed ____.", "I jumped off the bridge as soon as I saw ____.", "Elon Musk's new project: ____.", "____? Sounds like a personal problem.", "Kids today need to learn about ____.", "My dog is ____, I don't know what to do.", "Oh frick! What if my mom sees me when I'm ____!", "Four score and seven years ago, our fathers brought forth ____..."];
    var basePackWhite = ["detective pikachu", "that one song that goes 'ooooh you touch my tralala'", "putting up christmas lights on Thanksgiving", "a gaggle of geese", "Ayatollah Khomeini", "a slow and agonizing descent into madness", "Leonardo DiCaprio's <b>one</b> oscar", "a pair of carjacks + my nipples", "dividing by zero", "CNN", "being addicted to eating rocks", "invading poland", "a broken bungie cable", "Slaughtering innocent Chinese women and children at Nanjing.", "a sumo wrestler sitting on your face"];
    var personalPackBlue = ["Gentlemen, the next time I see ____ it's a class jug.", "According to <i>An Introduction to Catholic Ethics</i>, all ethical teachings can be explained in a metaphor about ____", "Fallout 76 isn't bad, it just isn't as good as ____.", "Nick Cochrin is such a liberal. I mean come on, look at how much he loves ____!", "Gus enjoys ____ way too much.", "____? That's not very epic...", "____? That ain't very cash money of you.", "The new siege operator takes ____ to a whole new level.", "Sea of Thieves is a good game. The new update brought in ____!", "A really big fucking ____ coming right up.", "Ian Bowen left Rockhurst because of ____.", "Peanut butter is best with ____."];
    var personalPackWhite = ["bengay", "Mr. Wooten", "SCOD", "Rhonda", "Henry Retardo", "David Spitz", "Juuling in the third floor bathroom", "Coach Moe", "Nutting in No Nut Novemeber", "time and space", "Right Wing Populism", "Lucas Richardson", "Gillcrist's beard", "Red Dead Redemption 2", "Nick Cockring", "Ian", "Mr. Valentini", "medium-rare ribeye steak", "a liberal", "slig", "homosexuals", "the Victory App", "romaine lettuce", "an epic victory royale", "gross brown shoes", "a marshmallow someone named Keith", "voiceoverpete", "Hyperdimension Neptunia"];
}

io.on('connection', (socket) => {

    //user logs in
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

    //user requests a color
    socket.on('request-new-color', function (data) {
        userColors[users.indexOf(data)] = '#' + Math.floor(Math.random() * 16777215).toString(16);
    });

    //user sends msg
    socket.on('message', function (data) {
        var message = {
            user: data.name,
            message: data.t,
            c: userColors[users.indexOf(data.name)]
        };
        io.sockets.emit('message', message);

        console.log(data.name + ': ' + data);
    });

    //user disconnects (doesn't really work all that well for SH)
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
                if (shReadyPlayers.includes(socket.user)) {
                    shReadyPlayers.splice(shReadyPlayers.indexOf(socket.user), 1);
                }
            }

            if (gahPlayers.includes(socket.user)) {
                io.to('gah-page').emit('player-left-gah', socket.user);
                gahPlayers.splice(shPlayers.indexOf(socket.user, 1));
                if (gahReadyPlayers.includes(socket.user)) {
                    gahReadyPlayers.splice(shReadyPlayers.indexOf(socket.user), 1);
                }
            }
        }
    });

    //Secret Hitler
    {
        //player sends msg in SH
        socket.on('sh-message', function (data) {
            var message = {
                user: data.name,
                message: data.t,
                c: userColors[users.indexOf(data.name)]
            };
            io.emit('sh-message', message);
        });

        //player joins SH lobby
        socket.on('sh-player-joined', function (data) {
            var color = userColors[users.indexOf(data)];

            if (!shPlayers.includes(data)) {
                shPlayers.push(data);
                if (shReadyPlayers.includes(data))
                    shReadyPlayers.splice(shReadyPlayers.indexOf(data), 1);
                io.emit('sh-player-joined', {
                    name: data,
                    c: color,
                    num: shPlayers.length,
                    rp: shReadyPlayers
                });
            } else {
                socket.emit('sh-failed-join');
            }
        });

        //player leaves SH lobby
        socket.on('sh-player-left', function (data) {
            console.log('player-left');
            if (shReadyPlayers.includes(data)) {
                shReadyPlayers.splice(shReadyPlayers.indexOf(data), 1);
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

        //user enters SH page
        socket.on('entered-sh-page', function () {
            socket.emit('show-active-players', {
                p: shPlayers,
                rp: shReadyPlayers
            });
            if (shGameActive)
                socket.emit('sh-in-progress')
        });

        //player readies up
        socket.on('sh-ready-up', function (data) {
            shReadyPlayers.push(data);
            io.emit('sh-ready-up', data);
            if (shReadyPlayers.length == shPlayers.length) {
                //Populate lobby with bots
                while (shReadyPlayers.length < 5) {
                    addBot();
                }
                io.emit('start-sh', shReadyPlayers.length);
                io.emit('choose-roles', setRoles());
                shGameActive = true;
                turnNum++;
                if (shDeck.length >= 3)
                    topThreePolicies = [shDeck.pop(), shDeck.pop(), shDeck.pop()];
                else
                    buildSHDeck();
            }
        });

        //player cancels ready up
        socket.on('sh-unready', function (data) {
            shReadyPlayers.splice(shReadyPlayers.indexOf(data), 1);
            io.emit('sh-unready', data);
        });

        //for joining socketio room for game lobby
        socket.on('join-sh-lobby', function () {
            socket.join('sh-lobby');
        });

        //for joining hitler socketio room
        socket.on('join-sh-hitler', function () {
            socket.join('sh-hitler');
        });

        //for joining liberal socketio room
        socket.on('join-sh-liberals', function () {
            socket.join('sh-liberals');
        });

        //for joining fascist socketio room
        socket.on('join-sh-fascists', function () {
            socket.join('sh-fascists');
        });

        //for joining chancellor socketio room
        socket.on('join-sh-chancellor', function (data) {
            socket.join('sh-chancellor');
            console.log(chancellor + " is the new chancellor.");
            if (!gameOver) {
                botPres();
            }
        });

        //resets game upon win or purge
        socket.on('sh-end-game', function (data) {
            var reason = data;
            for (var i = 0; i < shPlayers.length; i++) {
                io.emit('sh-player-left', shPlayers[i]);
            }
            resetSHVars();
            io.emit('reset-sh', reason);
        });

        //pres nominates a chancellor
        socket.on('chancellor-nominated', function (data) {
            chanNom = data;
            io.emit('chancellor-nominated', {
                c: chanNom,
                p: presNom,
                shp: shPlayers
            });
            autoVote();
        })

        //someone voted yes for the gov
        socket.on('yes-for-gov', function (data) {
            votesForGov++;
            //            console.log("Players: " + shPlayers + "; Votes for: " + votesForGov + "; Votes against: " + votesAgainstGov + "; Total votes: " + (votesForGov + votesAgainstGov));
            votersForGov.push(data);
            checkVotes();
        });

        //someone voted no for the gov
        socket.on('no-for-gov', function (data) {
            votesAgainstGov++;
            //            console.log("Players: " + shPlayers + "; Votes for: " + votesForGov + "; Votes against: " + votesAgainstGov + "; Total votes: " + (votesForGov + votesAgainstGov));
            votersAgainstGov.push(data);
            checkVotes();
        });

        //pres chose his two policies
        socket.on('pres-chose-policies', function (data) {
            io.to('sh-chancellor').emit('policies-to-chancellor', data);
            presPolicies = data;
            botChan();
        });

        //chancellor chose his one policy to enact
        socket.on('chan-chose-policy', function (data) {
            //            console.log("deck: " + deck);
            if (shDeck.length >= 3) {
                topThreePolicies = [shDeck.pop(), shDeck.pop(), shDeck.pop()];
            } else {
                buildSHDeck();
            }
            //            console.log("top 3: " + topThreePolicies);
            //            console.log("deck: " + deck);
            if (data) {
                fPols++;
            } else {
                lPols++;
            }
            io.emit('policy-enacted', {
                policy: data,
                fPols: fPols,
                lPols: lPols,
                players: shPlayers.length,
                top: topThreePolicies
            });
            socket.leave('sh-chancellor');
            chanPolicy = data;
            printResults();
            botPowers();
        });

        //round ended
        socket.on('next-round', function (data) {
            nextRound(data);
        });

        //player is executed
        socket.on('sh-player-killed', function (data) {
            killPlayer(data);
        });

        //liberals won the game
        socket.on('liberals-win', function (data) {
            lWins++;
            io.emit('sh-game-finished', data);
            gameOver = true;
        });

        //fascists won the game
        socket.on('fascists-win', function (data) {
            fWins++;
            io.emit('sh-game-finished', data);
            gameOver = true;
        });

        //chancellor nomination was invalid
        socket.on('reset-chancellor-nom', function (data) {
            io.emit('try-chan-nom-again', presNom);
        });

        //three govs failed, chaos policy passes
        socket.on('chaos-policy-enacted', function (data) {
            if (shDeck.length >= 3) {
                topThreePolicies.splice(0, 1);
                topThreePolicies.push(shDeck.pop());
            } else {
                buildSHDeck();
            }
            if (data) {
                fPols++;
            } else {
                lPols++;
            }
            if (lPols >= 5) {
                lWins++;
                io.emit('sh-game-finished', ('Five ' + nameOfLiberals + ' policies enacted. ' + nameOfLiberals + 's win.'));
                gameOver = true;
            } else if (fPols >= 6) {
                fWins++;
                io.emit('sh-game-finished', ('Six ' + nameOfFascists + ' policies enacted. ' + nameOfFascists + 's win.'));
                gameOver = true;
            }
            rejectedGovs = 0;
            undesirables = [];
        });

        //player was investigated by pres
        socket.on('player-investigated', function (data) {
            io.emit('notify-investigation', data);
        });
    }

    //Grapes Against Humanity
    {
        //user enters gah page
        socket.on('on-gah-page', function () {
            socket.emit('show-gah-players', {
                p: gahPlayers,
                rp: gahReadyPlayers
            });
            socket.join('gah-page');
        });

        //player sends msg in gah
        socket.on('gah-message', function (data) {
            var message = {
                user: data.name,
                message: data.t,
                c: userColors[users.indexOf(data.name)]
            };
            io.to('gah-page').emit('g-message', message);
        });

        //player joins gah lobby
        socket.on('join-gah', function (data) {
            socket.join('gah-game');
            console.log(gahPlayers);
            if (gahPlayers < 1) {
                socket.emit('host-permissions-gah');
            }
            gahPlayers.push(data);
            io.to('gah-page').emit('player-joined-gah', data);
        });

        //players left lobby
        socket.on('leave-gah', function (data) {
            socket.leave('gah-game');
            gahPlayers.splice(data, 1);
            gahReadyPlayers.splice(data, 1);
            io.to('gah-page').emit('player-left-gah', data);
        });

        //player readied up
        socket.on('gah-ready', function (data) {
            gahReadyPlayers.push(data);
            io.to('gah-page').emit('gah-ready', data);

            if (gahPlayers.length >= 3 && gahPlayers == gahReadyPlayers) {
                buildGAHDecks();
                if (whiteDeck.length >= 1 && blueDeck.length >= 1) {
                    for (var i = 0; i < gahPlayers.length; i++) {
                        playerScores.push(0);
                    }
                    gahJudge = chooseGAHJudge();
                    io.to('gah-game').emit('start-gah', {
                        num: gahPlayers.length,
                        w: whiteDeck,
                        b: blueDeck,
                        j: gahJudge
                    });
                    gahGameActive = true;
                } else if (whiteDeck.length < 1 || blueDeck.length < 1) {
                    io.to('gah-game').emit('not-enough-cards-gah');
                }
            }
        });

        //player unready
        socket.on('gah-unready', function (data) {
            gahReadyPlayers.splice(data, 1);
            io.to('gah-page').emit('gah-unready', data);
        });

        //purged or ended game
        socket.on('reset-gah', function () {
            io.to('gah-page').emit('reset-gah');
            resetGAHVars();
            gahGameActive = false;
        });

        //user exited GAH page
        socket.on('left-gah-page', function () {
            socket.leave('gah-page');
            socket.leave('gah-game');
        });

        socket.on('new-round-gah', function () {
            gahJudge = nextGAHJudge();
            console.log("next round");

            io.to('gah-game').emit('new-round-gah', {
                j: gahJudge,
                c: drawBlueCard(),
                p: gahPlayers
            });
        });

        socket.on('get-cards-initial-gah', function () {
            var initialCards = [whiteDeck.pop(), whiteDeck.pop(), whiteDeck.pop(), whiteDeck.pop(), whiteDeck.pop(), whiteDeck.pop()];
            socket.emit('initial-cards-gah', initialCards);
        });

        socket.on('selected-packs-gah', function (data) {
            if (data.includes('base')) {
                basePack = true;
            }
            if (data.includes('personal')) {
                personalPack = true;
            }
        });

        socket.on('draw-card-gah', function () {
            socket.emit('card-drawn-gah', drawWhiteCard());
        });

        socket.on('card-chosen-gah', function (data) {
            submittedCardCount++;
            submittedCards.push(data.t);
            submittedCardUsers.push(data.u);
            io.to('gah-game').emit('card-submitted-gah');
            if (submittedCardCount == gahPlayers.length - 1) {
                io.to('gah-game').emit('start-judging-gah', {
                    t: submittedCards,
                    u: submittedCardUsers,
                    j: gahJudge
                });
                submittedCardCount = 0;
                submittedCards = [];
                submittedCardUsers = [];
            }
        });

        socket.on('judge-chose-winner-gah', function (data) {
            playerScores[gahPlayers.indexOf(data.u)]++;
            var scr = playerScores[gahPlayers.indexOf(data.u)];
            io.to('gah-game').emit('winner-chosen-gah', {
                u: data.u,
                t: data.t,
                score: scr,
                j: gahJudge
            });
        });

    }
});

//Add a bot to the game
function addBot() {
    numBots++;
    botName = 'bot' + numBots;
    shPlayers.push(botName);
    if (shReadyPlayers.includes(botName))
        shReadyPlayers.splice(shReadyPlayers.indexOf(botName), 1);
    io.emit('sh-player-joined', {
        name: botName,
        num: shPlayers.length,
        rp: shReadyPlayers
    });
    shReadyPlayers.push(botName);
    io.emit('sh-ready-up', botName);
    bots.push(botName);
}

//Bot nominates a chancellor
function autoChancellor() {
    if (bots.includes(presNom)) {
        console.log("A bot is president. Selecting a chancellor...");
        botNominee = shPlayers[Math.floor(Math.random() * (shPlayers.length))];
        while (undesirables.includes(botNominee) || presNom == botNominee) {
            botNominee = shPlayers[Math.floor(Math.random() * (shPlayers.length))];
        }
        chanNom = botNominee;
        io.emit('chancellor-nominated', {
            c: chanNom,
            p: presNom,
            shp: shPlayers
        });
        autoVote();
    }
}

//Bot votes
function autoVote() {
    if (fascists.includes(presNom)) {
        fascistPres = true;
    } else {
        fascistPres = false;
    }
    if (fascists.includes(chanNom)) {
        fascistChan = true;
    } else {
        fascistChan = false;
    }
    console.log("Bots voting...");
    while (currentBot < bots.length) {
        if (fascists.includes((bots[currentBot]))) {
            if (fascistPres || fascistChan) {
                botYes();
            } else {
                botNo();
            }
        } else {
            if (Math.floor(Math.random() * 2) == 1) {
                botYes();
            } else {
                botNo();
            }
        }
        currentBot++;
    }
    currentBot = 0;
}

//Bot votes yes
function botYes() {
    votesForGov++;
    //    console.log("Players: " + shPlayers + "; Votes for: " + votesForGov + "; Votes against: " + votesAgainstGov + "; Total votes: " + (votesForGov + votesAgainstGov));
    votersForGov.push(bots[currentBot]);
    checkVotes();
}

//Bot votes no
function botNo() {
    votesAgainstGov++;
    //    console.log("Players: " + shPlayers + "; Votes for: " + votesForGov + "; Votes against: " + votesAgainstGov + "; Total votes: " + (votesForGov + votesAgainstGov));
    votersAgainstGov.push(bots[currentBot]);
    checkVotes();
}

//Bot chooses policies as president
function botPres() {
    fCardCount = 0;
    if (bots.includes(president)) {
        console.log("A bot is president. Selecting policies...")
        for (var i = 0; i < topThreePolicies.length; i++) {
            if (topThreePolicies[i]) {
                fCardCount++;
            }
        }
        if ((fCardCount == 0) || ((fCardCount == 1) && !fascistPres)) {
            presPolicies.push(false, false);
        } else if (fCardCount == 1 || ((fCardCount == 2) && !fascistPres)) {
            presPolicies.push(true, false);
        } else {
            presPolicies.push(true, true);
        }
        console.log("Fascist Cards: " + fCardCount);
        io.to('sh-chancellor').emit('policies-to-chancellor', presPolicies);
        botChan();
    }
}

//Bot chooses policy as chancellor
function botChan() {
    fCardCount = 0;
    console.log("Top 3: " + topThreePolicies);
    if (bots.includes(chancellor)) {
        console.log("A bot is chancellor. Enacting a policy...")
        for (var i = 0; i < presPolicies.length; i++) {
            if (presPolicies[i]) {
                fCardCount++;
            }
        }
        if ((fCardCount == 0) || ((fCardCount == 1) && !fascistChan)) {
            chanPolicy = false;
        } else {
            chanPolicy = true;
        }
        if (shDeck.length >= 3) {
            topThreePolicies = [shDeck.pop(), shDeck.pop(), shDeck.pop()];
        } else {
            buildSHDeck();
        }
        if (chanPolicy) {
            fPols++;
        } else {
            lPols++;
        }
        io.emit('policy-enacted', {
            policy: chanPolicy,
            fPols: fPols,
            lPols: lPols,
            players: shPlayers.length,
            top: topThreePolicies
        });
        printResults();
        botPowers();
    }
}

//Print and clear election results for AI debugging
function printResults() {
    console.log("Pres Pols: " + presPolicies);
    console.log("Chan Pol: " + chanPolicy);
    console.log("Bots: " + bots);
    console.log("Fascists: " + fascists);
    console.log("Liberals: " + liberals);
    console.log("President: " + president);
    console.log("Chancellor: " + chancellor);
    presPolicies = [];
    fCardCount = 0;
}

//Bot uses presidential powers
function botPowers() {
    if (bots.includes(president)) {
        console.log("A bot is president. Checking powers...")
        if (chanPolicy) {
            if (fPols == 3) {
                policyPeek();
            } else if (fPols == 4 || fPols == 5) {
                execution();
            } else if (fPols == 6) {
                fWins++;
                io.emit('sh-game-finished', ('Six ' + nameOfFascists + ' policies enacted. ' + nameOfFascists + 's win.'));
                gameOver = true;
            } else {
                nextRound('');
            }
        } else {
            console.log("Liberal policy enacted. No presidential power.")
            if ((lPols == 5) && (bot.includes(president))) {
                lWins++;
                io.emit('sh-game-finished', ('Five ' + nameOfLiberals + ' policies enacted. ' + nameOfLiberals + 's win.'));
                gameOver = true;
            } else if (bots.includes(president)) {
                nextRound('');
            }
        }
    }
}

function policyPeek() {
    fCardCount = 0;
    for (var i = 0; i < topThreePolicies.length; i++) {
        if (topThreePolicies[i]) {
            fCardCount++;
        }
    }
    console.log("Policy peek, " + fCardCount + " fascist cards.");
    if (((presIndex == shPlayers.length + 1) && (fascists.includes(shPlayers[0]))) || (fascists.includes(shPlayers[presIndex + 1]))) {
        policyLie();
    } else {
        policyTruth();
    }
    nextRound('');
}

function policyLie() {
    console.log("Fascist president. Lying...");
    if (fCardCount == 3) {
        peekResult = 3;
    } else {
        peekResult = fCardCount + 1;
    }
    peekReport();
}

function policyTruth() {
    console.log("Liberal president. Reporting...");
    peekResult = fCardCount;
    peekReport();
}

function peekReport() {
    var message = "";
    if (peekResult == 3) {
        message = "There are three " + nameOfFascists + " policies and no " + nameOfLiberals + " policies."
    } else if (peekResult == 2) {
        message = "There are two " + nameOfFascists + " policies and one " + nameOfLiberals + " policy."
    } else if (peekResult == 1) {
        message = "There is one " + nameOfFascists + " policy and two " + nameOfLiberals + " policies."
    } else {
        message = "There are no " + nameOfFascists + " policies and three " + nameOfLiberals + " policies."
    }
    var report = {
        user: president,
        message: message
    };
    io.sockets.emit('sh-message', report);
    console.log(president + ': ' + report.message);
}

function execution() {
    if (fascists.includes(president)) {
        console.log("Fascist president. Executing liberal...");
        target = liberals[Math.floor(Math.random() * (liberals.length))];
        while (target == president) {
            console.log("Target: " + target);
            target = liberals[Math.floor(Math.random() * (liberals.length))];
        }
    } else {
        console.log("Liberal president. Executing a random player...");
        target = shPlayers[Math.floor(Math.random() * (shPlayers.length))];
        while (target == president) {
            console.log("Target: " + target);
            target = shPlayers[Math.floor(Math.random() * (shPlayers.length))];
        }
    }
    killPlayer(target);
    console.log("Executing " + target);
    if (target == hitler) {
        lWins++;
        io.emit('sh-game-finished', nameOfHitler + " was killed! " + nameOfLiberals + "s win!");
        gameOver = true;
    } else {
        nextRound('');
    }
}

//Checks if all votes are in
function checkVotes() {
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
            if (rejectedGovs >= 3) {
                undesirables = [];
                io.emit('sh-chaos', {
                    f: fPols,
                    l: lPols,
                    t: topThreePolicies[0]
                });
                rejectedGovs = 0;
            }
            if (!gameOver) {
                autoChancellor();
            }
        } else if (votesForGov > votesAgainstGov) {
            console.log("voting passed");
            president = presNom;
            chancellor = chanNom;
            undesirables = [];
            if (shPlayers.length > 5) {
                undesirables.push(president);
            }
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
            if (hitler == chancellor && fPols >= 3 && bots.includes(president)) {
                fWins++;
                io.emit('sh-game-finished', nameOfHitler + " was elected after 3 " + nameOfFascists + " policies were enacted. " + nameOfFascists + "s win!");
                gameOver = true;
            } else if (bots.includes(chancellor) && !gameOver) {
                botPres();
            }
        }
    }
}

//Advances the round
function nextRound(data) {
    votersForGov = [];
    votersAgainstGov = [];
    if (data == '') {
        console.log("next round");
        nextPresident();
        turnNum++;
        io.emit('new-round', {
            presNom: presNom,
            pres: president,
            chan: chancellor,
            u: undesirables
        });
        autoChancellor();
    } else {
        turnNum++;
        presNom = data;
        autoChancellor();
        io.emit('new-round', {
            presNom: data,
            pres: president,
            chan: chancellor,
            u: undesirables
        });
    }
}

function killPlayer(data) {
    if (shPlayers.includes(data)) {
        shPlayers.splice(shPlayers.indexOf(data), 1);
    }
    if (shReadyPlayers.includes(data)) {
        shReadyPlayers.splice(shReadyPlayers.indexOf(data), 1);
    }
    if (liberals.includes(data)) {
        liberals.splice(liberals.indexOf(data), 1);
    }
    if (fascists.includes(data)) {
        fascists.splice(fascists.indexOf(data), 1);
    }
    if (bots.includes(data)) {
        bots.splice(bots.indexOf(data), 1);
    }
    io.emit('player-killed', data);
}

//randomly mixes an array
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

//puts together the SH deck
function buildSHDeck() {
    shDeck = [];
    topThreePolicies = [];
    for (var i = 0; i < (11 - fPols); i++) {
        shDeck.push(true);
    }
    for (var i = 0; i < (6 - lPols); i++) {
        shDeck.push(false);
    }
    shuffle(shDeck);
    topThreePolicies = [shDeck.pop(), shDeck.pop(), shDeck.pop()];
    console.log('deck: ' + shDeck);
    console.log('top 3: ' + topThreePolicies);
}

//sets roles of all SH players
function setRoles() {
    shuffle(shPlayers);
    var hIndex = 0;

    buildSHDeck();

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
    if (bots.includes(hitler)) {
        hitlerBots.push(hitler);
    }

    var i = 0;
    while (i < shPlayers.length) {
        for (var z = 0; z < numFascists; z++) {
            fascists.push(shPlayers[i]);
            if (bots.includes(shPlayers[i])) {
                fascistBots.push(shPlayers[i]);
                console.log("added fascistbot");
            } else {
                console.log("added fascist");
            }
            i++;
        }
        for (var f = 0; f < numLiberals; f++) {
            liberals.push(shPlayers[i]);
            if (bots.includes(shPlayers[i])) {
                liberalBots.push(shPlayers[i]);
                console.log("added liberalbot");
            } else {
                console.log("added liberal");
            }
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
    autoChancellor();
    return roles;

}

//elects next president
function nextPresident() {
    var index = presIndex;
    prevPresNom = presNom;
    if (index >= shPlayers.length - 1)
        presNom = shPlayers[0];
    else
        presNom = shPlayers[index + 1];

    presIndex = shPlayers.indexOf(presNom);
}

//resets SH variables
function resetSHVars() {
    shDeck = [];
    shPlayers = [];
    shReadyPlayers = [];
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
    bots = [];
    fascistBots = [];
    liberalBots = [];
    hitlerBots = [];
    numBots = 0;
    botNominee = [];
    currentBot = 0;
    gameOver = false;
    fCardCount = 0;
    fascistPres = false;
    fascistChan = false;
    presPolicies = [];
    chanPolicy = false;
    peekResult = 0;
    target = '';
}

//select a judge for GAH
function chooseGAHJudge() {
    return gahPlayers[Math.floor(Math.random() * gahPlayers.length)];
}

//select next in line judge for GAH
function nextGAHJudge() {
    if (gahPlayers.indexOf(gahJudge) >= gahPlayers.length - 1) {
        return gahPlayers[0];
    } else {
        return gahPlayers[gahPlayers.indexOf(gahJudge) + 1];
    }
}

//reset GAH variables
function resetGAHVars() {
    gahJudge = '';
    gahPlayers = [];
    gahReadyPlayers = [];
    blueDeck = [];
    whiteDeck = [];
    personalPack = false;
    basePack = false;
    gahGameActive = false;
    submittedCardCount = 0;
    submittedCards = [];
    submittedCardUsers = [];
    playerScores = [];
}

function buildGAHDecks() {
    buildGAHWhite();
    buildGAHBlue();
    console.log(blueDeck)
    console.log(whiteDeck);

}

function buildGAHWhite() {
    whiteDeck = [];
    if (basePack) {
        for (var i = 0; i < basePackWhite.length; i++)
            whiteDeck.push(basePackWhite[i]);
    }
    if (personalPack) {
        for (var i = 0; i < personalPackWhite.length; i++)
            whiteDeck.push(personalPackWhite[i]);
    }

    shuffle(whiteDeck);
}

function buildGAHBlue() {
    blueDeck = [];
    if (basePack) {
        for (var i = 0; i < basePackBlue.length; i++)
            blueDeck.push(basePackBlue[i]);
    }
    if (personalPack) {
        for (var i = 0; i < personalPackBlue.length; i++)
            blueDeck.push(personalPackBlue[i]);
    }

    shuffle(blueDeck);
}

function drawWhiteCard() {
    if (whiteDeck.length > 0) {
        return whiteDeck.pop();
    } else {
        buildGAHWhite();
    }

    return whiteDeck.pop();
}

function drawBlueCard() {
    if (blueDeck.length > 0) {
        return blueDeck.pop();
    } else {
        buildGAHBlue();
    }

    return blueDeck.pop();
}
