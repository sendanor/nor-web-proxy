/* app.js */

var tld = require('tld');
var http = require('http');
var httpProxy = require('http-proxy');
var getent = require('getent');

httpProxy.createServer(function (req, res, proxy) {
	var domain = tld.registered(req.host);
	var group = domain.replace(/\./g, '_').toLowerCase();
	var g = getent.group(group);
	var port;


	proxy.proxyRequest(req, res, {
		host: 'www1.sendanor.com',
		port: port
	});
}).listen(8000);

/* EOF */
