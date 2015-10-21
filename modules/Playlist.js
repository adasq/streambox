var _ = require('underscore');

var tracks = [];

function setTracks(_tracks){
	tracks = _tracks;
}

function addTrack(track){
	tracks.push(track);
}

function getTracks(){
	return tracks;
}

function getTrackById (id){
	console.log(tracks.length);
	return _.find(tracks, function(track){
		return track.id === id;
	});
}

module.exports = {
	setTracks: setTracks,
	getTrackById: getTrackById,
	getTracks: getTracks,
	addTrack: addTrack
};

