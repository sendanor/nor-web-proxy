#!/usr/bin/env node
/* app.js */

var proxy_host = process.env.HOST || '0.0.0.0';
var proxy_port = process.env.PORT || 80;
var proxy_dir = process.env.VARDIR || '/var';
var proxy_logdir = process.env.LOGDIR || proxy_dir+'/log';
var proxy_rundir = process.env.RUNDIR || proxy_dir+'/run';
var proxy_pid = process.env.PIDFILE || proxy_rundir + '/nor-web-proxy.pid';
var proxy_log = process.env.LOGFILE || proxy_logdir + '/nor-web-proxy.log';
var proxy_user = process.env.PROXY_USER || "www-data";
var proxy_group = process.env.PROXY_GROUP || "www-data";

var util = require('util');
var tld = require('tld');
var http = require('http');
//var httpProxy = require('http-proxy');
var getent = require('getent');

var fs = require("fs");

var logStream = openLog(proxy_log);

function openLog(logfile) {
	return fs.createWriteStream(logfile, {
		flags: "a", encoding: "utf8", mode: 0644
	});
}

function writelog(msg) {
	logStream.write(msg + "\n");
}

function start_app() {

	/*
	var proxy = httpProxy.createProxyServer({});

	process.chdir("/");

	var server = http.createServer(function (req, res) {
		try {
			var domain = tld.registered(''+req.headers.host);
			writelog("domain =" + util.inspect(domain) );
			var group = domain.replace(/\./g, '_').toLowerCase();
			writelog("group =" + util.inspect(group) );
			var g = getent.group(group).shift();
			writelog("g =" + util.inspect(g) );
			var port = 7000 + g.gid;
			writelog("Forwarding to " + port);

			proxy.web(req, res, { target: 'http://127.0.0.1:' + port });
		} catch(e) {
			writelog("Error: " + e);
			if(e.stack) { writelog("" + e.stack); }
		}
	}).listen(proxy_port, proxy_host, function() {
		try {
			if (process.getuid() === 0) {
				process.initgroups(proxy_user, proxy_group);
				process.setgid(proxy_group);
				process.setuid(proxy_user);
			}
		} catch(e) {
			writelog("Error: " + e);
			if(e.stack) { writelog("" + e.stack); }
		}
	});
	*/

	var bouncy = require('bouncy');
	
	var server = bouncy(function (req, res, bounce) {
		try {
			var domain = tld.registered(''+req.headers.host);
			//writelog("domain =" + util.inspect(domain) );
			var group = domain.replace(/\./g, '_').toLowerCase();
			//writelog("group =" + util.inspect(group) );
			var g = getent.group(group).shift();
			//writelog("g =" + util.inspect(g) );
			var port = 7000 + g.gid;
			//writelog("Forwarding to " + port);
			bounce(port);
		} catch(e) {
			writelog("Error: " + e);
			if(e.stack) { writelog("" + e.stack); }
		}
	});
	server.listen(proxy_port, proxy_host, function() {
		try {
			if (process.getuid() === 0) {
				process.initgroups(proxy_user, proxy_group);
				process.setgid(proxy_group);
				process.setuid(proxy_user);
			}
		} catch(e) {
			writelog("Error: " + e);
			if(e.stack) { writelog("" + e.stack); }
		}
	});

}
	
try {
	start_app();
} catch(e) {
	writelog("Error: " + e);
	if(e.stack) { writelog("" + e.stack); }
}

/* EOF */
