var noble = require('noble'); 
// Search only for the Service UUID of the device (remove dashes) 
var serviceUuids = ['19b10000e8f2537e4f6cd104768a1214']; 
// Search only for the led charateristic 
var lockcharacteristicUuid = ['19b10001e8f2537e4f6cd104768a1214']; 
var calibcharacteristicUuid= ['19b10002e8f2537e4f6cd104768a1214'];
var autounlockcharacteristicUuid =['19b10003e8f2537e4f6cd104768a1214'];

var x,y,z=0;
//setInterval(function(){
// start scanning when bluetooth is powered on 
noble.on('stateChange', function(state) { 
 if (state === 'poweredOn') { 
   noble.startScanning(serviceUuids); 
 }
 else{
   noble.stopScanning(); 
 }
}); 


var LockCharacteristic= null;
var CalibCharacteristic= null;
var AutoUnlockCharacteristic= null;


// Search for BLE peripherals 
noble.on('discover', function(peripheral) {
 //console.log(peripheral); 
 noble.stopScanning(); 
 peripheral.connect(function(error) { 
   console.log('connected to peripheral: ' + peripheral.uuid); 
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
          ActionOnLock(peripheral);
       }
       else{
           console.log('missing characteristics');
       }      
     });     
   });
  });        
});
   
function ActionOnLock(peripheral){
//select the action to do
 LockCharacteristic.on('data',function(data,isNotification){
    console.log('Read the lock value');
    if(data.length===1){
        var result = data.readUInt8(0);
        if(result){
            console.log('lock status is opened');
        }
        else{
            console.log('lock status is closed');
        }
     }
     else{
        console.log('result length incorrect');
     }
 });
 LockCharacteristic.subscribe(function(error){
    var lockstate= new Buffer(1);
    lockstate.writeUInt8(x,0);
    LockCharacteristic.write(lockstate, false, function(error){
    if(error){
        console.log('error');
    }
    });
 });
 LockCharacteristic.read(function(error,data){
   // data is a buffer 
   console.log('sensor value is: ' + data.readUInt8(0)); 
 });
 var calibstate= new Buffer(1);
 calibstate.writeUInt8(y,0);
 CalibCharacteristic.write(calibstate, false, function(error){
 if(error){
    console.log('error');
 }
 });
/* var autounlock= new Buffer(2);
 autounlock.writeUInt16BE(z,0);
 AutoUnlockCharacteristic.write(autounlock, false, function(error){
 if(error){
    console.log('error');
 }
 });
 */
 setTimeout(function() {
    peripheral.disconnect(function(error){
    console.log('peripheral Disconnected');
    });
 },1000);
 setTimeout(function() {
   noble.startScanning(serviceUuids); 
 },10000);
}
/*   
   
   
   var lockCharacteristic = characteristics[0]; 
       setTimeout(function() {
           if(x==0){
	   	      dataWrite.writeUInt8(0,0);
		      x=1;
	       }
	       else{
		      dataWrite.writeUInt8(1,0);
		      x=0;
	       }
	       lockCharacteristic.write(dataWrite,true,function(error){
		   });	 
           lockCharacteristic.read(function(error, data) { 
          // data is a buffer 
           console.log('sensor value is: ' + data.readUInt8(0)); 
               });
           peripheral.disconnect(function(error){
           console.log("peripheral Disconnected");
       });
       }, 100);
     }); 
   }); 
 }); 
});*/
//l/}),100;%/
