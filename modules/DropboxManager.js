var  Dropbox = require('./Dropbox.js');
var q = require('q');
var async = require('async');
var _ = require('underscore');


var dropbox = new Dropbox();



var filter = {
	isDir: function(file){
		return file.is_dir;
	},
	isFile: function(file){
		return !file.is_dir;
	}
};

var fileTree = {

};

function getCats(path){

	var deferred = q.defer();
	dropbox.getFiles(path).then(function(obj){  
		 files = obj.contents;		 
		 var dirs = _.filter(files, filter.isDir);
		 var fileList = _.filter(files, filter.isFile);	
		 console.log(_.pluck(fileList,'path'));
		 fileTree[path] = _.pluck(fileList,'path');
		 
		 deferred.resolve(_.pluck(dirs, 'path'));
	});
	return deferred.promise;
}

function dig(dirArray){

	var deferred = q.defer();
	 if(dirArray.length === 0){
	 	deferred.resolve();
	 }	else {
		 var arr = _.map(dirArray, function(dir){
			return function(cb){
				getCats(dir).then(function(result){
					dig(result).then(function(){
						cb(null, result);
					});
				});
			};
		});
		async.parallel(arr, function(err, result){
			deferred.resolve(fileTree);
		});
	 } 
	return deferred.promise;
}



module.exports = {
	dig: dig
};