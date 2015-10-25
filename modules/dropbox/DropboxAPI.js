var request = require('request');
var _ = require('underscore');
var q = require('q');
var utf8 = require('utf8');


var urls = {
  GET_FILES_LIST: 'https://api.dropbox.com/1/metadata/auto',
  GET_FILE: 'https://api-content.dropbox.com/1/files/auto'
};

var DropboxAPI = function(config){
  if(_.isObject(config)){
    this.configure(config);
  }
};

DropboxAPI.prototype.configure = function(config){
  this.config = config;
};
 
DropboxAPI.prototype.downloadFile = function(path){
  var qs = {}; 
  console.log(utf8.encode(path));
  var url = urls.GET_FILE +utf8.encode(path);
  var deferred = q.defer();
  request.get({url: url, oauth: this.config, qs:qs, json:true}, function(e,response,data){
    if(response.headers['content-type'] === 'application/json'){
      return deferred.reject(data);
    }
  })
  .on('response', function(response){
    if(response.headers['content-type'] !== 'application/json'){
      return deferred.resolve(response);
    }
  });
  return deferred.promise;
};

// DropboxAPI.prototype.downloadFile = function(path){
//   var qs = {
//     path: path
//   };
//   var url = 'https://content.dropboxapi.com/2/files/download';
//   var deferred = q.defer();
//     request({
//       method: 'POST',
//       url: url, 
//       oauth: this.config, 
//       headers: {
//       'Dropbox-API-Arg': JSON.stringify({path: path})
//       }, 
//       qs:qs, 
//       json:true
//     }, function(e,response,data){
//      console.log(data);
//     })
//   .on('response', function(response){
//     if(response.headers['content-type'] !== 'application/json'){
//       return deferred.resolve(response);
//     }
//   });
//   return deferred.promise;
// };




DropboxAPI.prototype.retriveCatalogFiles = function(path){
  var qs = {list: true, include_media_info: true};
  var url = urls.GET_FILES_LIST + path;
  var deferred = q.defer();
  request.get({url: url, oauth: this.config, qs:qs, json:true}, function (e, r, data) {
    if(data.error){
      return deferred.reject(data.error);
    }
    deferred.resolve(data);
  });
  return deferred.promise;
};

module.exports = DropboxAPI;


// var dbApi = new DropboxAPI({
//   consumer_key: 'akknopwqozt79w6',
//   consumer_secret: 'lji13zpya8mytmq',
//   token: 'iheng9ubbcdsys59',
//   token_secret: 'bpmu091252ck1nf'
// });


// dbApi.retriveCatalogFiles('nuta/GOLD')
// .then(function(data){
//   console.log(data);
// }, function(err){
//   console.log(err);
// });

// dbApi.downloadFile('nuta/GOLD/drupi sereno e.mp3')
// .then(function(stream){
//   console.log('success: ', stream.headers);
//   stream.pipe(fs.createWriteStream('xxxxxxxxxxx.mp3'));
// }, function(err){
//   console.log('err: ', err);
// });