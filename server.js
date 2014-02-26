#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var io;
var server;
var WebSocketServer = require('ws').Server;
var wss;
var wscon = [];
var last5 = [];
var url = require('url');


/**
 *  Define the sample application.
 */
var MainApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT | 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
			for (var i = 0; i < wscon.length; i++)
			{
				wscon[i].send("New Connection");
			}
            res.send(self.cache_get('index.html') );
        };
		
		self.routes['/api'] = function(req,res) {
			var url_parts = url.parse(req.url, true);
			var query = url_parts.query;
			var data = "{\"address\":\""+req.query.address+"\",\"amount\":\""+req.query.amount+"\"}";
			last5.push(data);
			if(last5.length > 5)
				last5.splice(0,1);
				
			for (var i = 0; i < wscon.length; i++)
			{
				wscon[i].send(data);
			}
			
			  res.setHeader('Content-Type', 'text/html');
			  res.send("ok");
		};
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express();

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }
    };
	
    /**
     *  Initializes
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
	 server = require('http').createServer(self.app);
	 server.listen(self.port,self.ipaddress);
	 
	  wss = new WebSocketServer({server:server});
		
		//TODO: Verify that wss was initialized correctly. 
		
	wss.on('connection',function(ws) {
			wscon.push(ws); //Add Client to the array. We do not need this.
							//We should have multiple communication types and add user to said array.
							//Websocket keeps track of all connect clients. 
			ws.on('message', function(message) {
			console.log('received: %s', message);
			var res = JSON.parse(message);
			
			if(res.message == "getLast5")
			{
				for (var i = 0; i < last5.length; i++)
				{
					ws.send(last5[i]);
				}
			}
			
			});
		
			ws.onclose = function() {
			var num = -1;
			var oldCount = wscon.length;
			for(var i = 0; i < wscon.length; i++)
			{
				if(wscon[i] == ws)
					num = i; 
			}
			
			if(num > -1)
				wscon.splice(num,1);
			
			var newcount = wscon.length;
			
			for (var i = 0; i < wscon.length; i++)
			{
				wscon[i].send("Lost Connection: " + oldCount + ":"+newcount);
			}
};
			});
		
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
    };

}; 



/**
 *  main():  Main code.
 */
var zapp = new MainApp();
zapp.initialize();
zapp.start();

