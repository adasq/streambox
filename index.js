var express = require('express');
var q = require('q');
var async = require('async');
var _ = require('underscore')
  , everyauth = require('everyauth')
  , conf = require('./conf');

var DropboxManager = require('./modules/DropboxManager.js');
var Dropbox = require('./modules/Dropbox.js');

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session')


var usersById = {};
var nextUserId = 0;
var usersByGoogleId = {};

console.log(process.env.TOKEN);

function addUser (source, sourceUser) {
  var user;
  if (arguments.length === 1) { // password-based
    user = sourceUser = source;
    user.id = ++nextUserId;
    return usersById[nextUserId] = user;
  } else { // non-password-based
    user = usersById[++nextUserId] = {id: nextUserId};
    user[source] = sourceUser;
  }
  return user;
}

everyauth.everymodule
  .findUserById( function (req, id, callback) {
  	console.log(usersById[id], req.url);
    callback(null, usersById[id]);
  });


everyauth.google
  .appId(conf.google.clientId)
  .appSecret(conf.google.clientSecret)
  .scope('https://www.googleapis.com/auth/userinfo.profile https://www.google.com/m8/feeds/')
  .findOrCreateUser( function (sess, accessToken, extra, googleUser) {
    googleUser.refreshToken = extra.refresh_token;
    googleUser.expiresIn = extra.expires_in;
    return usersByGoogleId[googleUser.id] || (usersByGoogleId[googleUser.id] = addUser('google', googleUser));
  })
  .redirectPath('/');


var mongoose = require('mongoose');
mongoose.connect('mongodb://admin:admin@ds061258.mongolab.com:61258/streambox');



var Track = mongoose.model('Track', {
	name: String
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

var app = express();

  app.use(bodyParser())
  .use(cookieParser('htuayreve'))
  .use(session())
  .use(everyauth.middleware());



app.set('port', (process.env.PORT || 3000));

app.use(express.static(__dirname + '/static'));


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});



 app.get('/au', function(request, response) {
  response.send(1);
});



var playlist = [];


app.get('/list', function(request, response) {
  response.send(playlist);
});

var routes = require('./routes/routes.js');
_.each(routes, function(routePackagePath){
	var route = require('./routes/'+routePackagePath);
	app[route.method](route.url ,route.cb);
});


Track.find(function(err, resp){
	var list = _.map(resp, function(item){
		return item.name;
	});
	playlist = list;
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




