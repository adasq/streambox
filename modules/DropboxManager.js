var  Dropbox = require('./Dropbox.js');
var q = require('q');
var async = require('async');
var _ = require('underscore');


var dropbox = new Dropbox();



function getFiles(dir){
	var deferred = q.defer();

	dropbox.getFiles(dir).then(function(files){
		
      var parsedFiles = _.map(files, function(file){
      	if(file['.tag'] !== 'file' || !file.path_lower.match(/\.mp3$/)){
      		return null;
      	}else{
      		return {
			 		rev: file.rev,
			 		path: file.name
			 };
      	}
      }); 
      deferred.resolve(_.compact(parsedFiles))
	});
	return deferred.promise;
}

module.exports = {
	getFiles: getFiles
};