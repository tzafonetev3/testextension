
function timeStamp()
{
    return (new Date).toISOString().replace(/z|t/gi,' ').trim();
}

function console_log(str)
{
    console.log(timeStamp() + ": "  + str);
}

var cityid = "4929004";

var cityids =
{
    "Amesbury, MA" : "4929004",
    "New York, NY" : "5128581",
    "London, UK" : "2643743",
    "Paris, France" : "2988507",
    "Honolulu, Hawaii" : "5856195",
    "Antarctica" : "6255152",
    "Orlando, Florida" : "4167147",
    "Beijing, China" : "1816670",
    "Fiji" : "2198148",
    "Mount Everest" : "4517586"
};

var cities = [];
for(var k in cityids) cities.push(k);


new (function(ext) {
  // Cleanup function when the extension is unloaded

  ext._getStatus = function()
  {
    // xxx do a ping
     return { status:2, msg:'Ready' };
  };

  
  ext._shutdown = function()
  {

 
  };
     
     var cachedWeather = 0;
     var cacheInterval = 0;
     
     function kelvinToCelsius(value)
     {
        return value - 273.15;
     };

     
    function kelvinToFahrenheit(value)
     {
        return (kelvinToCelsius(value) * 1.8) + 32;
     }
     
     function tempF(data, callback)
     {
         var degreesF = kelvinToFahrenheit(data.main.temp);
         degreesF = Math.round(10*degreesF)/10;
         callback(degreesF);
     }
     
     function weatherF(data, callback)
     {
         callback(data.weather[0].main);
     }
     
     function sendRequest(command, filterF, callback)
     {
        if (cachedWeather)
        {
            filterF(cachedWeather, callback);
        }
        else
        {
     
            $.ajax({
                type: "GET",
                dataType: "jsonp",
                url: "http://api.openweathermap.org/" + "data/2.5/weather?id=" + cityid + "&APPID=bd9989ac922908fed9b1ec1521595d99",
                success: function(data) {
                   cachedWeather = data;
                   console_log("Got weather:"  + JSON.stringify(data));
                    if (data)
                    {
                        filterF(data, callback);
                    }
                    else
                    {
                        callback("");
                    }
                },
                error: function(jqxhr, textStatus, error) {
                   console_log("error: " + error + " " + textStatus);
                    callback("");
                }
                });
            cacheInterval = window.setTimeout(function() {
                                              cachedWeather = 0;
                                              console_log("clearing cache");
                                       }, (60000 * 5)); // 5 minutes
        }

     }
     
  ext.getTemp= function(callback)
 {
     sendRequest("", tempF,callback);
 };

     ext.getWeather= function(callback)
     { 
        sendRequest("", weatherF,callback);
     };

     ext.setLocation = function(location)
     {
        var loc = cityids[location];
        cityid = loc;
        cachedWeather = 0;  // clear cache
     }
  // Block and block menu descriptions
  var descriptor2 = {
  blocks: [
           ['R', 'current temperature',                    'getTemp' ],
           ['R', 'current weather',                    'getWeather' ],
           [' ' , 'set location to %m.locations', 'setLocation', "Amesbury"]
          ],
  menus: {
     "locations" : cities

    },
  };
  
  ScratchExtensions.register('Weather', descriptor2, ext);
  console.log('registered: ');
})({});

