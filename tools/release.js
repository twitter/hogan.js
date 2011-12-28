/*
 *  Copyright 2011 Twitter, Inc.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

var fs = require('fs');
var path = require('path');
var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;

var packageJSON = JSON.parse(fs.readFileSync('package.json').toString());

// Figure out what version we have.
var version = packageJSON.version;

// Should have something like N.N.N-dev
var versionNumbers = version.substring(0, version.indexOf('-')).split('.');

// Check to see whether a build already exists in the web directory
var target = __dirname + '/../web/builds/' + versionNumbers.join('.');
if (path.existsSync(target)) {
  throw new Error('target directory ' + target + ' already exists.');
}

// Hogan release version
var release = path.normalize(target + '/hogan.js');

// Good enough for little js files
function copy(target, dest) {
  return fs.writeFileSync(dest, fs.readFileSync(target).toString());
}

// Create the directory
fs.mkdirSync(target, 0755);

// Copy hogan.js over
copy(__dirname + '/../lib/hogan.js', release);

// Uglify the source
var orig_code = fs.readFileSync(release).toString();
var ast = jsp.parse(orig_code); // parse code and get the initial AST
ast = pro.ast_mangle(ast); // get a new AST with mangled names
ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
var final_code = pro.gen_code(ast); // compressed code here
var minified = path.dirname(release) + '/hogan.min.js';
fs.writeFileSync(minified, final_code);

// drop package.json into the web directory with a non-dev version
packageJSON.version = versionNumbers.join('.');
fs.writeFileSync(__dirname + '/../web/' + 'package.json', JSON.stringify(packageJSON, null, ' '));