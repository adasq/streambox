var nconf = require('nconf');

nconf
.env()
.file('./config.json');


var express = require('express');
var q = require('q');
var async = require('async');
var mongoose = require('mongoose');

var _ = require('underscore')
  , everyauth = require('everyauth')
  , conf = require('./conf');
var Playlist = require('./modules/Playlist.js');

var DropboxManager = require('./modules/DropboxManager.js');
var Dropbox = require('./modules/Dropbox.js');

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session')


var usersById = {};
var nextUserId = 0;
var usersByGoogleId = {};


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


mongoose.connect(nconf.get('DB_URI'));
var Track = mongoose.model('Track', {
	name: String
});
mongoose.connection.on("open", init);

//------------------------------------------------------------------------------------
function init(){
  retriveAndSaveTracks(function(tracks){
      console.log(tracks);
      startServer();
  });
}
//------------------------------------------------------------------------------------


function startServer(){
  var app = express();

  app.use(bodyParser())
    .use(cookieParser('htuayreve'))
    .use(session())
    .use(everyauth.middleware());


  app.set('port', (nconf.get('PORT') || 3000));
  app.use(express.static(__dirname + '/static'));


  app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
  });

  var routes = require('./routes/routes.js');
  _.each(routes, function(routePackagePath){
    var route = require('./routes/'+routePackagePath);
    app[route.method](route.url ,route.cb);
  });

  app.get('/list', function(request, response) {
    response.send(Playlist.getTracks());
  });

  app.get('/generate', function(request, response) {
    Track.collection.remove();
    retriveAndSaveTracks(function(tracks){
      response.send(tracks);
    });
  });
}

//----------------------------------------------------------------------

function getSavedTracks(cb){
 Track.find(function(err, tracks){
   cb(_.map(tracks, function(track){
      return {
        name: track.name,
        id: track._id+''
      };
   })); 
}); 
}

function retriveAndSaveTracks(cb){
  getDropboxTracks().then(function(trackNames){
  saveTrackNames(trackNames).then(function(savedTracks){
     Playlist.setTracks(savedTracks);
     cb && cb(savedTracks);
  });
});
}

function getDropboxTracks(){
	var deferred = q.defer();
	DropboxManager.dig(['/nuta']).then(function(result){
		var list = [];
		_.each(result, function(innerList){
			list = list.concat(innerList);
		});
		deferred.resolve(list);
	});
	return deferred.promise;
}

function saveTrackNames(tracks){
  var deferred = q.defer();
  console.log('saving...')
  var promises =_.map(tracks, function(trackName){    
    return function(callback){
      var track = new Track({
        name: trackName
      });
      track.save(function(err, result){
        callback(err, err || {
          name: result.name,
          id: result._id+''
        });
      });
    }    
  });

  async.parallel(promises, function(err, result){
    if(err){
      deferred.reject();
      return console.log('err while saving tracks');
    }
    deferred.resolve(result);
  });
  return deferred.promise;
}

