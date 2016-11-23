/**
 *  Express 3.x support.
 *  usage : adding line in Hogan.js
 *
 *  Hogan = require('./express')(Hogan);
 */
var fs = require('fs');

module.exports = function (Hogan) {
  if (typeof Hogan === 'undefined'
    || typeof Hogan.scan === 'undefined'
    || typeof Hogan.parse === 'undefined'
    || typeof Hogan.generate === 'undefined') {
      throw new Error('please, require Hogan!');
  }

  Hogan.fcache = {};

  Hogan.fcompile = function (path, options) {
    options = options || {};
    options.filename = path;

    var key = path + ':string';

    if (options.cache && Hogan.fcache[key]) {
      return Hogan.fcache[key];
    }
   
      var text = fs.readFileSync(path, 'utf8');

    try { 
      var rt = Hogan.generate(Hogan.parse(Hogan.scan(text, options.delimiters), text, options), text, options);
    } catch (error) {
      throw new Error('missing read template file : '+path);
    }

    return options.cache ? Hogan.cache[key] = rt : rt;
  };

  Hogan.renderFile = function (path, options, fn) {
    try {
      fn(null, Hogan.fcompile(path,options).render(options));
    } catch (error) {
      fn(error);
    }
  };

  Hogan.__express = Hogan.renderFile;

  return Hogan;
}
