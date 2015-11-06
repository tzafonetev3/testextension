// Sparki ScratchX Plugin
// Copyright 2015 Ken Aspeslagh @massivevector
// Only tested on Mac.
// sudo ln -s tty.ArcBotics-DevB tty.serialSparki1
// Sparki must be programmed with SJ-BT Control sketch

var theDevice = theDevice || null;
var alreadyLoaded = alreadyLoaded || false;
var connected = connected || false;


(function(ext) {
  // Cleanup function when the extension is unloaded
 
  ext._getStatus = function()
  {
      if (!connected)
        return { status:1, msg:'Disconnected' };
      else
        return { status:2, msg:'Connected' };
  };
  
  ext._deviceRemoved = function(dev)
  {
    console.log('Device removed');
    // Not currently implemented with serial devices
  };

  var connecting = false;
  var notifyConnection = false;

  var warnedAboutBattery = false;
  var potentialDevices = [];
  var deviceTimeout = 0;
  ext._deviceConnected = function(dev) {
  
   console.log(timeStamp() + '_deviceConnected: ' + dev.id);

  // brick's serial port must be named like tty.serialBrick7-SerialPort
  // this is how 10.10 is naming it automatically, the brick name being serialBrick7
  // the Scratch plugin is only letting us know about serial ports with names that
  // "begin with tty.usbmodem, tty.serial, or tty.usbserial" - according to khanning
  
  if ((dev.id.indexOf('/dev/tty.serialSparki') === 0) || dev.id.indexOf('COM') === 0)
  {

    if (potentialDevices.filter(function(e) { return e.id == dev.id; }).length == 0) {
          potentialDevices.push(dev); }
      if (!deviceTimeout)
        deviceTimeout = setTimeout(tryNextDevice, 1000);
  }
  };
  
  var poller = null;
  var pingTimeout = null;
  var connectionTimeout = null;
  
  var waitingForPing = false;
  var waitingForInitialConnection = false;

  var DEBUG_NO_Sparki = false;
 
 function clearSensorStatuses()
 {
     var numSensorBlocks = 9;
     waitingQueries = [];
     for (x = 0; x < numSensorBlocks; x++)
     {
        waitingCallbacks[x] = [];
        global_sensor_result[x] = 0;
        global_sensor_queried[x] = 0;
     }
 }
 
var counter = 0;

function reconnect()
 {
    clearSensorStatuses();
    counter = 0; 
    
    theDevice.open({ stopBits: 0 });
    console.log(timeStamp() + ': Attempting connection with ' + theDevice.id);
    theDevice.set_receive_handler(receive_handler);
 
    connecting = true;
    connected = true;
 
 //   testTheConnection(startupBatteryCheckCallback);
 //   waitingForInitialConnection = true;
 //   connectionTimeout = setTimeout(connectionTimeOutCallback, 3000);
}

function startupBatteryCheckCallback(result)
{
   console.log(timeStamp() + ": got battery level at connect: " + result);
 
   waitingForInitialConnection = false;

   connected = true;
   connecting = false;
   
   playStartUpTones();
 
   // no watchdog right now.  reconnection is too flakey so there is no point
   //  setupWatchdog();
}

function setupWatchdog()
{
    if (poller)
        clearInterval(poller);

   poller = setInterval(pingBatteryWatchdog, 10000);
}
 
function timeStamp()
{
  return (new Date).toISOString().replace(/z|t/gi,' ').trim();
}

function pingBatteryWatchdog()
{
    console.log(timeStamp() + ": pingBatteryWatchdog");
    testTheConnection(pingBatteryCheckCallback);
    waitingForPing = true;
    pingTimeout = setTimeout(pingTimeOutCallback, 3000);
}

function pingTimeOutCallback()
{
   if (waitingForPing == true)
   {
     console.log(timeStamp() + ": Ping timed out");
      if (poller)
        clearInterval(poller);
      
      connected = false;
      
        alert("The connection to the brick was lost. Check your brick and refresh the page to reconnect. (Don't forget to save your project first!)");
      /* if (r == true) {
         reconnect();
        } else {
         // do nothing
        }
        */
   }
 }

function connectionTimeOutCallback()
{
   if (waitingForInitialConnection == true)
   {
     console.log(timeStamp() + ": Initial connection timed out");
     connecting = false;
 
     if (potentialDevices.length == 0)
     {
       alert("Failed to connect to a brick.\n\nMake sure your brick is:\n 1) powered on with Bluetooth On\n 2) named starting with serial (if on a Mac)\n 3) paired with this computer\n 4) the iPhone/iPad/iPod check box is NOT checked\n 5) Do not start a connection to or from the brick in any other way. Let the Scratch plug-in handle it!\n\nand then try reloading the webpage.");
       /*  if (r == true) {
         reconnect();
         } else {
         // do nothing
        }
        */
    }
    else
    {
        tryNextDevice();
    }
   }
 }

function pingBatteryCheckCallback(result)
{
   console.log(timeStamp() + ": pinged battery level: " + result);
   if (pingTimeout)
    clearTimeout(pingTimeout);
   waitingForPing = false;
 
   if (result < 11 && !warnedAboutBattery)
   {
     alert("Your battery is getting low.");
     warnedAboutBattery = true;
   }
}


function testTheConnection(theCallback)
{
   window.setTimeout(function() {
                          readThatBatteryLevel(theCallback);
                       }, 500);
 }

function playStartUpTones()
{
    var tonedelay = 1000;
    window.setTimeout(function() {
                          playFreqM2M(262, 100);
                       }, tonedelay);

     window.setTimeout(function() {
                          playFreqM2M(392, 100);
                       }, tonedelay+150);
     
     window.setTimeout(function() {
                          playFreqM2M(523, 100);
                       }, tonedelay+300);
 }
 
  function tryNextDevice()
  {
    potentialDevices.sort((function(a, b){return b.id.localeCompare(a.id)}));

    console.log("devices: " + potentialDevices);
    var device = potentialDevices.shift();
    if (!device)
        return;
 
   theDevice = device;
 
  if (!DEBUG_NO_Sparki)
  {
    reconnect();
  }
      /*
      watchdog = setTimeout(function() {
                            clearInterval(poller);
                            poller = null;
                            device.set_receive_handler(null);
                            device.close();
                            device = null;
                            tryNextDevice();
                            }, 5000);
       */
  }
  
 ext._shutdown = function()
 {
     console.log(timeStamp() +' SHUTDOWN: ' + theDevice.id);
     /*
     if (theDevice)
        theDevice.close();
     if (poller)
        clearInterval(poller);
     connected = false;
     theDevice = null;
      */
 };
 
  var waitingCallbacks = [[],[],[],[],[],[],[],[], []];
  var waitingQueries = [];
  var global_sensor_result =  [0, 0, 0, 0, 0, 0, 0, 0, 0];
  var global_sensor_queried = [0, 0, 0, 0, 0, 0, 0, 0, 0];

  function receive_handler(data)
  {
    var inputData = new Uint8Array(data);
    console.log("received: " + createHexString(inputData));

    return;
 
    if (!(connected || connecting))
      return;
  
    var query_info = waitingQueries.shift();
    var this_is_from_port = query_info[0];
    var mode = query_info[1];
    var modeType = query_info[2];
     
    var theResult = "";

    if (mode == TOUCH_SENSOR)
    {
        var result = inputData[5];
        theResult = (result == 100);
    }
    else if (mode == COLOR_SENSOR)
    {
        var num = Math.floor(getFloatResult(inputData));
        if (modeType == AMBIENT_INTENSITY || modeType == REFLECTED_INTENSITY)
        {
            theResult = num;
        }
        else if (modeType == COLOR_VALUE)
        {
            if (num >= 0 && num < 7)
                theResult = colors[num];
            else
                theResult = "none";
        }
 /*
        else if (modeType == COLOR_RAW_RGB)  // is color_raw encoded as a string, hex, or number?
        {
            theResult = num; //maybe? probably not, but here's hoping it's this simple.
        }
  */
    }
    
    else if (mode == IR_SENSOR)
    {
        if (modeType == IR_PROX)
            theResult = getFloatResult(inputData);
        else if (modeType == IR_REMOTE)
            theResult = getIRButtonNameForCode(getFloatResult(inputData));
    }
    else if (mode == GYRO_SENSOR)
    {
       theResult = getFloatResult(inputData);
    }
    else if (mode == READ_FROM_MOTOR)
    {
        theResult = getFloatResult(inputData);
    }
    else if (mode == UIREAD)
    {
        if (modeType == UIREAD_BATTERY)
        {
            theResult = inputData[5];
        }
     }
 
    global_sensor_result[this_is_from_port] = theResult;
    global_sensor_queried[this_is_from_port]--;
    while(callback = waitingCallbacks[this_is_from_port].shift())
    {
        console.log("result: " + theResult);
        callback(theResult);
    }
  }
 
 function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
 }
 
 function str2ab(str) {
     var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
     var bufView = new Uint16Array(buf);
     for (var i=0, strLen=str.length; i<strLen; i++) {
     bufView[i] = str.charCodeAt(i);
     }
     return buf;
 }
 
  function sendCommand(commandString)
  {
    if ((connected || connecting) && theDevice)
        device.send(str2ab(commandString + "\n"));
  }
 
  ext.allMotorsOn = function(which, power)
  {
    clearDriveTimer();

   console.log("motor " + which + " power: " + power);
  
    motor(which, power);
  }
  
  function motor(which, power)
  {
    var motorBitField = getMotorBitsHexString(which);

    var powerBits = getPackedOutputHexString(power, 1);

    var motorsOnCommand = createMessage(DIRECT_COMMAND_PREFIX + SET_MOTOR_SPEED + motorBitField + powerBits + SET_MOTOR_START + motorBitField);
  
    sendCommand(motorsOnCommand);
  }
 
 
  var frequencies = { "C4" : 262, "D4" : 294, "E4" : 330, "F4" : 349, "G4" : 392, "A4" : 440, "B4" : 494, "C5" : 523, "D5" : 587, "E5" : 659, "F5" : 698, "G5" : 784, "A5" : 880, "B5" : 988, "C6" : 1047, "D6" : 1175, "E6" : 1319, "F6" : 1397, "G6" : 1568, "A6" : 1760, "B6" : 1976, "C#4" : 277, "D#4" : 311, "F#4" : 370, "G#4" : 415, "A#4" : 466, "C#5" : 554, "D#5" : 622, "F#5" : 740, "G#5" : 831, "A#5" : 932, "C#6" : 1109, "D#6" : 1245, "F#6" : 1480, "G#6" : 1661, "A#6" : 1865 };
  
 
 // /------^-----\
 // |            |
 // | 69  70  71 |
 // | 68  64  67 |
 // |  7  21   9 |
 // | 22  25  13 |
 // | 12  24  94 |
 // |  8  28  90 |
 // | 66  82  74 |
 // \____________/

 var IRbuttonNames = ['Top Left', 'Bottom Left', 'Top Right', 'Bottom Right', 'Top Bar'];
 var IRbuttonCodes = [1,            2,              3,          4,              9];
 
  ext.playTone = function(tone, duration, callback)
  {
      var freq = frequencies[tone];
      console.log("playTone " + tone + " duration: " + duration + " freq: " + freq);
      var volume = 100;
      var volString = getPackedOutputHexString(volume, 1);
      var freqString = getPackedOutputHexString(freq, 2);
      var durString = getPackedOutputHexString(duration, 2);
      
      var toneCommand = createMessage(DIRECT_COMMAND_PREFIX + PLAYTONE + volString + freqString + durString);

      sendCommand(toneCommand);
  
       window.setTimeout(function() {
                    driveTimer = 0;
                    callback();
                    }, duration);
  }
 
 
 ext.playFreq = function(freq, duration, callback)
 {
     console.log("playFreq duration: " + duration + " freq: " + freq);
     var volume = 100;
     var volString = getPackedOutputHexString(volume, 1);
     var freqString = getPackedOutputHexString(freq, 2);
     var durString = getPackedOutputHexString(duration, 2);
     
     var toneCommand = createMessage(DIRECT_COMMAND_PREFIX + PLAYTONE + volString + freqString + durString);
     
     sendCommand(toneCommand);
     
     window.setTimeout(function() {
                       driveTimer = 0;
                       callback();
                       }, duration);
 }
 
function playFreqM2M(freq, duration)
 {
     console.log("playFreqM2M duration: " + duration + " freq: " + freq);
     var volume = 100;
     var volString = getPackedOutputHexString(volume, 1);
     var freqString = getPackedOutputHexString(freq, 2);
     var durString = getPackedOutputHexString(duration, 2);
     
     var toneCommand = createMessage(DIRECT_COMMAND_PREFIX + PLAYTONE + volString + freqString + durString);
     
     sendCommand(toneCommand);
  
 }
 
 function clearDriveTimer()
 {
    if (driveTimer)
        clearInterval(driveTimer);
    driveTimer = 0;
    if (driveCallback)
        driveCallback();
    driveCallback = 0;
}
 
  ext.allMotorsOff = function(how)
  {
      clearDriveTimer();
      motorsStop(how);
  }
 
 var driveTimer = 0;
 driveCallback = 0;
 
  function motorsStop(how)
  {
      console.log("motorsStop");

      var motorBitField = getMotorBitsHexString("all");

      var howHex = '00';
      if (how == 'break')
         howHex = '01';
      
      var motorsOffCommand = createMessage(DIRECT_COMMAND_PREFIX + SET_MOTOR_STOP + motorBitField + howHex);
      
      sendCommand(motorsOffCommand);
  }
  
  function sendNOP()
  {
     var nopCommand = createMessage(DIRECT_COMMAND_PREFIX + NOOP);
  }

  ext.steeringControl = function(ports, what, duration, callback)
  {
    clearDriveTimer();
    var defaultPower = 50;
    if (what == 'forward')
    {
        motor(ports, defaultPower);
    }
    else if (what == 'reverse')
    {
        motor(ports, -1 * defaultPower);
    }
    else
    {
        var p =  ports.split("+");
        if (what == 'left')
        {
            motor(p[0], -1 * defaultPower);
            motor(p[1],  defaultPower);
        }
        else if (what == 'right')
         {
         motor(p[1], -1 * defaultPower);
         motor(p[0],  defaultPower);
         }
    }
    driveCallback = callback;
    driveTimer = window.setTimeout(function()
    {
        if (duration > 0) // allow zero duration to run motors asynchronously
        {
          motorsStop('coast');
        }
        callback();
    } , duration*1000);
  }
 
  function readTouchSensor(portInt)
  {
     if (global_sensor_queried[portInt] == 0)
     {
       global_sensor_queried[portInt]++;
       readFromSensor(portInt, TOUCH_SENSOR, mode0);
     }
  }
 
 function readIRRemoteSensor(portInt)
 {
    if (global_sensor_queried[portInt] == 0)
    {
        global_sensor_queried[portInt]++;
        readFromSensor2(portInt, IR_SENSOR, IR_REMOTE);
    }
 }
 
  ext.whenButtonPressed = function(port)
  {
    if (!device || !connected)
        return false;
    var portInt = parseInt(port) - 1;
    readTouchSensor(portInt);
    return global_sensor_result[portInt];
  }

 ext.whenRemoteButtonPressed = function(IRbutton, port)
 {
     if (!device || !connected)
        return false;
 
     var portInt = parseInt(port) - 1;
     readIRRemoteSensor(portInt);
 
     return (global_sensor_result[portInt] == IRbutton);
 }
 
  ext.readTouchSensorPort = function(port, callback)
  {
    var portInt = parseInt(port) - 1;

    waitingCallbacks[portInt].push(callback);
    readTouchSensor(portInt);
  }
 
  ext.readColorSensorPort = function(port, mode, callback)
  {
    var modeCode = AMBIENT_INTENSITY;
    if (mode == 'reflected') { modeCode = REFLECTED_INTENSITY; }
    if (mode == 'color') { modeCode = COLOR_VALUE; }
    if (mode == 'RGBcolor') { modeCode = COLOR_RAW_RGB; }
 
    var portInt = parseInt(port) - 1;
    waitingCallbacks[portInt].push(callback);

    readFromColorSensor(portInt, modeCode);
  }
 
 function readFromColorSensor(portInt, modeCode)
 {
     if (global_sensor_queried[portInt] == 0)
     {
        global_sensor_queried[portInt]++;
        readFromSensor2(portInt, COLOR_SENSOR, modeCode);
     }
 }
 
 var lineCheckingInterval = 0;

 ext.waitUntilDarkLinePort = function(port, callback)
 {
    if (lineCheckingInterval)
        clearInterval(lineCheckingInterval);
    lineCheckingInterval = 0;
    var modeCode = REFLECTED_INTENSITY;
    var portInt = parseInt(port) - 1;
    global_sensor_result[portInt] = -1;
 
    lineCheckingInterval = window.setInterval(function()
    {
        readFromColorSensor(portInt, modeCode);
         if (global_sensor_result[portInt] < 25 && global_sensor_result[portInt] >= 0)    // darkness or just not reflection (air)
         {
                clearInterval(lineCheckingInterval);
                lineCheckingInterval = 0;
                callback();
         }
    }, 5);
 }
 
  ext.readGyroPort = function(mode, port, callback)
  {
    var modeCode = GYRO_ANGLE;
    if (mode == 'rate') { modeCode = GYRO_RATE; }
 
    var portInt = parseInt(port) - 1;
 
    waitingCallbacks[portInt].push(callback);
    if (global_sensor_queried[portInt] == 0)
    {
      global_sensor_queried[portInt]++;
      readFromSensor2(portInt, GYRO_SENSOR, modeCode);
    }
  }
 
  ext.readDistanceSensorPort = function(port, callback)
  {
    var portInt = parseInt(port) - 1;

    waitingCallbacks[portInt].push(callback);
    if (global_sensor_queried[portInt] == 0)
    {
      global_sensor_queried[portInt]++;
      readFromSensor2(portInt, IR_SENSOR, IR_PROX);
    }
  }
  
  ext.readRemoteButtonPort = function(port, callback)
  {
    var portInt = parseInt(port) - 1;

    waitingCallbacks[portInt].push(callback);
 
    readIRRemoteSensor(portInt);
  }
 
  function readFromSensor(port, type, mode)
  {

      waitingQueries.push([port, type, mode]);

      var readCommand = createMessage(DIRECT_COMMAND_REPLY_PREFIX +
                                           READ_SENSOR +
                                           hexcouplet(port) +
                                           type +
                                            mode + "60");

      sendCommand(readCommand);
  }

 function readFromSensor2(port, type, mode)
 {
    waitingQueries.push([port, type, mode]);
 
    var readCommand = createMessage(DIRECT_COMMAND_REPLY_SENSOR_PREFIX +
                                 INPUT_DEVICE_READY_SI + "00" + // layer
                                 hexcouplet(port) + "00" + // type
                                 mode +
                                 "0160"); // result stuff
 
    sendCommand(readCommand);
 }
 
 ext.readFromMotor = function(mmode, which, callback)
 {
    var portInt = getMotorIndex(which);
    var mode = "01"; // position
    if (mmode == 'speed')
        mode = "02";
     waitingCallbacks[portInt].push(callback);
     if (global_sensor_queried[portInt] == 0)
     {
        global_sensor_queried[portInt]++;
        readFromAMotor(portInt, READ_FROM_MOTOR, mode);
     }
 }
 
 // this routine is awful similar to readFromSensor2...
 function readFromAMotor(port, type, mode)
 {
 
    waitingQueries.push([port, type, mode]);
 
    var readCommand = createMessage(DIRECT_COMMAND_REPLY_SENSOR_PREFIX +
                                 INPUT_DEVICE_READY_SI + "00" + // layer
                                 hexcouplet(port+12) + "00" + // type
                                 mode +
                                 "0160"); // result stuff
    sendCommand(readCommand);
 }

 ext.readBatteryLevel = function(callback)
 {
   readThatBatteryLevel(callback);
 }
 
 function readThatBatteryLevel(callback)
 {
    var portInt = 8; // bogus port number
     waitingCallbacks[portInt].push(callback);
     if (global_sensor_queried[portInt] == 0)
     {
        global_sensor_queried[portInt]++;
        UIRead(portInt, UIREAD_BATTERY);
     }
 }
 
 ext.reconnectToDevice = function()
 {
    reconnect();
 }
 
 function UIRead(port, subtype)
 {
    waitingQueries.push([port, UIREAD, subtype]);
 
    var readCommand = createMessage(DIRECT_COMMAND_REPLY_PREFIX +
                                 UIREAD + subtype +
                                 "60"); // result stuff
    sendCommand(readCommand);
 }
 
  // Block and block menu descriptions
  var descriptor = {
  blocks: [
           ['w', 'drive %m.turnStyle %n seconds',         'steeringControl', 'forward', 3],
           [' ', 'start driving %m.turnStyle',              'allMotorsOn',      'forward'],
           [' ', 'turn %m.turnDirection %n degrees',              'turn', 'right',     90],
           [' ', 'stop driving',                       'allMotorsOff',     'break'],
           ['h', 'when IR remote %m.buttons pressed port', 'whenRemoteButtonPressed','Top Left'],
           ['w', 'play note %m.note duration %n ms',                    'playTone',         'C5', 500],
           ['w', 'play frequency %n duration %n ms',                    'playFreq',         '262', 500],
           ['R', 'light sensor',   'readColorSensorPort'],
           ['w', 'wait until light sensor %m.whichInputPort detects black line',   'waitUntilDarkLinePort',   '1'],
           ['R', 'measure distance',                  'readDistanceSensorPort'],
           ['R', 'remote button',                     'readRemoteButtonPort'],
          // ['R', 'gyro  %m.gyroMode %m.whichInputPort',                 'readGyroPort',  'angle', '1'],

       //    ['R', 'battery level',   'readBatteryLevel'],
       //  [' ', 'reconnect', 'reconnectToDevice'],
           ],
  menus: {
  turnStyle:        ['forward', 'reverse', 'right', 'left'],
 turnDirection:        ['right', 'left'],
  gyroMode: ['angle', 'rate'],
  note:["C4","D4","E4","F4","G4","A4","B4","C5","D5","E5","F5","G5","A5","B5","C6","D6","E6","F6","G6","A6","B6","C#4","D#4","F#4","G#4","A#4","C#5","D#5","F#5","G#5","A#5","C#6","D#6","F#6","G#6","A#6"],
  buttons: IRbuttonNames,
    },
  };

  var serial_info = {type: 'serial'};
  ScratchExtensions.register('Sparki Control', descriptor, ext, serial_info);
  console.log('registered: ');
})({});

