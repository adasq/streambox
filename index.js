var nconf = require('nconf');
var OAuth = require('oauth');
var DropboxAPI = require('./modules/dropbox/DropboxAPI.js');
var DropboxAdapter = require('./modules/dropbox/DropboxAdapter.js');
var request = require('request');
var _ = require('underscore');
var q = require('q');
var fs = require('fs');
var async = require('async');
var express = require('express');
var mongoose = require('mongoose');
var everyauth = require('everyauth');
var Playlist = require('./modules/Playlist.js');

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');

//------------------------------------------------------------------------------------

nconf
.env()
.file('./config.json');

//------------------------------------------------------------------------------------


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
  	// console.log(usersById[id], req.url);
    callback(null, usersById[id]);
  });


var usersByDropboxId = {};

everyauth
  .dropbox
    .consumerKey(nconf.get('DROPBOX:consumer_key'))
    .consumerSecret(nconf.get('DROPBOX:consumer_secret'))
    .findOrCreateUser( function (sess, accessToken, accessSecret, dropboxUserMetadata) {
      console.log('sess', sess.auth.dropbox);
      console.log('accessToken', accessToken);
      console.log('accessSecret', accessSecret);
      console.log(dropboxUserMetadata);
       return usersByDropboxId[dropboxUserMetadata.uid] ||
          (usersByDropboxId[dropboxUserMetadata.uid] = addUser('dropbox', dropboxUserMetadata));
    
}).redirectPath('/');




var dbAdapter = new DropboxAdapter(nconf.get('DROPBOX'));

mongoose.connect(nconf.get('DB_URI'));
var Track = mongoose.model('Track', {
	name: String
});
mongoose.connection.on("open", function(){ console.log('db connection set'); });

init();
//------------------------------------------------------------------------------------
function init(){
  if(nconf.get('DEVELOPMENT')){
    // startServer();
    getSavedTracks(function(tracks){
        Playlist.setTracks(tracks);
        startServer();
    })
    // retriveAndSaveTracks(function(tracks){
    //   console.log(tracks);    
    // });
  }else{
    //prod
    retriveAndSaveTracks(function(tracks){
      console.log(tracks);
      startServer();
    });
  }
  
}
//------------------------------------------------------------------------------------


function startServer(){
  var app = express();

  app.use(bodyParser())
    .use(cookieParser('htuayreve'))
    .use(session())
    .use(everyauth.middleware(app));


  app.set('port', (nconf.get('PORT') || 3000));
  app.use(express.static(__dirname + '/static'));


  app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
  });


  app.get('/list', function(request, response) {
    response.send(Playlist.getTracks());
  });

  app.get('/stream', function(req, res){
    var id = req.query.mid;   
    var track = Playlist.getTrackById(id);
    if(track){
      console.log('now playing...', track.name);
      dbAdapter.downloadFile(track.name)
      .then(function(response){
        response.pipe(res);
      }, function(err){
        console.log('err while stream:', err);
      });
      //ms.pipe(req, res, dropbox.getFile(track.name))
    }else{
      console.log('no track found');
    }       
  });


  app.get('/test', function(req, res) { 
    console.log('!!!!!!!!!!!!!!!!!!!!!!');
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
	dbAdapter.getFilesTree(['/nuta']).then(function(result){
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

