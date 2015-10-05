
/*!
 * Picky Adapter WebDriver
 * @license MIT
 */

/*
 * Module dependencies
 */

var inherits = require('util').inherits;
var loadAll = require('picky-utils').loadAll;
var extend = require('picky-utils').extend;
var forEachSeries = require('picky-utils').forEachSeries;

/*
 * Module variables
 */

var defaultConfig = {
  env: 'local',
  timeout: 300000
};

/*
 * Module
 */

function plugin (initConfig) {

  return function (Picky, runner, suite) {
    var options = extend({}, defaultConfig, suite.options[initConfig.name]);
    var envOptions = options[suite.options.env] || {};
    var dirname = initConfig.dirname;
    var dictionaries = loadAll(dirname, './dictionaries');
    var libraries = loadAll(dirname, './libraries');
    var devices = envOptions.devices || {};

    var ctx = {
      Device: Device,
      devices: []
    };

    ctx.dictionary = Picky.feature.dictionary(initConfig.name);
    ctx.library = Picky.feature.library(initConfig.name, ctx.dictionary);
    ctx.devices.each = forEachSeries(ctx.devices);

    Object.keys(dictionaries).forEach(function (name) {
      dictionaries[name](Picky, ctx, runner, suite);
    });

    Object.keys(libraries).forEach(function (name) {
      libraries[name](Picky, ctx, runner, suite);
    });

    // before

    before(function (done) {
      this.steps[initConfig.name] = ctx;

      this.timeout(options.timeout);

      // Load the choosen devices
      forEachSeries(suite.options.devices, function (device, next) {
        var opts = devices[device];
        if (!opts) throw Error('Device not defined');
        // opts = extend({
        //   // env: suite.options.env,
        //   browserName: 'phantomjs'
        // }, opts);
        new ctx.Device(Picky, runner, suite, opts).start(next);
      }, done);
    });

    // after

    after(function (done) {
      if (!ctx.devices.length) return done();
      ctx.devices.each(function (device, next) {
        device.stop(next);
      }, done);
    });

    function Device () {
      initConfig.Device.apply(this, arguments);
      ctx.devices.push(this);
    }
    inherits(Device, initConfig.Device);

    return ctx.library;
  }
}

/*
 * Module exports
 */

module.exports = plugin;
