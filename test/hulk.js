var exec   = require('child_process').exec
  , assert = require('assert')
  , Hogan  = require('../lib/hogan.js');


// help text
exec('node bin/hulk', function (error, stdout, stderr) {
  if (error) throw error;
  assert(typeof stdout == 'string', 'it should have help text.');
  assert(/USAGE/.test(stdout), 'has USAGE text');
  assert(/NOTE/.test(stdout), 'has NOTE text about wildcard');
})

// templates wildcard
exec('node bin/hulk test/templates/*', function (error, stdout, stderr) {
  if (error) throw error;
  eval(stdout);
  assert(typeof templates        == 'object', 'defineed a templates object');
  assert(typeof templates.list   == 'object', 'defined a templates.list object');
  assert(typeof templates.list.r == 'function', 'defined a templates.list.r function');
  assert(templates.list.r() == '<ul>\n<li></li>\n<li></li>\n<li></li>\n<li></li>\n<li></li>\n<li></li>\n</ul>')
});

// templates wildcard w/ extension
exec('node bin/hulk test/templates/*.mustache', function (error, stdout, stderr) {
  if (error) throw error;
  eval(stdout);
  assert(typeof templates        == 'object', 'defineed a templates object');
  assert(typeof templates.list   == 'object', 'defined a templates.list object');
  assert(typeof templates.list.r == 'function', 'defined a templates.list.r function');
  assert(templates.list.r() == '<ul>\n<li></li>\n<li></li>\n<li></li>\n<li></li>\n<li></li>\n<li></li>\n</ul>')
});

// templates single file
exec('node bin/hulk test/templates/list.mustache', function (error, stdout, stderr) {
  if (error) throw error;
  eval(stdout);
  assert(typeof templates        == 'object', 'defineed a templates object');
  assert(typeof templates.list   == 'object', 'defined a templates.list object');
  assert(typeof templates.list.r == 'function', 'defined a templates.list.r function');
  assert(templates.list.r() == '<ul>\n<li></li>\n<li></li>\n<li></li>\n<li></li>\n<li></li>\n<li></li>\n</ul>')
});