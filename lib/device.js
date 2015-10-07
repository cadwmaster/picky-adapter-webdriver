
/*!
 * Picky Adapter WebDriver
 * @license MIT
 */

/*
 * Module dependencies
 */

var wd = require('wd');
var extend = require('picky-utils').extend;
var debuglog = util.debuglog('PICKY-ADAPTER');

/*
 * Module variables
 */

var defaultService = 'localhost';

/*
 * Module
 */

function Device (Picky, runner, suite, options) {
  var me = this;
  var serviceName = options.service || defaultService;
  if (me.services) me.services = {};

  options = extend({
    service: defaultService
  }, me.services[serviceName] || {}, suite.options.services[serviceName] || {}, options);

  // serviceUser

  if (options.serviceUser) {
    options.username = options.serviceUser;
    delete options.serviceUser;
  }

  // servicePass

  if (options.servicePass) {
    options.accessKey = options.servicePass;
    delete options.servicePass;
  }

  me.options = options;
}

Device.prototype.start = function (done) {
  var me = this;

  if ('localhost' === me.options.service) {
    me.options.hostname = me.serverOptions.host;
    me.options.port = me.serverOptions.port;

    var server = this.createServer();

    server.on('exit', function(code) {
      process.exit(code);
    });

    server.stdout.on('data', function (data) {
      debuglog('stdout: ' + data);
    });

    server.stderr.on('data', function (data) {
      debuglog('stderr: ' + data);
    });

    server.on('close', function (code) {
      debuglog('child process exited with code ' + code);
    });

    me.server = server;
  }

  me.emulator = wd.remote(me.options, 'promiseChain');

  function boot () {
    me.emulator.status(function (err) {
      if (err) return setTimeout(boot, 200);
      return me.emulator
        .init(me.options)
        .sessionCapabilities()
        .setImplicitWaitTimeout(10)
        .then(done);
    });
  }

  boot();
}

Device.prototype.stop = function (done) {
  var me = this;
  me.emulator.quit(function (err) {
    if (err) return done(err);
    // if (process.env.SAUCE) return driver.sauceJobStatus(allPassed);
    if (me.server) me.server.kill('SIGKILL');
    done();
  });
}

/*
 * Module exports
 */

module.exports = Device;
