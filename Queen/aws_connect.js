var awsIot = require('aws-iot-device-sdk');
var myThingName = 'Lock';
var state='Locked';
var thingShadows = awsIot.thingShadow({
keyPath: '/home/pi/myiotproject/certs/0234aea3c3-private.pem.key',
certPath: '/home/pi/myiotproject/certs/0234aea3c3-certificate.pem.crt',
caPath: '/home/pi/myiotproject/certs/root-CA.crt',
clientId: myThingName,
region: 'us-west-2',
host: 'a2vmr6ojsgz7va.iot.us-west-2.amazonaws.com'
});

mythingstate = {
"state": {
"reported":{
   "position" : 'Locked'//update your state here
}}};

thingShadows.on('connect', function(){
console.log("connected...");
console.log("Registering..");
thingShadows.register(myThingName);
  setTimeout(function(){
  console.log("updating lock status..");
  clientTokenUpdate = thingShadows.update(myThingName, mythingstate);
  console.log("Update:" + clientTokenUpdate);
  },2500);

  thingShadows.on('status', function(thingName,stat,clientToken,stateObject)  {
     console.log('received status' +stat+ 'on' +thingName+':' +JSON.stringify(stateObject));
   });
  thingShadows.on('update', function(thingName, stateObject){
     console.log('received update data '+' on '+thingName+':'+JSON.stringify(stateObject));  
  });
  thingShadows.on('foreignStateChange',function(thingName,operation,stateObject){
     console.log('received foriegnStateChange' +operation+ 'on' +thingName+':' +JSON.stringify(stateObject));
  });
  thingShadows.on('delta', function(thingName, stateObject){
     console.log('received delta data '+' on '+thingName+':'+JSON.stringify(stateObject));  
     var str=(stateObject.state.position);
     console.log(str);
     mythingstate.state.reported.position=str;
     setTimeout(function(){
        clientTokenUpdate = thingShadows.update(myThingName, mythingstate);
        console.log("Update:" + clientTokenUpdate);    
     },2500);
  });
  thingShadows.on('timeout', function(thingName,clientToken){
     console.log('received timout for' +clientToken); 
  });
  thingShadows.on('close',function(){
     console.log('close');
  });
  thingShadows.on('reconnect', function(){
     console.log('reconnect');
  });
  thingShadows.on('offline', function(){
     console.log('offline');
  });
  thingShadows.on('error', function(){
     console.log('error',error);
  });


});
