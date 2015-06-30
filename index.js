var stream = require('stream');
var through2 = require('through2');
var request =require('request');
var fs =require('fs');
var async =require('async');
var _ =require('underscore');
var express =require('express');
var q =require('q');
var crypto =require('crypto');
var  Dropbox = require('./dropboxManager.js');
var _ =require('underscore');
require('colors');
 

var dropbox = new Dropbox();

// var password = new Buffer('1my secret');
//  var aes = crypto.createCipher('aes-256-cbc', password); 


function getFiles (dir){
	return function(cb){
		dropbox.getFiles(dir).then(function(obj){  
		 	files = obj.contents;
		 	cb(null, files);	
		});
	};
}

// async.parallel([getFiles('nuta/GOLD')], function(err, result){
// 	console.log(result);
// });


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
	fs.writeFile('aaa', JSON.stringify(fileTree))
	 	 html = "<body>";
 	_.each(fileTree, function(file){
 		_.each(file, function(f){ 
		html+= "<a href='/file?p="+f+"'>"+f+"</a>".replace("$src", f)  +"<br>";
 		})
 	});
 	html+="</body>"; 
 	console.log(html);
});

// getCats('nuta').then(function(res){
// 	console.log(res);
// });


 


// var file = {
// 	stream: fs.createReadStream('client.js'),
// 	name: 'ahaha'
// };




// dropbox.saveFile(file).then(function(){
// 	console.log('succ')
// }, function(){
// 	cosnoel.log('err')
// }); 



 // dropbox.getFiles('nuta/GOLD').then(function(obj){  
 // 	files = obj.contents;
 // 	var dirs = _.filter(files, filter.isFile);
 // 	console.log(dirs);
 // 	//  html = "<body>";
 // 	// _.each(files, function(file){
	// 	// html+= "<a href='/file?p="+file.path+"'>"+file.path+"</a>".replace("$src", file.path)  +"<br>";
 // 	// });
 // 	// html+="</body>"; 	
 // });
 



var app = express(); 

	app.set('port',  80);
	app.use(express.static(__dirname + '/static'));

var server = require('http').createServer(app);

		

app.get('/list', function(req, res){ 
			res.send(html);
		});
app.get('/list2', function(req, res){ 
			res.send(fileTree);
		});



app.get('/', function(req, res){ 
			res.send(html);
		});


			app.get('/file', function(req, res){

				console.log(req.query.p);
	dropbox.getFile(req.query.p)
	.pipe(res);     

			 
		});

server.listen(80);










// var server = http.createServer(function(req, res){
// 	dropbox.getFile('Tiesto - Club Life 428 (Eelke Kleijn Guestmix) - 20.06.2015.mp3')
// 	.pipe(res);     
// });
// http.get("http://www.google.com/index.html", function(res) {
//   console.log("Got response: " + res.statusCode);
// }).on('error', function(e) {
//   console.log("Got error: " + e.message);
// });

// server.listen(9999);
