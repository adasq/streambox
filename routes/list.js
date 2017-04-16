var  Playlist = require('../modules/Playlist.js');

module.exports = {
    url: '/list',
    method: 'get',
    cb: (req, res) => res.send(Playlist.getTracks())
};