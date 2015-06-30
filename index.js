
var express =require('express');

 


var app = express(); 

	app.set('port',  80);
	app.use(express.static(__dirname + '/static'));

var server = require('http').createServer(app);
server.listen(80);










// var server = http.createServer(function(req, res){
// 	dropbox.getFile('Tiesto - Club Life 428 (Eelke Kleijn Guestmix) - 20.06.2015.mp3')
// 	.pipe(res);     
// });
// http.get("http://www.google.com/index.html", function(res) {
//   console.log("Got response: " + res.statusCode);
// }).on('error', function(e) {
//   console.log("Got error: " + e.message);
// });

// server.listen(9999);
