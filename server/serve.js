var server = require('ws').Server;
var ser = new server({port:5002});


var scores=[0,0,0,0,0,0,0,0,0,0];


ser.on('connection',function(ws){

    ws.on('message',function(message){
        let r = message+"";
        scores.push(parseInt(r,10));
        scores.sort((a, b) => b - a);
        scores.pop();
        ser.clients.forEach(function(client){
            client.send(scores.join(','));
        });
    });

    ws.on('close',function(){
        //console.log(`I lost a client`);
    });

});


console.log("game03 server is running up!");
//return;












