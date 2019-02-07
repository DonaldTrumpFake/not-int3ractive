
$("#uploadTrigger").click(function(){
$("#file-input").click();
});

// this sets a base, must be outside all functions if we want to add to it at random point
var mymap = L.map('mapid').setView([0, 0], 15);
var velocity_coord  = 0
var heartrate_coord = 0
var elevation_coord = 0

///read file
function readSingleFile(e) {
var file = e.target.files[0];
//calls the xml parser with the xml filepath
loadXMLDoc(this)
  if (!file) {
    return;
  }

  var reader = new FileReader();
  reader.onload = function(e) {
    var contents = e.target.result;
	//displays the current map location
	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
	maxZoom: 18,
	attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
		'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
		'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
	id: 'mapbox.streets'
	}).addTo(mymap);
	//adds track to map
	new L.GPX(contents, {async: true}).on('loaded', function(e) {
	mymap.fitBounds(e.target.getBounds());
	}).addTo(mymap);
	
  };
  reader.readAsText(file);
}

document.getElementById('file-input')
  .addEventListener('change', readSingleFile, false);

//load xml function
function loadXMLDoc(xml) {
	  var xmlhttp = new XMLHttpRequest();
	  xmlhttp.onreadystatechange = function() {
	    if (this.readyState == 4 && this.status == 200) {
	      //pass the file to the parser
	      myFunction(this);
	    }
	  };
	  xmlhttp.open("GET", xml.value.split('\\')[2], true);
	  xmlhttp.send();
	}
	//parser
	function myFunction(xml) {
	  //set max cadence to 0 to compare with later
	  var max_cad = 0;

	  xmlDoc = xml.responseXML;
	   if(xmlDoc==null){
		dontshowDiv();
		return;
		}
	   showDiv();
	  //getElementsByTagName("trk") returns pretty singular values of these analyticss (I think?.. 
	  //will probably remove this whole section later BUT using trk is how to get the name, text, time and type
	  //so its necessary if we want those
	  parent = xmlDoc.getElementsByTagName("trk");

	  for (i = 0; i< parent.length; i++)
	  {
		//this essentially says, go to the first time you see trk, then go to its first child which is name
		//[3] does type even though its 1 below name, it seems to jump 2 at a time.
		//[5] represents trkpt so [1] represents the contents and [3] represents time
	  	var name = parent[i].childNodes[1].textContent;
	  	var type = parent[i].childNodes[3].textContent;
	  	var date = parent[i].childNodes[5].childNodes[1].childNodes[3].textContent;
		date = date.split('T');
		date = date[0];

		}
	  document.getElementById("name").innerHTML =  "Name : " + name + " |   Type : " +type +" |   Date :" +date;
	  document.getElementById("name_only").innerHTML = name;

	//using trkpt allows for easier looping
	var child = xmlDoc.getElementsByTagName("trkpt");
	
	//set for later use
	var max_velocity = 0
	var max_heartrate = 0
	var max_elevation = 0
	var total_distance = 0
	var d_list = ""
	var m_or_km = "m"
	var total_elevation = 0
	var previous_elevation = 0
	var total_heartrate = 0
	previous_elevation = parseFloat(child[0].childNodes[1].textContent);

	var hr_list = []
	var elev_list = []
	var vel_list = []
	//select the attributes from the first trkpt (lat & lon)
	//only used the first trkpt because this will represent the starting position of the route
	var lats = xmlDoc.getElementsByTagName("trkpt")[0].attributes;
	if(lats==null){
		alert("missing lattitude");
		return;
	}
	//select only latitude
	var lastlat = lats.getNamedItem("lat").nodeValue + "<br>";
	//convert to float for numeracy stuff later
	lastlat = parseFloat(lastlat);
		
	// same as above except for longitude
	var lons = xmlDoc.getElementsByTagName("trkpt")[0].attributes;
	var lastlon = lons.getNamedItem("lon").nodeValue + "<br>";
	lastlon = parseFloat(lastlon);

	//place a marker at the first point (one reason why we made a start position earlier)
	L.marker([lastlat, lastlon]).addTo(mymap);

	//prep variables for time gap calculation
	var last_time = [00,00,0.00]
	var time_gap_list = "";
	var total_time_gap = 0

	//so get the time from the FIRST trkpt, then remove everything before T, then remove Z, then remove decimal
	//then remove the : to create list which we can index
	var last_time = child[0].childNodes[3].textContent;
	last_time = last_time.split('T');
	last_time = last_time[1].split('Z');
	last_time = last_time[0].split('.');
	last_time = last_time[0].split(':');
	
	var elevation_list = [];
	//convert time to seconds so that we can find the difference between the first time and the second
	last_time = (((last_time[0])*3600)+((last_time[1])*60)+((last_time[2]*1)));


	for (i = 0; i< child.length; i++)
	{
		//same as before except in a loop so returns every lat and lon
		var lats = xmlDoc.getElementsByTagName("trkpt")[i].attributes;
		var currentlat = lats.getNamedItem("lat").nodeValue;
		currentlat = parseFloat(currentlat);
		
		var lons = xmlDoc.getElementsByTagName("trkpt")[i].attributes;
		var currentlon = lons.getNamedItem("lon").nodeValue;
		currentlon= parseFloat(currentlon);

		//calculate distance between last point and current point
		var distance = getDistanceFromLatLonInKm(lastlat,lastlon,currentlat,currentlon);
		//a list incase someone wants to see it...
		d_list += distance + "m" + "<br>"
		total_distance += distance

		//set previous to current so loop works
		lastlat = currentlat	
		lastlon = currentlon

		//calculate the max cadence
		var cad2 = child[i].childNodes[5].childNodes[1].childNodes[3].textContent;
		if (cad2 > max_cad){
			max_cad = cad2;
		}
		
		//calculate current time same as first time
		var current_time = child[i].childNodes[3].textContent;
		current_time = current_time.split('T');
		current_time = current_time[1].split('Z');
		current_time = current_time[0].split('.');
		current_time = current_time[0].split(':');

		current_time = (((current_time[0])*3600)+((current_time[1])*60)+((current_time[2]*1)));

		//time gap = current - previous time in seconds
		var time_gap = current_time - last_time
		time_gap_list += time_gap + "<br>";
		total_time_gap += time_gap;
		last_time = current_time;

		//calculate current velocity using distance and time gap made in this loop
		current_velocity = distance/time_gap
		vel_list.push(current_velocity);
		current_elevation = parseFloat(child[i].childNodes[1].textContent);
		elev_list.push(current_elevation);
		current_heartrate = parseFloat(child[i].childNodes[5].childNodes[1].childNodes[1].textContent);
		hr_list.push(current_heartrate);

		total_heartrate = total_heartrate + current_heartrate;
		
		//find max velocity over whole loop aswell as the coordinates at which it occured
		if (current_velocity > max_velocity){
			max_velocity = current_velocity;
			max_velocity_lat = currentlat;
			max_velocity_lon = currentlon;
		}
		 
		if (current_elevation > max_elevation){
			max_elevation = current_elevation;
			max_elevation_lat = currentlat;
			max_elevation_lon = currentlon;
			elevation_list += current_elevation;
		}
		if (current_heartrate> max_heartrate){
			max_heartrate = current_heartrate;
			max_heartrate_lat = currentlat;
			max_heartrate_lon = currentlon;
		}
		if (current_elevation > previous_elevation){
			total_elevation += (current_elevation - previous_elevation)
		}
		previous_elevation = current_elevation

	
	}

		Chart.defaults.global.defaultFontColor = "white";
		var ctx = document.getElementById('myChart').getContext('2d');
		var chart = new Chart(ctx, {
		    // The type of chart we want to create
		    type: 'line',

		    // The data for our dataset
		    data: {
			labels: elev_list,
			datasets: [{
			    label: "heartrate against elevation",
			    backgroundColor: '#415a77',
			    borderColor: 'white',
			    data: hr_list,
			}]
		    },

		    // Configuration options go here
		    options: {
		        elements: {
		            point:{
		                radius: 0
		            }
		        },
			legend: {
			    labels: {
				fontColor: 'white'
			    }
			},
			scales: {
				xAxes: [{
				    ticks: {
					autoSkip: true,
					maxTicksLimit: 20
				    }
				}]


		   	 }

			}
			                                        
		});
	

	average_heartrate = total_heartrate/(child.length);

	//fun facts
	var fun_elevation = ""
	if (0 <= total_elevation && total_elevation < 50){
		fun_elevation  = "The Arc de Triomphe (49m)";
	}if (50 <= total_elevation && total_elevation < 100){
		fun_elevation  = "The Statue of Liberty (93m)";
	}if (100 <= total_elevation && total_elevation < 200){
		fun_elevation  = "The Golden Gate Bridge (227m)";
	}if (200 <= total_elevation && total_elevation < 300){
		fun_elevation  = "The Eiffel Tower (324m)";
	}if (300 <= total_elevation && total_elevation < 400){
		fun_elevation  = "The Empire State Building (381m)";
	}if (400 <= total_elevation && total_elevation < 500){
		fun_elevation  = "Taipei 101(508m)";
	}if (500 <= total_elevation && total_elevation < 1000){
		fun_elevation  = "The Burj Khalifa(828m)";
	}if (1000 <= total_elevation && total_elevation){
		fun_elevation  = "I ran out of things, so Everest from base to peak (8849m)";
	}
	
	var fun_velocity = ""
	if (0 <= max_velocity && max_velocity < 1){
		fun_velocity  = " a walking pedestrians (1.3 m/s)";
	}if (1 <= max_velocity && max_velocity < 2){
		fun_velocity  = "a crocodile in water (2 m/s)";
	}if (2 <= max_velocity && max_velocity < 4){
		fun_velocity  = "a fast paced pedestrian (3 m/s)";
	}if (4 <= max_velocity && max_velocity < 5){
		fun_velocity  = "a chicken (4.0 m/s)";
	}if (5 <= max_velocity && max_velocity < 6){
		fun_velocity  = "a squirrel (5.4 m/s";
	}if (6 <= max_velocity && max_velocity < 7.5){
		fun_velocity  = "a Six-lined race runner (7.4 m/s)";
	}if (7.5 <= max_velocity && max_velocity < 9){
		fun_velocity  = "a Black Mamba snake (8.9 m/s)";
	}if (9 <= max_velocity && max_velocity < 11){
		fun_velocity  = "Usain Bolt (10 m/s)";
	}if (10 <= max_velocity && max_velocity < 13){
		fun_velocity  = "an Elephant (12 m/s)";
	}if (13 <= max_velocity && max_velocity < 16){
		fun_velocity  = "a domestic cat (13.5 m/s)";
	}if (16 <= max_velocity && max_velocity < 20){
		fun_velocity  = "a Gazelle (20 m/s)";
	}if (20<= max_velocity && max_velocity < 26){
		fun_velocity  = "'traveling a mile a minute' (26 m/s) ";
	}if (25<= max_velocity && max_velocity < 50){
		fun_velocity  = "a skydiver falling belly to earth(53 m/s)";
	}

	var fun_averageheartrate = ""
	if (0 <= average_heartrate && average_heartrate < 60){
		fun_averageheartrate  = "a human, not doing much (60 bpm)";
	}if (60 <= average_heartrate && average_heartrate < 100){
		fun_averageheartrate  = "a small dog(100 bpm)";
	}if (100 <= average_heartrate && average_heartrate < 150){
		fun_averageheartrate  = "a cat (150 bpm)";
	}if (150 <= average_heartrate && average_heartrate < 175){
		fun_averageheartrate  = "a reasonable heart rate for an exercising human (150-220 bpm)";
	}if (175 <= average_heartrate && average_heartrate < 200){
		fun_averageheartrate  = "a monkey (190 bpm)";
	}if (200 <= average_heartrate && average_heartrate < 250){
		fun_averageheartrate  = "a rabbit (205 m/s)";
	}if (250<= average_heartrate && average_heartrate < 300){
		fun_averageheartrate  = " a chicken (275 bpm), but more importantly, consult your GP ";
	}

	var fun_maxheartrate = ""
	if (0 <= max_heartrate && max_heartrate < 60){
		fun_maxheartrate  = "a human, not doing much (60 bpm)";
	}if (60 <= max_heartrate && max_heartrate < 100){
		fun_maxheartrate  = "a small dog(100 bpm)";
	}if (100 <= max_heartrate && max_heartrate < 150){
		fun_maxheartrate  = "a cat (150 bpm)";
	}if (150 <= max_heartrate && max_heartrate < 175){
		fun_maxheartrate  = "a reasonable heart rate for an exercising human (150-220 bpm)";
	}if (175 <= max_heartrate && max_heartrate < 200){
		fun_maxheartrate  = "a monkey (190 bpm)";
	}if (200 <= max_heartrate && max_heartrate < 250){
		fun_maxheartrate  = "a rabbit (205 m/s)";
	}if (250<= max_heartrate && max_heartrate < 300){
		fun_maxheartrate  = " a chicken (275 bpm), but more importantly, consult your GP ";
	}


	//finish point
	L.marker([lastlat, lastlon]).addTo(mymap);

	//average time gap and average speed
	average_time_gap = total_time_gap/(child.length)
	average_speed = total_distance/total_time_gap
	
	//if the distance is big, divide it by 1000 so that it becomes kilometres and change m to km
	if (total_distance/1000 > 1){
		total_distance = total_distance/1000
		m_or_km = "km"
	}
	
	//place marker for max velocity at appropriate location	
	velocity_coord = L.marker([max_velocity_lat, max_velocity_lon])
		.bindPopup("<b>Max Velocty</b><br />" + max_velocity.toFixed(2)+ " m/s").openPopup();

	heartrate_coord = L.marker([max_heartrate_lat, max_heartrate_lon])
		.bindPopup("<b>Max Heart Rate</b><br />" + max_heartrate+ " bpm").openPopup();

	elevation_coord = L.marker([max_elevation_lat, max_elevation_lon])
		.bindPopup("<b>Max Elevation</b><br />" + max_elevation.toFixed(2)+ "m").openPopup();
	
	//print statements
	document.getElementById("max_cad").innerHTML =  "max cadence: " + max_cad 
	document.getElementById("average_time_gap").innerHTML =  "average time gap: " + average_time_gap.toFixed(1) + " seconds"
	;
	//.toFixed returns value to x decimal places
	document.getElementById("average_heartrate").innerHTML =  "average heart rate: " + average_heartrate.toFixed(0) + "bpm";
	document.getElementById("elev_list").innerHTML =  elev_list;
	document.getElementById("hr_list").innerHTML =  hr_list;
	document.getElementById("total_distance").innerHTML =  "total distance: " + total_distance.toFixed(2) + m_or_km;
	document.getElementById("average_speed").innerHTML =  "average velocity: " + average_speed.toFixed(1) + "m/s";
	document.getElementById("max_velocity").innerHTML =  "max velocity: " + max_velocity.toFixed(2) + "m/s";
	document.getElementById("total_climbed").innerHTML =  "total elevation: " + total_elevation.toFixed(2) + "m";
	document.getElementById("fun_elevation").innerHTML =  "Your height climbed was similar to climbing " + fun_elevation;
	document.getElementById("fun_velocity").innerHTML =  "Your max velocity was similar to that of " + fun_velocity;
	document.getElementById("fun_averageheartrate").innerHTML =  "Your average heart rate was similar to that of " + fun_averageheartrate;
	document.getElementById("fun_maxheartrate").innerHTML =  "Your max heart rate was similar to that of " + fun_maxheartrate;
	document.getElementById("max_heartrate").innerHTML =  "max heart rate: " + max_heartrate + "bpm";
	}
	//function for calculating distance between points
	function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
	  var R = 6371; 
	  var dLat = deg2rad(lat2-lat1); 
	  var dLon = deg2rad(lon2-lon1); 
	  var a = 
	    Math.sin(dLat/2) * Math.sin(dLat/2) +
	    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
	    Math.sin(dLon/2) * Math.sin(dLon/2)
	    ; 
	  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	  var d = R * c; // Distance in km
	  return d*1000;
	}

	function deg2rad(deg) {
	  return deg * (Math.PI/180)
	}

 	function showDiv(){
	
	  document.getElementById('play').style.display = "block";
	  document.getElementById('myChart').style.display = "block";
	  document.getElementById('stats').style.display = "block";
	  document.getElementById('header2').style.display = "block";
	  document.getElementById('onmap').style.display = "block";
	  document.getElementById('facts').style.display = "block";
	  document.getElementById('header4').style.display = "none";

	}
	function dontshowDiv(){
	  document.getElementById('name_bad').innerHTML = "File format not supported";
	  document.getElementById('header4').style.display = "block";
	}

	function missingdata(){
	  document.getElementById('name_bad').innerHTML = "missing data";
	  document.getElementById('header4').style.display = "block";
	}

	function max_velocity_fn(){
	  elevation_coord.remove(mymap)
	  heartrate_coord.remove(mymap)
	  velocity_coord.addTo(mymap)
	}
	function max_heartrate_fn(){
	  velocity_coord.remove(mymap)
	  elevation_coord.remove(mymap)
	  heartrate_coord.addTo(mymap)
	}
	function max_elevation_fn(){
	  velocity_coord.remove(mymap)
	  heartrate_coord.remove(mymap)
	  elevation_coord.addTo(mymap)
	}
	
	if ('speechSynthesis' in window){
	    var synth = speechSynthesis;
	    var flag = false;

	    var playEle = document.querySelector('#play');
	    var pauseEle = document.querySelector('#pause');
	    var stopEle = document.querySelector('#stop');
	 
	    playEle.addEventListener('click', onClickPlay);
	    pauseEle.addEventListener('click', onClickPause);
	    stopEle.addEventListener('click', onClickStop);
	 
		function onClickPlay() {
		    if(!flag){
			flag = true;
			utterance = new SpeechSynthesisUtterance(
				"Welcome to Timthraill, The Statistics for your given GPX, " +
				document.getElementById("name_only").innerHTML + ", are,  " +
				document.getElementById("max_cad").innerHTML + ", " +
				document.getElementById("average_time_gap").innerHTML + ", " +
				document.getElementById("total_distance").innerHTML + ", " +
				document.getElementById("average_speed").innerHTML + ", " +
				document.getElementById("max_velocity").innerHTML + ", " +
				document.getElementById("max_heartrate").innerHTML + ", " +
				document.getElementById("total_climbed").innerHTML + ", Some fun facts, " +
				document.getElementById("fun_elevation").innerHTML + ", " +
				document.getElementById("fun_velocity").innerHTML + ", " +
				document.getElementById("fun_averageheartrate").innerHTML + ", " +
				document.getElementById("fun_maxheartrate").innerHTML);
			      
			utterance.voice = synth.getVoices()[32];
			utterance.onend = function(){
			    flag = false;
			};
			synth.speak(utterance);
		    }
		    if(synth.paused) { 
			synth.resume();
		    }
		}
	    function onClickPause() {
	    }
	    function onClickStop() {
	    }
	}






