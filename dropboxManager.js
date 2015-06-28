var
request = require('request'),
config = require('./config.js'),
q = require('q');

var dbClass = function() {
	this.headers = {
		"Authorization":"Bearer "+(config.dropbox.token),
	};
};
dbClass.prototype.FILE_PUT_URL = 'https://api-content.dropbox.com/1/files_put/auto/'
dbClass.prototype.GET_REVISIONS_URL = 'https://api.dropbox.com/1/delta'
dbClass.prototype.DELETE_FILE_URL = 'https://api.dropbox.com/1/fileops/delete'
dbClass.prototype.GET_FILE_URL = 'https://api-content.dropbox.com/1/files/auto/'
dbClass.prototype.GET_FILES_URL = 'https://api.dropbox.com/1/metadata/auto/'


dbClass.prototype.saveFile= function(file){
	var deferred = q.defer();
	var callback = function(error, response, body){
 		deferred.resolve({
 			e: error,
 			r: response,
 			b: body
 		});
 	}; 
	var uploadUrl = this.FILE_PUT_URL+ (file.path || file.name);
 	
var targetRequest = request.post({
  uri: uploadUrl,
  followRedirect: false, 
  headers: this.headers}, callback);

  file.stream.pipe(targetRequest);

  return deferred.promise;
};


dbClass.prototype.getInfo= function(callback){
  var getFileUrl = 'https://api.dropbox.com/1/account/info'
  return request.get({
  uri: getFileUrl,
  followRedirect: false, 
  headers: this.headers}, callback);
} 


dbClass.prototype.getFile= function(file){
  var getFileUrl = this.GET_FILE_URL + (file);
  return request.get({
  uri: getFileUrl,
  followRedirect: false, 
  headers: this.headers});
} 

dbClass.prototype.getFiles= function(file){
  var getFileUrl = this.GET_FILES_URL+file+'?list=true&include_media_info=true';
  var deferred = q.defer();
  request.get({
  uri: getFileUrl,
  followRedirect: false, 
  headers: this.headers}, function(err, response, data){
    deferred.resolve(JSON.parse(data));
  });
  return deferred.promise;
} 


dbClass.prototype.getRevisions= function(){
	var deferred = q.defer();
	var callback = function(error, response, body){
 		deferred.resolve({
 			e: error,
 			r: response,
 			b: body
 		});
 	}; 
	var url = this.GET_REVISIONS_URL;
 	
var targetRequest = request.post({
  uri: url,
  followRedirect: false, 
  headers: this.headers}, callback);

  return deferred.promise;
};


dbClass.prototype.deleteFile= function(data){
	var deferred = q.defer();
	var callback = function(error, response, body){
 		deferred.resolve({
 			e: error,
 			r: response,
 			b: body
 		});
 	}; 
	var url = this.DELETE_FILE_URL;
 	
var targetRequest = request.post({
  uri: url,
  form: data,
  followRedirect: false, 
  headers: this.headers}, callback);

  return deferred.promise;
};



module.exports = dbClass;