#!/usr/bin/env node
/* app.js */
var argv = require('optimist').argv;

var path = require('path');
var util = require('util');
var http = require('http');
var fs = require("fs");
var tld = require('tld');
var getent = require('getent');
var debug = require('./debug.js');

var _proxy_host = process.env.HOST || '0.0.0.0';
var _proxy_default_hostname = process.env.HOSTNAME || 'example.com';
var _proxy_port = process.env.PORT || 80;
var _proxy_dir = path.resolve( process.env.VARDIR || '/var' );
var _proxy_logdir = process.env.LOGDIR || _proxy_dir+'/log';
var _proxy_rundir = process.env.RUNDIR || _proxy_dir+'/run';
var _proxy_pid = process.env.PIDFILE || _proxy_rundir + '/nor-web-proxy.pid';
var _proxy_log = process.env.LOGFILE || _proxy_logdir + '/nor-web-proxy.log';
var _proxy_user = process.env.PROXY_USER || "www-data";
var _proxy_group = process.env.PROXY_GROUP || "www-data";
var _cache = {};
var _log_stream = openLog(_proxy_log);

/* Open log file */
function openLog(logfile) {
	return fs.createWriteStream(logfile, {
		flags: "a", encoding: "utf8", mode: 0644
	});
}

/* Write log message */
function writelog(msg) {
	_log_stream.write(msg + "\n");
}

/* Get domain from hostname */
function get_domain(host) {
	if(typeof host !== 'string') {
		writelog('Warning! host is not string: ' + util.inspect(host) + " [at "+__filename+":"+ debug.__line +"]" );
	}
	host = host.split(':').shift();
	if(typeof host !== 'string') {
		writelog('Warning! host is not string: ' + util.inspect(host) + " [at "+__filename+":"+ debug.__line +"]" );
	}
	var domain = tld.registered(host);
	if(typeof domain !== 'string') {
		domain = host.split('.').filter(function(x){ return x != ''; }).slice(-2).join('.');
		writelog('Warning! tld detection failed for ' + util.inspect(host) + ', going to use ' + util.inspect(domain) );
	}
	return domain;
}

/* Get group name from domain name */
function get_group(domain) {
	if(typeof domain !== 'string') {
		writelog('Warning! domain is not string: ' + util.inspect(domain)  + " [at "+__filename+":"+ debug.__line +"]" );
	}
	return domain.replace(/\./g, '_').toLowerCase();
}

/* Get system gid by group name */
function get_gid(group) {
	if(typeof group !== 'string') {
		writelog('Warning! group is not string: ' + util.inspect(group) + " [at "+__filename+":"+ debug.__line +"]" );
	}
	var g = getent.group(group).shift();
	if(typeof g.gid !== 'number') {
		writelog('Warning! g.gid is not number: ' + util.inspect(g.gid) + " [at "+__filename+":"+ debug.__line +"]" );
	}
	return g.gid;
}

/* Get port from request data */
function get_port(req, res) {

	var host;
	
	if(typeof req.headers.host !== 'undefined') {
		host = ''+req.headers.host;
	} else {
		host = _proxy_default_hostname;
	}

	if(typeof _cache['byhost_'+host] === 'number') {
		return _cache['byhost_'+host];
	}

	var domain = get_domain(host);

	if(typeof _cache['bydomain_'+domain] === 'number') {
		return _cache['bydomain_'+domain];
	}

	var group = get_group(domain);
	var port = 7000 + get_gid(group);

	_cache['bydomain_'+domain] = port;
	_cache['byhost_'+host] = port;

	return port;
}

/** Drop privileges */
function drop_privileges() {
	try {
		if (process.getuid() === 0) {
			process.initgroups(_proxy_user, _proxy_group);
			process.setgid(_proxy_group);
			process.setuid(_proxy_user);
		}
	} catch(e) {
		writelog("Error: " + e);
		if(e.stack) { writelog("" + e.stack); }
	}
}

/* Start proxy using http-proxy module */
function start_httpProxy() {
	var httpProxy = require('http-proxy');
	var proxy = httpProxy.createProxyServer({});
	var server = http.createServer(function(req, res) {
		try {
			var port = get_port(req, res);
			var url = 'http://127.0.0.1:' + port;
			writelog('Forwarding ' + util.inspect(req.headers.host) + ' to ' + util.inspect(url) );
			proxy.web(req, res, { target: url, xfwd:true });
		} catch(e) {
			writelog("Error: " + e);
			if(e.stack) { writelog("" + e.stack); }
		}
	}).listen(_proxy_port, _proxy_host, function() {
		drop_privileges();
	});
}

/** Start a proxy using bouncy module */
function start_bouncy() {

	var bouncy = require('bouncy');
	
	var server = bouncy(function(req, res, bounce) {
		try {
			var port = get_port(req, res);
			bounce(port);
		} catch(e) {
			writelog("Error: " + e);
			if(e.stack) { writelog("" + e.stack); }
		}
	});
	server.listen(_proxy_port, _proxy_host, function() {
		drop_privileges();
	});
}

try {
	process.chdir("/");

	if(argv.bouncy) {
		start_bouncy();
	} else {
		start_httpProxy();
	}
} catch(e) {
	writelog("Error: " + e);
	if(e.stack) { writelog("" + e.stack); }
}

/* EOF */
