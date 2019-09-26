class PlayerController{
    constructor(data){
        this.ws = data.ws;
        this.uuid = data.uuid;
        this.lastInputNumber = 0;
        this.location = "lobby";
        this.name = "Anonymous";
    }
    
    initialize(){
        
    }
    
    send(m){
        this.ws.send(JSON.stringify(m));
    }
}


module.exports = PlayerController;