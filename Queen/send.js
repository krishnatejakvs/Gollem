var noble = require('noble'); 
// Search only for the Service UUID of the device (remove dashes) 
var serviceUuids = ['19b10000e8f2537e4f6cd104768a1214']; 
// Search only for the led charateristic 
var lockcharacteristicUuid = ['19b10001e8f2537e4f6cd104768a1214']; 
var calibcharacteristicUuid= ['19b10002e8f2537e4f6cd104768a1214'];
var autounlockcharacteristicUuid =['19b10003e8f2537e4f6cd104768a1214'];
//setInterval(function(){
// start scanning when bluetooth is powered on 
noble.on('stateChange', function(state) {
 if (state === 'poweredOn') { 
   noble.startScanning(serviceUuids); 
   console.log("scanning");
 }
 else{
   noble.stopScanning(); 
 }
}); 

var mainthingstate = {
     "state" : {
       "desired":{
           "position" : "Lcoked",
           "Hub"      : "On"
       },
       "reported" :{
            "position" : "Locked",
            "Hub"      : "On"
       }
   }
}

var LockCharacteristic= null;
var CalibCharacteristic= null;
var AutoUnlockCharacteristic= null;
var Lockperipheral=null;

// Search for BLE peripherals 
noble.on('discover', function(peripheral) {
 //console.log(peripheral); 
 noble.stopScanning(); 
 peripheral.connect(function(error) { 
   console.log('connected to peripheral: ' + peripheral.uuid); 
   Lockperipheral=peripheral;
   // Only discover the service we specified above 
   peripheral.discoverServices(serviceUuids, function(error, services) { 
     var service = services[0]; 
     console.log('discovered service'); 
     service.discoverCharacteristics([], function(error, characteristics) { 
       console.log('discovered characteristics'); 
       // Assign Characteristic 
       characteristics.forEach(function(characteristic){
       //loop through each characteristic and know abt their UUID's
         console.log('found characteristic:', characteristic.uuid);
         if(lockcharacteristicUuid==characteristic.uuid){
           LockCharacteristic=characteristic;
         }
         else if(calibcharacteristicUuid==characteristic.uuid){
           CalibCharacteristic=characteristic;
         }
         else if(autounlockcharacteristicUuid==characteristic.uuid){
           AutoUnlockCharacteristic=characteristic;
         }
       });
       //checl tp see if we found all characteristics
       if(LockCharacteristic && CalibCharacteristic && AutoUnlockCharacteristic){   
          console.log('found lock');
		  //update the lock status to aws when queen got connected to lock
          var Lock =module.exports.read;
          module.exports.autoupdateLock(Lock);
       }
       else{
           console.log('missing characteristics');
           peripheral.disconnect(function(error){
              console.log('peripheral Disconnected');
           });
       }
       LockCharacteristic.on('data',function(data,isNotification){
       console.log('Read the lock value');
       if(data.length===1){
          var result = data.readUInt8(0);
		  //when data notification is received, update the aws
          module.exports.autoupdateLock(result);
       }
       else{
          console.log('result length incorrect');
       }
       });
       LockCharacteristic.subscribe(function(error){     //subscribing enable the notification event
       });
       //module.exports.disconnect();
     });     
   });
  });        
});


module.exports ={

read : function(){
//select the action to do
 LockCharacteristic.read(function(error,data){
   // data is a buffer 
   console.log('sensor value is: ' + data.readUInt8(0)); 
   return data.readUInt8(0);
 });
},
write : function(operation,value){
    switch(operation){
        case(0):      
            var lockstate= new Buffer(1);
            lockstate.writeUInt8(value,0);
            LockCharacteristic.write(lockstate, false, function(error){
               if(error){
                console.log('error');
               }
               else {
                console.log('written succesful');
               }
            });
            break;
        case(1):
            var calib = new Buffer(1);
            calib.writeUInt8(value,0);
            CalibCharacteristic.write(calib, false, function(error){
               if(error){
                console.log('error');
               }       
               else {
                console.log('written succesful');
               }
            });
            break;
        case(2):
            var time = new Buffer(1);
            time.writeUInt8(value,0);
            AutoUnlockCharacteristic.write(time,false, function(error){
               if(error){
                console.log('error');
               }       
               else {
                console.log('written succesful');
               }
            });
            break;
         default:

    }
},
scan : function(){
   noble.startScanning(serviceUuids); 
   console.log('scan started');
},
disconnect : function(){
   if(Lockperipheral!= null){Lockperipheral.disconnect(function(error){
   if(error){console.log('error while disconnecing')};
   console.log('peripheral Disconnected');
   });
   noble.stopScanning();
}
},
autoupdateLock : function(Lockstate){
if(Lockstate===1)
{
     mainthingstate.state.reported.position='Unlocked';
     mainthingstate.state.desired.position='Unlocked';
     aws.update(mainthingstate);
     console.log('lock status is opened');
}
if(Lockstate===0)
{
     mainthingstate.state.reported.position='Locked';
     mainthingstate.state.desired.position='Locked';
     aws.update(mainthingstate);
     console.log('lock status is closed');
}
},
characteristic: LockCharacteristic
}

var aws = require('./controller.js');

