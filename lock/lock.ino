#include <CurieBLE.h>
#include <EEPROM.h>
#include <Servo.h>
BLEPeripheral blePeripheral; //peripheral device

BLEService LockService("19b10000-e8f2-537e-4f6c-d104768a1214"); //Ble service UUID

BLEUnsignedCharCharacteristic LockCharacteristic("19b10001-e8f2-537e-4f6c-d104768a1214", BLERead | BLENotify | BLEWrite); //Lock state characteristic UUID 

BLEUnsignedCharCharacteristic CalibCharacteristic("19b10002-e8f2-537e-4f6c-d104768a1214", BLEWrite); //Lock Calibration

BLEUnsignedCharCharacteristic AutoUnlockCharacteristic("19b10003-e8f2-537e-4f6c-d104768a1214",BLERead | BLEWrite); //Auto unlock time

Servo myservo;  // create servo object to control a servo
const int ledpin=13;
unsigned char LockState=0;//lock variable
//unsigned int CalibState=0; //calib variable

unsigned int LockingValue=0, UnLockingValue=0;
unsigned int sensorValue=0, sensorLevel=0;
long previousMillis = 0;
long Unlocktime=655350;

void setup()
{
  Serial.begin(9600);
  pinMode(ledpin,OUTPUT);

  myservo.attach(9); //servo connected on pin 9

  LockingValue=EEPROM.read(0);
  UnLockingValue=EEPROM.read(2);
  //set advertised local name and service uuid
  blePeripheral.setLocalName("Gollem");
  blePeripheral.setAdvertisedServiceUuid(LockService.uuid());
  
  //add service and characteristics:
  blePeripheral.addAttribute(LockService);
  blePeripheral.addAttribute(LockCharacteristic);
  blePeripheral.addAttribute(CalibCharacteristic);
  blePeripheral.addAttribute(AutoUnlockCharacteristic);

   // assign event handlers for connected, disconnected to peripheral
  blePeripheral.setEventHandler(BLEConnected, blePeripheralConnectHandler);
  blePeripheral.setEventHandler(BLEDisconnected, blePeripheralDisconnectHandler);

 // assign event handlers for characteristic
  LockCharacteristic.setEventHandler(BLEWritten,LockCharacteristicWritten);
  CalibCharacteristic.setEventHandler(BLEWritten,CalibCharacteristicWritten);
  AutoUnlockCharacteristic.setEventHandler(BLEWritten,AutoUnlockCharacteristicWritten);
    
  //initial values
  LockCharacteristic.setValue(0);
  CalibCharacteristic.setValue(0);
  AutoUnlockCharacteristic.setValue(0);
  
  //begin advertising
  blePeripheral.begin();
  Serial.println("BLE LOCK Peripheral");  
 }
 void loop()
 {
    blePeripheral.poll(); 

    sensorValue = analogRead(A0);
    sensorLevel = map(sensorValue, 0, 1023, 0, 180); 

    long currentMillis = millis(); 
    if (LockState ==1 && currentMillis - previousMillis >=Unlocktime) { 
        Lockclose(); 
        LockCharacteristic.setValue(LockState+'0');
        Serial.println(LockState);
    }
   /* sensorLevel=updateLockStuatus();
    if(LockingValue>UnLockingValue){
      if((sensorLevel -((LockingValue + UnLockingValue)/2))>=0){
          LockState=0;
      }
      else{
          LockState=1;
      }
    }
    else if(LockingValue<UnLockingValue){
      if((sensorLevel -((LockingValue + UnLockingValue)/2))>=0){
          LockState=1;
      }
      else{
          LockState=0; 
      }
    }*/
 }

void blePeripheralConnectHandler(BLECentral& central) {
  // central connected event handler
  digitalWrite(ledpin,HIGH);
  Serial.print("Connected event, central: ");
  Serial.println(central.address());
}

void blePeripheralDisconnectHandler(BLECentral& central) {
  // central disconnected event handler
  digitalWrite(ledpin,LOW);
  Serial.print("Disconnected event, central: ");
  Serial.println(central.address());
}
void LockCharacteristicWritten(BLECentral& central, BLECharacteristic& characteristic){
   // central wrote new value to characteristic, update LOCK
   //0 is lock close and 1 is lock open
  Serial.print("Characteristic event, written: ");
  if(LockCharacteristic.value()=='1'){
    Lockopen();
  }
  else{
    Lockclose();
  }
}
void CalibCharacteristicWritten(BLECentral& central, BLECharacteristic& characteristic){
  // central wrote new value to characteristic, update calibration
  Serial.print("Characteristic event calibration, written: ");
  if(CalibCharacteristic.value()=='1'){
    Serial.println("Calibrated locklevel");
    updateLockLevel();//calibrate pot value for lock level   
  }
  else if(CalibCharacteristic.value()=='2'){
     Serial.println("Calibrated unlocklevel");
     updateUnlockLevel();//calibrate pot value for unlock level
  }
  else{
    Serial.println("Calibration Done");
  }
}

void AutoUnlockCharacteristicWritten(BLECentral& central, BLECharacteristic& characteristic){
  //central wrote new value to auto lock time, update it
      Unlocktime=AutoUnlockCharacteristic.value()*1000;
      Serial.println(Unlocktime);
}

void updateLockLevel(){
  sensorValue = analogRead(A0); 
  sensorLevel = map(sensorValue, 0, 1023, 0, 180);
  Serial.print("sensor value is ");
  Serial.println(sensorLevel);
  EEPROM.write(0, sensorLevel); 
  LockingValue=EEPROM.read(0);
  Serial.println(LockingValue);
 }
void updateUnlockLevel(){
  sensorValue = analogRead(A0); 
  sensorLevel = map(sensorValue, 0, 1023, 0, 180);
  Serial.print("sensor value is "); 
  Serial.println(sensorLevel);
  EEPROM.write(2, sensorLevel);
  UnLockingValue=EEPROM.read(2);
  Serial.println(UnLockingValue);
 }

unsigned int updateLockStuatus(){
  sensorValue = analogRead(A0); 
  sensorLevel = map(sensorValue, 0, 1023, 0, 180);
  return sensorLevel;
}

void Lockclose(){
  Serial.println("Lock closed");
  myservo.write(LockingValue); 
  LockState=0;
  delay(15);
}
void Lockopen(){
  Serial.println("Lock opened");
  previousMillis = millis();
  myservo.write(UnLockingValue);
  LockState=1; 
  delay(15);
}


