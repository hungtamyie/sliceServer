class Utility {
    constructor(){}
    
    uuidGen(n){
        return "u" + [...Array(n)].map(i=>(~~(Math.random()*36)).toString(36)).join('');
    }
    
    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

if(typeof module != "undefined"){
    module.exports = Utility;
}