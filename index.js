var express = require('express');
var q = require('q');
var async = require('async');
var _ = require('underscore');

var DropboxManager = require('./modules/DropboxManager.js');
var Dropbox = require('./modules/Dropbox.js');


var app = express();
app.set('port', (process.env.PORT || 5000));
var routes = require('./routes/routes.js');
_.each(routes, function(routePackagePath){
	var route = require('./routes/'+routePackagePath);
	app[route.method](route.url ,route.cb);
});
app.use(express.static(__dirname + '/static'));
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

console.log('aa')

var mongoose = require('mongoose');
mongoose.connect('mongodb://admin:admin@ds061258.mongolab.com:61258/streambox');



var Track = mongoose.model('Track', {
	name: String
});

Track.find(function(err, resp){
	console.log(resp);
});



// track.save(function(err){
// 	console.log('not saved');
// })
//var Cat = mongoose.model('Cat', { name: String });

// var kitty = new Cat({ name: 'Zildjian' });
// kitty.save(function (err) {
//   if (err) // ...
//   console.log('meow');
// });


// Cat.find({}, function(){
// 	console.log(arguments);
// })



 // generate().then(function(items){
 // 	_.each(items, function(trackName){
 // 		var track = new Track({
 // 			name: trackName
	// 	});
	// 	track.save(function(err){
	// 		console.log('err');
	// 	})

 // 	});
 // })



return;


var playlist = [];


app.get('/list', function(request, response) {
  response.send(playlist);
});

app.get('/generate', function(request, response) {
	generate().then(function(list){
		response.send(list);
	})
  
});



function generate(){
	var deferred = q.defer();
	DropboxManager.dig(['/nuta/GOLD']).then(function(result){
		var list = [];
		_.each(result, function(innerList){
			list = list.concat(innerList);
		});
		playlist = list;
		console.log('generated');
		deferred.resolve(list);
	});
	return deferred.promise;
}




