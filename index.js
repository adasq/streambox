var express = require('express');
var q = require('q');
var async = require('async');
var _ = require('underscore');
var  Dropbox = require('./dropboxManager.js');
var app = express();

app.set('port', (process.env.PORT || 5000));



app.use(express.static(__dirname + '/static'));


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

app.get('/env', function(request, response) {
  response.send({val: process.env.TOKEN});
});

app.get('/list', function(request, response) {
  response.send(fileTree);
});



var dropbox = new Dropbox();


function getFiles (dir){
	return function(cb){
		dropbox.getFiles(dir).then(function(obj){  
		 	files = obj.contents;
		 	cb(null, files);	
		});
	};
}

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
			deferred.resolve();
		});
	 } 

	return deferred.promise;
}
var html = "";


dig(['nuta']).then(function(){
	
});