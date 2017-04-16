const nconf = require('nconf');
nconf
.env()
.file('./config.json');

const express = require('express');
const q = require('q');
const async = require('async');
const mongoose = require('mongoose');
const _ = require('underscore');
const Playlist = require('./modules/Playlist.js');
const DropboxManager = require('./modules/DropboxManager.js');

const DB_URI = nconf.get('DB_URI');
const PORT = nconf.get('PORT');

const Track = mongoose.model('Track', {
	name: String,
  rev: String
});

init();

//================================================

function init() {
  async.series([connectDatabase, loadTracks, startServer], (err) => {
    if(err) {
      return console.log(err);
    }
    console.log('APP STARTUP SUCCESS');
  });
}

function loadTracks(cb) {
  console.log('loading tracks...');
  Track.find().then(tracks => {
    console.log(tracks.length);
    Playlist.setTracks(parseTracks(tracks));
    cb();
  });
}

function connectDatabase(cb){
  console.log('connectiong database...');
  mongoose.connect(DB_URI);
  mongoose.connection.on('open', cb);
}

function parseTracks(tracks) {
  return _.map(tracks, ({name, rev, _id}) => {
      return { name, rev, id: _id.toString() };
  });
}

function startServer(cb){
  console.log('starting server...');
  const app = express();
  app.set('port', (PORT || 3000));
  app.use(express.static(__dirname + '/static'));
  app.listen(app.get('port'), cb);

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

function retriveAndSaveTracks(cb){
  Track.collection.remove();
  getDropboxTracks().then(tracks => {
    saveTrackNames(tracks).then(savedTracks => {
       Playlist.setTracks(savedTracks);
       cb && cb(savedTracks);
    });
  });
}

function getDropboxTracks(){
	return DropboxManager.getFiles('/nuta');
}

function saveTrackNames(tracks){
  var deferred = q.defer();
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