#!/usr/bin/env node
/* */
var proxy_dir = process.env.VARDIR || '/var';
var proxy_logdir = process.env.LOGDIR || proxy_dir+'/log';
var proxy_rundir = process.env.RUNDIR || proxy_dir+'/run';
var proxy_pid = process.env.PIDFILE || proxy_rundir + '/node-proxy.pid';

var daemon = require("daemonize2").setup({
	main: __dirname + "/app.js",
	name: "node-proxy",
	pidfile: proxy_pid
});

switch (process.argv[2]) {
	case "start": 
		daemon.start().once("started", function() {
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
