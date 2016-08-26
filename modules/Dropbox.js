var nconf = require('nconf'),
  _ = require('underscore'),
  q = require('q'),
  dropboxApi = require('dropbox-v2-api');
 
dropboxApi.authenticate({
    token: nconf.get('DROPBOX_TOKEN')
});


function dbClass2 (){}

dbClass2.prototype.getFiles = function(path){
  var deferred = q.defer();
  dropboxApi({
    resource: 'files/list_folder',
    parameters: {    
        "path": path,
        "recursive": true,
        "include_media_info": true,
        "include_deleted": false,
        "include_has_explicit_shared_members": false
    }
  }, function callback(err, response){
      if(err){ return console.log('err:', err); }
      deferred.resolve(response.entries);
  });
  return deferred.promise;
};

dbClass2.prototype.getFile = function(rev){
      var dropboxStream = dropboxApi({
        resource: 'files/download',
        parameters: {
          path:  "rev:" + rev
        }       
      }, function callback(err, response){
        if(err){ throw err; }
      });
      return dropboxStream; 
};



module.exports = dbClass2;