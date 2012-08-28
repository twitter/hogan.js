var exec   = require('child_process').exec
  , assert = require('assert')
  , fs     = require('fs')
  , rimraf = require('rimraf')
  , path   = require('path')
  , Hogan  = require('../lib/hogan.js');


// help text
exec('node bin/hulk', function (error, stdout, stderr) {
  if (error) throw error;
  assert(typeof stdout == 'string', 'it should have help text.');
  assert(/USAGE/.test(stdout), 'has USAGE text');
  assert(/NOTE/.test(stdout), 'has NOTE text about wildcard');
});

// wrapper options: --wrapper amd
exec('node bin/hulk --wrapper amd test/templates/*', function (error, stdout, stderr) {
  if (error) throw error;
  var define = function (name, dep, template) {
    template = template(Hogan);
    assert(/list$/.test(name), 'name path ends in list');
    assert(dep[0] === 'hogan.js', 'Make sure the "hogan" dependency is passed');
    assert(typeof template   == 'object', 'defined a templates.list object');
    assert(typeof template.r == 'function', 'defined a templates.list.r function');
  };
  eval(stdout);
});

// wrapper options: --outputdir
exec('node bin/hulk --outputdir dist/foo test/templates/*', function (error, stdout, stderr) {
  if (error) throw error;
  assert(fs.existsSync('dist/foo'), 'dist/foo directory created');
  assert(fs.existsSync('dist/foo/list.js'), 'dist/foo/list.js file created');
  rimraf.sync('dist');
});

// templates wildcard
exec('node bin/hulk test/templates/*', function (error, stdout, stderr) {
  if (error) throw error;
  eval(stdout);
  assert(typeof templates        == 'object', 'defineed a templates object');
  assert(typeof templates.list   == 'object', 'defined a templates.list object');
  assert(typeof templates.list.r == 'function', 'defined a templates.list.r function');
  assert(templates.list.r() == '<ul>\n<li></li>\n<li></li>\n<li></li>\n<li></li>\n<li></li>\n<li></li>\n</ul>');
});

// templates wildcard w/ extension
exec('node bin/hulk test/templates/*.mustache', function (error, stdout, stderr) {
  if (error) throw error;
  eval(stdout);
  assert(typeof templates        == 'object', 'defineed a templates object');
  assert(typeof templates.list   == 'object', 'defined a templates.list object');
  assert(typeof templates.list.r == 'function', 'defined a templates.list.r function');
  assert(templates.list.r() == '<ul>\n<li></li>\n<li></li>\n<li></li>\n<li></li>\n<li></li>\n<li></li>\n</ul>');
});

// templates single file
exec('node bin/hulk test/templates/list.mustache', function (error, stdout, stderr) {
  if (error) throw error;
  eval(stdout);
  assert(typeof templates        == 'object', 'defineed a templates object');
  assert(typeof templates.list   == 'object', 'defined a templates.list object');
  assert(typeof templates.list.r == 'function', 'defined a templates.list.r function');
  assert(templates.list.r() == '<ul>\n<li></li>\n<li></li>\n<li></li>\n<li></li>\n<li></li>\n<li></li>\n</ul>');
});