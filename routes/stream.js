const  Dropbox = require('../modules/Dropbox.js');
const  Playlist = require('../modules/Playlist.js');
const dropbox = new Dropbox();

module.exports = {
	url: '/stream',
	method: 'get',
	cb: (req, res) => { 
		var id = req.query.mid;		
		var track = Playlist.getTrackById(id);
		if(track){
			console.log(`
			Now playing...
			${track.name}
			//${track.id} ${track.rev}
			`);
			dropbox.getFile(track.rev).pipe(res);
		}else{
			console.log('no track found');
		}
		    
	}
}