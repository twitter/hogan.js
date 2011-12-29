#!/usr/bin/env node
/*
 * Compiles Hogan templates and prints result to stdout
 */

var hogan = require('../lib/hogan'),
    path = require('path'),
    fs = require('fs');

// we assume that argv[2] is a list of files, or a directory
// that contains mustache templates
var argv = process.argv.slice(2);

var output = [];


argv.map(function(filePath) {
    var fullPath = path.resolve(__dirname, filePath),
        openedFile = fs.readFileSync(fullPath, 'utf-8'),
        name = path.basename(filePath, '.mustache');
    if (openedFile) {
        output.push("'" + name + "': " + hogan.compile(openedFile, {asString:true}));
    }
});

process.stdout.write('var HoganTemplates = {' + output.join(',\n') + '};\n');

process.exit(0);