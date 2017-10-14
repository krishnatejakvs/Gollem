var awsIot = require('aws-iot-device-sdk');
var myThingName = 'Lock';
var state='Locked';
var clientTokenUpdate;
var thingShadows = awsIot.thingShadow({
keyPath: '/home/pi/myiotproject/certs/20e54d208f-private.pem.key',
certPath: '/home/pi/myiotproject/certs/20e54d208f-certificate.pem.crt',
caPath: '/home/pi/myiotproject/certs/root-CA.crt',
clientId: myThingName,
region: 'us-west-2',
host: 'a2vmr6ojsgz7va.iot.us-west-2.amazonaws.com'
});
var currentTimeout = null;
var clientTokenUpdate;
var mythingstate = {
        "state": {
                "reported":{
                        "position" : 'Locked',//update your state here
                        "Hub"      : 'off'
                }}
  };

var stack = [];
module.exports ={
update : function (thingstate){
    mythingstate.version = undefined;
    clientTokenUpdate = thingShadows.update(myThingName, thingstate);
    if(clientTokenUpdate === null)
    {
            console.log('operation in progress, scheduling retry...');
            currentTimeout = setTimeout(function() {
                module.exports.update(thingstate);
            },20000);
    
    }else{
    // Save the client token so that we know when the operation completes
    stack.push(clientTokenUpdate);   
    }
}
}

function get(){
  clientTokenUpdate=thingShadows.get(myThingName);
  console.log("Update:" + clientTokenUpdate);
 if(clientTokenUpdate === null)
 {
    console.log("operation in progress");
 }else{
  stack.push(clientTokenUpdate);
 }
}

thingShadows.on('connect', function(){
                console.log("connected...");
                console.log("Registering..");
                thingShadows.register(myThingName);
                setTimeout(function() {
                      console.log("updating lock status from lock when connected immediately to aws..");
                      var lockstatus = ble.read();
                      ble.autoupdateLock(lockstatus);
                },2500);
                });
thingShadows.on('status', function(thingName,stat,clientToken,stateObject)  {
                var expectedClientToken = stack.pop();
                console.log('received status ' +stat+ ' on ' +thingName+':' +JSON.stringify(stateObject));

                });
thingShadows.on('update', function(thingName, stateObject){
                console.log('received update data '+' on '+thingName+':'+JSON.stringify(stateObject));  
                });
thingShadows.on('foreignStateChange',function(thingName,operation,stateObject){
                console.log('received foriegnStateChange' +operation+ 'on' +thingName+':' +JSON.stringify(stateObject));
                });
thingShadows.on('delta', function(thingName, stateObject){
                console.log('received delta data '+' on '+thingName+':'+JSON.stringify(stateObject));  
                if("position" in stateObject.state)
                {
				   //check for change in lockstate in delta and send update to lock
                    mythingstate.state.reported.position=stateObject.state.position;                
                    if(mythingstate.state.reported.position == 'Unlocked')
                    {
                       setTimeout(function(){ble.write(0,1);},500);
                    }
                    else{
                       setTimeout(function(){ble.write(0,0);},500);
                    }
                }
                    
                if("Hub" in stateObject.state) {
					//check for change in remote state(whether controlling over internet) or not and initiate a connection to lock.
                     mythingstate.state.reported.Hub=stateObject.state.Hub;
                    if(mythingstate.state.reported.Hub == 'off')
                    {
                       setTimeout(function(){ble.disconnect();},1000);
                    }
                    else{
                       ble.scan();
                    }
                }
                setTimeout(function() {
                      console.log("updating lock status..");
                      module.exports.update(mythingstate);
                },2500);
                });

thingShadows.on('timeout', function(thingName,clientToken){
                console.log('received timout for' +clientToken); 
                });
thingShadows.on('close',function(){
                console.log('close');
                thingShadows.unregister(thingName);
                });
thingShadows.on('reconnect', function(){
                console.log('reconnect');
                });
thingShadows.on('offline', function(){
                console.log('offline');
                while (stack.length) {
                         stack.pop();
                      }
                });
thingShadows.on('error', function(){
                console.log('error',error);
                });

var ble = require('./send.js');

