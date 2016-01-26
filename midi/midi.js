
function timeStamp()
{
    return (new Date).toISOString().replace(/z|t/gi,' ').trim();
}



(function(ext) {
  // Cleanup function when the extension is unloaded

  ext._getStatus = function()
  {
    // xxx do a ping
     return { status:2, msg:'Ready' };
  };

  
  ext._shutdown = function()
  {

 
  };
 
 function ab2str(buf)
 {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
 }
 
 function str2ab(str)
 {
     var buf = new ArrayBuffer(str.length); // 2 bytes for each char
     var bufView = new Uint8Array(buf);
     for (var i=0, strLen=str.length; i<strLen; i++)
     {
        bufView[i] = str.charCodeAt(i);
     }
     return buf;
 }
 
 
 
  function sendCommand(command)
  {
        $.ajax({
        type: "GET",
        dataType: "jsonp",
        url: "http://localhost:32222/" + command,
        success: function(data) {
        },
        error: function(jqxhr, textStatus, error) {
        }
        });
  }
 
 function midiFromFreq(freq)
 {
    return parseInt(Math.log(freq/440.0)/Math.log(2) * 12 + 70);
 }
 

  var frequencies = { "C4" : 262, "D4" : 294, "E4" : 330, "F4" : 349, "G4" : 392, "A4" : 440, "B4" : 494, "C5" : 523, "D5" : 587, "E5" : 659, "F5" : 698, "G5" : 784, "A5" : 880, "B5" : 988, "C6" : 1047, "D6" : 1175, "E6" : 1319, "F6" : 1397, "G6" : 1568, "A6" : 1760, "B6" : 1976, "C#4" : 277, "D#4" : 311, "F#4" : 370, "G#4" : 415, "A#4" : 466, "C#5" : 554, "D#5" : 622, "F#5" : 740, "G#5" : 831, "A#5" : 932, "C#6" : 1109, "D#6" : 1245, "F#6" : 1480, "G#6" : 1661, "A#6" : 1865 };

  ext.playTone = function(tone, duration, callback)
  {
      var freq = frequencies[tone];
     playF(freq, duration, callback);
 }
 
 
 ext.playFreq = function(freq, duration, callback)
 {
     console.log("playFreq duration: " + duration + " freq: " + freq);
    playF(freq, duration, callback);
 }
 
 function playF(freq, duration, callback)
 {
    var midinote = midiFromFreq(freq);
    sendCommand("note?"  + midinote);
 
 if (duration < 1)
    duration = 1;
 
    window.setTimeout(function() {
                       sendCommand("stop?"  + midinote);
                       callback();
                       }, duration);
 }
 

 
  // Block and block menu descriptions
  var descriptor = {
  blocks: [
           ['w', 'play note %m.note duration %n ms',                    'playTone',         'C5', 500],
           ['w', 'play frequency %n duration %n ms',                    'playFreq',         '262', 500],
           ],
  menus: {

  note:["C4","D4","E4","F4","G4","A4","B4","C5","D5","E5","F5","G5","A5","B5","C6","D6","E6","F6","G6","A6","B6","C#4","D#4","F#4","G#4","A#4","C#5","D#5","F#5","G#5","A#5","C#6","D#6","F#6","G#6","A#6"],
    },
  };

  var serial_info = {};
  ScratchExtensions.register('Garage Band Control', descriptor, ext, serial_info);
  console.log('registered: ');
})({});

