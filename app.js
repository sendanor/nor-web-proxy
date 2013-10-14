#!/usr/bin/env node
/* app.js */

var proxy_host = process.env.HOST || '0.0.0.0';
var proxy_port = process.env.PORT || 80;
var proxy_dir = process.env.VARDIR || '/var';
var proxy_logdir = process.env.LOGDIR || proxy_dir+'/log';
var proxy_rundir = process.env.RUNDIR || proxy_dir+'/run';
var proxy_pid = process.env.PIDFILE || proxy_rundir + '/node-proxy.pid';
var proxy_log = process.env.LOGFILE || proxy_logdir + '/node-proxy.log';
var proxy_user = process.env.PROXY_USER || "www-data";
var proxy_group = process.env.PROXY_GROUP || "www-data";

var tld = require('tld');
var http = require('http');
var httpProxy = require('http-proxy');
var getent = require('getent');

function start_app() {
	var proxy = httpProxy.createProxyServer({});

	process.chdir("/");

	var server = http.createServer(function (req, res) {
		var domain = tld.registered(req.host);
		var group = domain.replace(/\./g, '_').toLowerCase();
		var g = getent.group(group);
		var port = 7000 + g.gid;
		proxy.web(req, res, {
			host: 'www1.sendanor.com',
			port: port
		});
	}).listen(proxy_port, proxy_host, function() {
		if (process.getuid() === 0) {
			process.initgroups(proxy_user, proxy_group);
			process.setgid(proxy_group);
			process.setuid(proxy_user);
		}
	});
}

start_app();

/* EOF */
