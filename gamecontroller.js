var Game = require('./Shared/game');

class GameController{
    constructor(name, uuid){
        this.players = {};
        this.playerCount = 0;
        this.timeStarted = 0;
        this.game = new Game();
        this.initialized = false;
        this.name = name;
        this.uuid = uuid;
        this.markedForDeletion = false;        
    }
    
    addPlayer(player){
        if(this.playerCount < 2){
            if(this.playerCount == 0){
                player.team = "A";
            }
            else {
                player.team = "B";
                let otherPlayer = this.players[Object.keys(this.players)[0]];
                
                //Set names
                player.enemyName = otherPlayer.name;
                otherPlayer.enemyName = player.name;
            }
            this.players[player.uuid] = player;
            
            this.playerCount++;
            if(this.playerCount == 2){
                this.initializeGame();
            }
            return true;
        }
        return false;
    }
    
    addInput(input, player){
        input.team = this.players[player].team;
        this.game.addInput(input);
    }
    
    initializeGame(){
        this.initialized = true;
        this.timeStarted = new Date();
        for(let key in this.players){
            let player = this.players[key];
            player.send({
                type: "stateChange",
                data: {
                    state: "initialize",
                    gameData: this.game.toSerializedData(),
                    teamAssign: player.team,
                    enemyName: player.enemyName,
                }
            });
        }
    }
    
    update(delta){
        if(this.initialized){
            this.game.tick(delta);
            
            if(this.game.winner != "none"){
                for(let key in this.players){
                    let player = this.players[key];
                    if(player.team == this.game.winner){
                        player.send({
                            type: "winner",
                            data: {
                                winner: "you",
                            }
                        });
                    }
                    else {
                        player.send({
                            type: "winner",
                            data: {
                                winner: "notyou",
                            }
                        });
                    }
                    player.location = "lobby";
                }
                this.markedForDeletion = true;
            }
            let currentTime = new Date();
            let passedTime = currentTime - this.timeStarted;
            if(passedTime > 20 * 1000){
                this.game.stage++;
                this.timeStarted = new Date();
            }
            
            for(let key in this.players){
                let player = this.players[key];
                player.send({
                    type: "gameUpdate",
                    data: {
                        lastInputNumber: player.lastInputNumber,
                        gameData: this.game.toSerializedData(),
                        lobbyId: this.uuid,
                    }
                });
            }
        }
    }
}

module.exports = GameController;