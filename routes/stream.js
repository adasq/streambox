var  Dropbox = require('../modules/Dropbox.js');
var  Playlist = require('../modules/Playlist.js');
var dropbox = new Dropbox();

module.exports = {
	url: '/stream',
	method: 'get',
	cb: function(req, res){ 
		var id = req.query.mid;		
		var track = Playlist.getTrackById(id);
		if(track){
			console.log('now playing...', track);
			dropbox.getFile(track.rev).pipe(res);
		}else{
			console.log('no track found');
		}
		    
	}
}