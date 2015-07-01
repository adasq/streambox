var  Dropbox = require('../modules/Dropbox.js');
var dropbox = new Dropbox();

module.exports = {
	url: '/stream',
	method: 'get',
	cb: function(req, res){ 
			dropbox.getFile(req.query.mid).pipe(res);    
	}
}