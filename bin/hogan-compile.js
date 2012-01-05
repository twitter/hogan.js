#!/usr/bin/env node
/*
 * Compiles Hogan templates and prints result to stdout 
 */
 var hogan = require('../lib/hogan.js'),
     path = require('path'),
     fs = require('fs');

function processArgs( argv ) {
  var args = {}, i;
  for ( i = 0; i < argv.length; i++ ) {
    if ( argv[i].charAt( 0 ) === '-' ) {
      args[ argv[i] ] = argv[++i];
      continue;
    }
    break;
  }
  if ( i < argv.length ) {
    args[ 'templatefiles' ] = argv.slice(i);
  }
  return Object.keys( args ).length > 0 ? args : false;
}

function checkArgs( args ) {
  usage = 'Usage: hogan-compile.js (-td <template-directory>) (-ext <template-extension>) template files\n' +
          '  example: hogan-compile.js templates/*.mustache\n' +
          '  example: hogan-compile.js -td templates';
  
  if ( !args ) {
    process.stderr.write( usage );
    process.exit(-1);
  }

  var templatePath  = args['-td'],
      templateExt   = args['-ext'] || '.mustache'
      templateFiles = args['templatefiles'];
  
  if ( !templatePath && !templateFiles ) {
    process.stderr.write( "A template directory or template files wasn't specified.\n" );
    process.stderr.write( usage );
    process.exit(-1);
  } 
  if ( templatePath ) {
    if ( !path.existsSync( templatePath ) ) {
      process.stderr.write( "template directory '" + templatePath + "' doesn't exists\n" );
      process.stderr.write( usage );
      process.exit(-1);
    }
    templateFiles = fs.readdirSync( templatePath ).map( function( f ) { return path.join( templatePath, f ) } );
  }
  return { templateExt : templateExt, templateFiles : templateFiles };
}

function hasExtension( file, extension ) {
  return file.indexOf(extension, file.length - extension.length) !== -1;
}

function removeByteOrderMark( text ) {
  // Remove utf-8 byte order mark, http://en.wikipedia.org/wiki/Byte_order_mark
  if ( text.charCodeAt( 0 ) === 0xfeff ) {   
    return text.substring( 1 );
  }
  return text;
}
var args = checkArgs( processArgs( process.argv.slice(2) ) );

console.log( 'var templates = {}' );
// Write a template foreach file that macthes template extension
args.templateFiles.forEach( function(file) {

  if ( hasExtension( file, args.templateExt ) ) {
    var openedFile = fs.readFileSync(file, 'utf-8');
    
    if (openedFile) { 
      var name = path.basename(file, args.templateExt),
          templateName = 'templates.' + name,
          compiledName = templateName + '_c';
      
      openedFile = removeByteOrderMark( openedFile.trim() );
           
      console.log( compiledName + ' = ' + hogan.compile(openedFile, {asString: true}) + ';' );
      console.log( templateName + ' = new Hogan.Template( '+ compiledName + ', "' + name + '" );' );
    }
  }
} );