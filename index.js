var express = require('express');
var q = require('q');
var async = require('async');
var _ = require('underscore');

var DropboxManager = require('./modules/DropboxManager.js');


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
	DropboxManager.dig(['nuta']).then(function(result){
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



generate();
