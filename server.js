'use strict';

var http = require('http');
var express = require('express');
var WebSocket = require('ws');
var PlayerController = require('./playercontroller');
var GameController = require('./gamecontroller');
var Utility = require('../Shared/utility');

var app = express();
var server = http.createServer(app);
var wsserver = new WebSocket.Server({ server: server });

var playerControllers = {};
var gameControllers = {};
var lobbyControllers = {};
var utility = new Utility();

var lobbyTick = 0;

//gameControllers["fakegame"] = new GameController();
runServerLoop();
//runServerLoop();


wsserver.on('connection', function connection(ws) {
    console.log("New connection")
    
    //Create a new playerController object
    var newId = utility.uuidGen(10);
    var player = new PlayerController({ws: ws, uuid: newId});
    playerControllers[newId] = player;
    
    //immediately add the player to a lobby for testing purposes
    //gameControllers["fakegame"].addPlayer(player);
    //gameControllers["fakegame"].initializeGame();
    
    ws.on('message', function(message) {
      try {
        message = JSON.parse(message);
        
        if(message.type == "gameInput"){
            setTimeout(function(){
                if(player.location == "inGame" && player.gameId && gameControllers[player.gameId]){
                    gameControllers[player.gameId].addInput(message.data, player.uuid);
                    player.lastInputNumber++;    
                }
            },100)
        }
        if(message.type == "createGame"){
            if(player.location == "lobby"){

                let newGameId = utility.uuidGen(10);
                player.gameId = newGameId;
                player.name = message.data.playerName;
                gameControllers[newGameId] = new GameController(message.data.playerName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'), newGameId);
                gameControllers[newGameId].addPlayer(player);
                
                player.location = "inGame";
            }
        }
        if(message.type == "joinGame"){
            console.log(player.location)
            if(player.location != "inGame"){
                player.name = message.data.playerName;
                if(gameControllers[message.data.uuid].addPlayer(player)){
                    player.gameId = message.data.uuid;
                    player.location = "inGame";    
                }    
            }
        }
        
        if(message.type == "leaveGame"){
            if(gameControllers[message.data.uuid] && player.gameId == message.data.uuid){
                delete gameControllers[message.data.uuid];
                player.gameId = undefined;
                player.location = "lobby";
            }
        }
        
        console.log(message);
      } catch (ex) {
        console.log(ex);
      }
    });
});


var tickLengthMs = 1000 / 48;
function runServerLoop(){
   //Create a loop that ticks all currently running games

  /* gameLoop related variables */
  // timestamp of each loop
  var previousTick = Date.now();
  // number of times gameLoop gets called
  var actualTicks = 0;
  var gameLoop = function () {
    var now = Date.now();
    
    actualTicks++;
    if (previousTick + tickLengthMs <= now) {
      var delta = (now - previousTick);
      previousTick = now;
  
      update(delta);
  
      //console.log('delta', delta, '(target: ' + tickLengthMs +' ms)', 'node ticks', actualTicks)
      actualTicks = 0;
    }
  
    if (Date.now() - previousTick < tickLengthMs - 16) {
      setTimeout(gameLoop);
    } else {
      setImmediate(gameLoop);
    }
  };
  
  gameLoop();
}

function update(delta){
    //Check if players left
    for (let key in playerControllers) {
        let playerWS = playerControllers[key].ws;
        if (playerWS.readyState != 1) {
            delete gameControllers[playerControllers[key].gameId];
            delete playerControllers[key];
        }
    } 
    
    //Update the actual games
    let gameList = [];
    for (let key in gameControllers) {
      gameControllers[key].update(delta);
      if(gameControllers[key].markedForDeletion){
        delete gameControllers[key];
      }
      else {
        gameList.push([gameControllers[key].name, gameControllers[key].uuid, gameControllers[key].playerCount]);  
      }
    }
    
    //Send lobby info to players
    lobbyTick++;
    if(lobbyTick > 50){
        lobbyTick = 0;
        for (let key in playerControllers) {
            let m = {
                type: "lobbyData",
                data: {
                    gameList: gameList,
                    location: playerControllers[key].location,
                    gameId: playerControllers[key].gameId,
                },
            }
            playerControllers[key].send(m);
        }    
    }
}

server.listen(8080);