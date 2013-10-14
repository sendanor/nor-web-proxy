#!/usr/bin/env node
/* */
var util = require('util');
var proxy_dir = process.env.VARDIR || '/var';
var proxy_rundir = process.env.RUNDIR || proxy_dir+'/run';
var proxy_pid = process.env.PIDFILE || proxy_rundir + '/node-proxy.pid';

var daemon = require("daemonize2").setup({
	main: __dirname + "/app.js",
	name: "nor-web-proxy",
	pidfile: proxy_pid,
    silent: true
});

switch (process.argv[2]) {
	case "start": 
		daemon.start().once("error", function(error) {
			util.error("Error: " + error);
		}).once("started", function() {
			process.exit();
		});
		break;
	case "stop":
		daemon.stop();
		break;

	case "status":
		var pid = daemon.status();
		if(pid === 0) {
			console.log("Not running.");
		} else {
			console.log("Running with pid " + pid);
		}
		break;

	default:
		console.log("Usage: [start|stop]");
}

/* EOF */
