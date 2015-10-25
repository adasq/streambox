var _ = require('underscore');
var q = require('q');
var async = require('async');
var DropboxAPI = require('./DropboxAPI');

var DropboxAdapter = function(config){
  this.api = new DropboxAPI(config);
};

DropboxAdapter.prototype.downloadFile = function(path){
  return this.api.downloadFile(path);
};

DropboxAdapter.prototype.getFilesTree = (function(){
  
  var filter = {
    isDir: function(file){
      return file.is_dir;
    },
    isFile: function(file){
      return !file.is_dir;
    }
  };
  return function (dirArray){
  var that = this;
  var fileTree = {
  };

  function getCats(path){
    var deferred = q.defer();
    that.api.retriveCatalogFiles(path).then(function(obj){  
       files = obj.contents;
       var dirs = _.filter(files, filter.isDir);
       var fileList = _.filter(files, filter.isFile);
       fileTree[path] = _.pluck(fileList,'path');       
       deferred.resolve(_.pluck(dirs, 'path'));
    }, function(){
      console.log('err')
    });
    return deferred.promise;
  }
function inner_dig(dirArray){
  var deferred = q.defer();
   if(dirArray.length === 0){
    deferred.resolve();
   }  else {
     var arr = _.map(dirArray, function(dir){
      return function(cb){
        getCats(dir).then(function(result){
          inner_dig(result).then(function(){
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
  return inner_dig(dirArray);
}
})();

module.exports = DropboxAdapter;