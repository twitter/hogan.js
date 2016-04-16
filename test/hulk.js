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

// wrapper options: --wrapper node
exec('node bin/hulk --wrapper node test/templates/*', function (error, stdout, stderr) {
  if (error) throw error;
  eval(stdout);
  function test(templates) {
    template = templates['list'];
    assert(template, 'template named list is defined');
    assert(typeof template   == 'object', 'defined a templates.list object');
    assert(typeof template.r == 'function', 'defined a templates.list.r function');
  }
  test(module.exports);
  test(global.templates);
});

// wrapper options: --outputdir foo/dist
exec('node bin/hulk --outputdir foo/dist test/templates/*', function (error, stdout, stderr) {
  if (error) throw error;
  assert(fs.existsSync('foo/dist'), 'foo/dist directory created');
  assert(fs.existsSync('foo/dist/list.js'), 'foo/dist/list.js file created');
  rimraf.sync('foo');
});

// wrapper options: --outputdir bar/dist --wrapper node
exec('node bin/hulk --outputdir bar/dist --wrapper node test/templates/list.mustache', function (error, stdout, stderr) {
  if (error) throw error;
  assert(fs.existsSync('bar/dist'), 'bar/dist directory created');
  assert(fs.existsSync('bar/dist/list.js'), 'bar/dist/list.js file created');

  var template;
  templateContents = fs.readFileSync('bar/dist/list.js', 'utf-8');
  eval(templateContents);

  template = module.exports;
  assert(template, 'template named list is defined');
  assert(typeof template   == 'object', 'defined a templates.list object');
  assert(typeof template.r == 'function', 'defined a templates.list.r function');

  template = global.templates['list'];
  assert(template, 'template named list is defined');
  assert(typeof template   == 'object', 'defined a templates.list object');
  assert(typeof template.r == 'function', 'defined a templates.list.r function');

  rimraf.sync('bar');
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