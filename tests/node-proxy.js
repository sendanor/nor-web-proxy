	var http = require('http'),
	    httpProxy = require('http-proxy');
	
	//
	// Create a proxy server with custom application logic
	//
	var proxy = httpProxy.createProxyServer({});
	
	var server = require('http').createServer(function(req, res) {
		proxy.web(req, res, { target: 'http://atlas.sendanor.fi' });
	});
	
	console.log("listening on port 9000")
	server.listen(9000);
