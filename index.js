var nconf = require('nconf');

nconf
.env()
.file('./config.json');


var express = require('express');
var q = require('q');
var async = require('async');
var mongoose = require('mongoose');

var _ = require('underscore');

var Playlist = require('./modules/Playlist.js');

var DropboxManager = require('./modules/DropboxManager.js');


mongoose.connect(nconf.get('DB_URI'));
var Track = mongoose.model('Track', {
	name: String,
  rev: String
});
mongoose.connection.on("open", init);

//------------------------------------------------------------------------------------
function init(){
  Track.find().then(function(savedTracks){ 
    Playlist.setTracks(_.map(savedTracks, function(track){
      console.log(track);
      return {
        name: track.name,
        rev: track.rev,
        id: ''+track._id
      };
    }));
    startServer();
  })
  // retriveAndSaveTracks(function(tracks){
  //     startServer();
  // });
}
//------------------------------------------------------------------------------------



function startServer(){
  var app = express();

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
  Track.collection.remove();
  getDropboxTracks().then(function(tracks){
    saveTrackNames(tracks).then(function(savedTracks){
       Playlist.setTracks(savedTracks);
       console.log(savedTracks);
       cb && cb(savedTracks);
    });
  });
}


function getDropboxTracks(){
	return DropboxManager.getFiles('/nuta');
}

function saveTrackNames(tracks){
  var deferred = q.defer();
  console.log('saving...');
  var promises =_.map(tracks, function(trackObj){    
    return function(callback){
      var track = new Track({
        name: trackObj.path,
        rev: trackObj.rev
      });
      track.save(function(err, result){

        callback(err, err || {
          rev: result.rev,
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

