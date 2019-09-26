class Game {
    constructor(data){
        this.circles = [];
        this.inputs = [];
        this.lines = [];
        this.teamA = {hp: 80, mana: 0};
        this.teamB = {hp: 80, mana: 0};
        this.stage = 0;
        this.lookup = [
            {manaRegen: 0.0003, maxMana: 1},
            {manaRegen: 0.0007, maxMana: 3},
            {manaRegen: 0.0008, maxMana: 4},
            {manaRegen: 0.0008, maxMana: 5},
            {manaRegen: 0.001, maxMana: 7},
            {manaRegen: 0.001, maxMana: 9},
            {manaRegen: 0.0011, maxMana: 10},
            {manaRegen: 0.0011, maxMana: 11},
            {manaRegen: 0.0013, maxMana: 12},
            {manaRegen: 0.0013, maxMana: 13},
            {manaRegen: 0.0014, maxMana: 14},
            {manaRegen: 0.0014, maxMana: 15},
            {manaRegen: 0.0014, maxMana: 16},
            {manaRegen: 0.0015, maxMana: 17},
            {manaRegen: 0.0016, maxMana: 18},
            {manaRegen: 0.0017, maxMana: 19},
            {manaRegen: 0.0019, maxMana: 20},
        ]
        this.outputEffects = [];
        this.winner = "none";
        if(data){
            this.fromSerializedData(data);
        }
    }
    
    addInput(input){
        this.inputs.push(input);
    }
    
    tick(delta){
        this.outputEffects = [];
        this.applyInputs();
        this.updateCircles(delta);
        this.updateLines(delta);
        this.updateMana(delta);
    }
    
    applyInputs(){
        for(let i = 0; i < this.inputs.length; i++){
            let input = this.inputs[i];
            let inputTeamData = this.teamA;
            if(input.team == "B"){
                inputTeamData = this.teamB;
            }
            
            if(input.type == "createCircle" && inputTeamData.mana >= 1){
                inputTeamData.mana -= 1;
                let circleRadius = 42;
                if(input.pos[0] > 800 - circleRadius){
                    input.pos[0] = 800 - circleRadius;
                }
                if(input.pos[0] < 0 + circleRadius){
                    input.pos[0] = 0 + circleRadius;
                }
                
                if(input.pos[1] > 885 - circleRadius){
                    input.pos[1] = 885 - circleRadius;
                }
                if(input.pos[1] < 0 + circleRadius){
                    input.pos[1] = 0 + circleRadius;
                }
                
                this.circles.push({x: input.pos[0], y: input.pos[1], lifetime: 200, team: input.team});

                inputTeamData.hp += 2;
                 if(inputTeamData.hp > 100){
                     inputTeamData.hp = 100;
                 }
                 

            }
            if(input.type == "createLine"){
                this.lines.push({x1: input.pos1[0], y1: input.pos1[1], x2: input.pos2[0], y2: input.pos2[1], lifetime: 50, team: input.team});
            }
        }
        this.inputs = [];
    }
    
    updateCircles(delta){
        for(let i = 0; i < this.circles.length; i++){
            let circle = this.circles[i];
            if(circle.lifetime > 0){
                circle.lifetime -= 0.1 * delta;
                if(circle.lifetime <= 0){
                    if(circle.team == "A"){
                        this.outputEffects.push({type: "explosion", x: circle.x, y: circle.y, team: "B"});
                        this.teamB.hp -= 15;
                        if(this.teamB.hp < 0){
                            this.teamB.hp = 0;
                            this.winner = "A";
                        }
                    }
                    else {
                        this.outputEffects.push({type: "explosion", x: circle.x, y: circle.y, team: "A"});
                        this.teamA.hp -= 15;
                        if(this.teamA.hp < 0){
                            this.teamA.hp = 0;
                            this.winner = "B";
                        }
                    }
                    
                    this.circles.splice(i, 1);
                    i -= 1;
                }
            }
        }
        
        if(this.stage > this.lookup.length-2){
            console.log("attempted kill")
            this.winner = "B";
        }
    }
    
    updateLines(delta){
        for(let i = 0; i < this.lines.length; i++){
            let line = this.lines[i];
            if(line.lifetime > 0){
                
                if(line.lifetime == 50){
                    let lineStart = {x: line.x1, y: line.y1};
                    let lineEnd = {x: line.x2, y: line.y2};
                    
                    
                    let circleCenter = undefined;
                    for(let x = 0; x < this.circles.length; x++){
                        let circle = this.circles[x];
                        circleCenter = {x: circle.x, y: circle.y};
                        
                        if(doesLineInterceptCircle(lineStart, lineEnd, circleCenter, 35) && circle.team != line.team){
                            this.outputEffects.push({type:"kill", x: circle.x, y:circle.y, team: circle.team});
                            this.circles.splice(x, 1);
                            x -= 1;
                        }
                        
                    }
                    
                    
                    
                }
                
                line.lifetime -= 0.1 * delta;
                if(line.lifetime <= 0){
                    this.lines.splice(i, 1);
                    i -= 1;
                }
            }
        }
        
          // A,B end points of line segment
    // C center of circle
    // radius of circle
        function doesLineInterceptCircle(A, B, C, radius) {
            var dist;
            const v1x = B.x - A.x;
            const v1y = B.y - A.y;
            const v2x = C.x - A.x;
            const v2y = C.y - A.y;
            // get the unit distance along the line of the closest point to
            // circle center
            const u = (v2x * v1x + v2y * v1y) / (v1y * v1y + v1x * v1x);
            
            
            // if the point is on the line segment get the distance squared
            // from that point to the circle center
            if(u >= 0 && u <= 1){
                dist  = Math.pow(A.x + v1x * u - C.x, 2) + Math.pow(A.y + v1y * u - C.y, 2);
            } else {
                // if closest point not on the line segment
                // use the unit distance to determine which end is closest
                // and get dist square to circle
                dist = u < 0 ?
                      Math.pow(A.x - C.x, 2) + Math.pow(A.y - C.y, 2):
                      Math.pow(B.x - C.x,2) + Math.pow(B.y - C.y,2);
            }
            return dist < radius * radius;
         }
    }
    
    updateMana(delta){
        let regen = this.lookup[this.stage].manaRegen;
        let max = this.lookup[this.stage].maxMana;
        this.teamA.mana += regen * delta;
        this.teamB.mana += regen * delta;
        if(this.teamA.mana > max){
            this.teamA.mana = max;
        }
        if(this.teamB.mana > max){
            this.teamB.mana = max;
        }
    }
    
    fromSerializedData(data){
        this.circles = data.circles;
        this.teamA = data.teamA;
        this.teamB = data.teamB;
        this.lines = data.lines;
        this.outputEffects = data.outputEffects;
        this.stage = data.stage;
    }
    
    toSerializedData(){
        return {
            circles: this.circles,
            teamA: this.teamA,
            teamB: this.teamB,
            lines: this.lines,
            outputEffects: this.outputEffects,
            stage: this.stage,
        };
    }
    
}

if(typeof module != "undefined"){
    module.exports = Game;
}