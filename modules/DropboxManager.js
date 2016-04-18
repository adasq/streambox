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
	
		 fileTree[path] = _.compact(_.map(fileList, function(file){
		 	if(/audio/.test(file.mime_type)){
			 	return {
			 		rev: file.rev,
			 		path: file.path
			 	};
		 	}else{
		 		return false;
		 	}

		 }));
		 
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
			deferred.resolve((fileTree));
		});
	 } 
	return deferred.promise;
}



module.exports = {
	dig: dig
};