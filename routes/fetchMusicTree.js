module.exports = {
	url: '/fetch',
	method: 'get',
	cb: function(req, res){
		res.send({a: 1});
	}
}