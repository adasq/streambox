var  Playlist = require('../modules/Playlist.js');

module.exports = {
    url: '/list',
    method: 'get',
    cb: function(req, res){ 
        res.send(Playlist.getTracks());       
    }
};