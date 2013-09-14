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

(function (Hogan) {
  // Setup regex  assignments
  // remove whitespace according to Mustache spec
  var rIsWhitespace = /\S/,
      rQuot = /\"/g,
      rNewline =  /\n/g,
      rCr = /\r/g,
      rSlash = /\\/g;

  var trim = "".trim ? function(s){ return s.trim() } : function(s){ return s.replace(/^\s+/,'').replace(/\s+$/,''); };

  Hogan.tags = {
    '#': 1, '^': 2, '<': 3, '$': 4,
    '/': 5, '!': 6, '>': 7, '=': 8, '_v': 9,
    '{': 10, '&': 11, '_t': 12
  };

    Hogan.scan = function scan(text, delimiters) {
        var buf = '',
            tokens = [],
            seenTag = false,
            i = 0,
            lineStart = 0,
            otag = '{{',
            ctag = '}}',
            tagTypes = Hogan.tags;

        function addBuf() {
            if (buf.length > 0) {
                tokens.push({tag:'_t',text : buf });
                buf = '';
            }
        }

        function lineIsWhitespace() {
            var isAllWhitespace = true , tagTypes = Hogan.tags;
            for (var j = lineStart; j < tokens.length; j++) {
                isAllWhitespace =
                    (tagTypes[tokens[j].tag] < tagTypes['_v']) ||
                        (tokens[j].tag == '_t' && tokens[j].text.match(rIsWhitespace) === null);
                if (!isAllWhitespace) {
                    return false;
                }
            }

            return isAllWhitespace;
        }

        function filterLine(haveSeenTag, noNewLine) {
            addBuf();

            if (haveSeenTag && lineIsWhitespace()) {
                for (var j = lineStart, next; j < tokens.length; j++) {
                    if (tokens[j].text) {
                        if ((next = tokens[j+1]) && next.tag == '>') {
                            // set indent to token value
                            next.indent = tokens[j].text.toString()
                        }
                        tokens.splice(j, 1);
                    }
                }
            } else if (!noNewLine) {
                tokens.push({tag:'\n'});
            }

            seenTag = false;
            lineStart = tokens.length;
        }

        function changeDelimiters(text, index) {
            var close = '=' + ctag,
                closeIndex = text.indexOf(close, index),
                delimiters = trim(
                    text.substring(text.indexOf('=', index) + 1, closeIndex)
                ).split(' ');

            otag = delimiters[0];
            ctag = delimiters[1];

            return closeIndex + close.length - 1;
        }

        if (delimiters) {
            delimiters = delimiters.split(' ');
            otag = delimiters[0];
            ctag = delimiters[1];
        }


        var oI , cI , lastNI , nI, tagChar , tmpCTag , tmpBuf , tag , tagType;

        while( true ){
            oI = tagIndex( otag , text , i );
            if( i !== oI ){
                tmpBuf = oI === -1 ? text.substring(i) : text.substring( i , oI);
                lastNI = -1;
                while( true ){
                    nI = tmpBuf.indexOf('\n', lastNI + 1 );

                    if( nI !== -1 ){
                        buf = tmpBuf.substring( lastNI + 1 , nI );
                        filterLine(seenTag);
                        lastNI = nI;
                    }else{
                        buf = tmpBuf.substring( lastNI + 1 );
                        break;
                    }
                }

                addBuf();
            }
            if( oI === -1 ){
                filterLine(seenTag , true );
                break;
            }
            i = oI + otag.length;
            tagChar = text.charAt(i) , tag = tagTypes[ tagChar ] , tagType = tag ? tagChar : '_v';
            if( tagType === '='){
                i = changeDelimiters(text, i - 1) + 1;

                seenTag = i - 1;
            }else{
                if( tag )
                    i++;

                tmpCTag = tagType === '{' ? '}' + ctag : ctag;

                cI = tagIndex( tmpCTag , text , i );

                seenTag = i - 1;

                tokens.push({
                    tag: tagType,
                    n: trim( text.substring( i , cI ) ) ,
                    otag: otag,
                    ctag: ctag,
                    i: (tagType === '/') ? seenTag - otag.length : cI + tmpCTag.length
                });

                i = cI + tmpCTag.length;
            }

        }

        return tokens;
    };


    function tagIndex( tag , text , index ){
        return text.indexOf( tag , index );
    }

  // the tags allowed inside super templates
  var allowedInSuper = {'_t': true, '\n': true, '$': true, '/': true};

  function buildTree(tokens, i ,  kind, stack, customTags) {
    var instructions = [],
        opener = null,
        tail,
        token,
        node;

    tail = stack[stack.length - 1];

    while ( ( token = tokens[i++] ) != null ) {

      if (tail && tail.tag === '<' && !(token.tag in allowedInSuper)) {
        throw new Error('Illegal content in < super tag.');
      }

      if (Hogan.tags[token.tag] <= Hogan.tags['$'] || isOpener(token, customTags)) {
        stack.push(token);
        node = buildTree(tokens , i , token.tag, stack, customTags);
        token.nodes = node.instructions;
        i = node.next;
      } else if (token.tag === '/') {
        if (stack.length === 0) {
          throw new Error('Closing tag without opener: /' + token.n);
        }
        opener = stack.pop();
        if (token.n !== opener.n && !isCloser(token.n, opener.n, customTags)) {
          throw new Error('Nesting error: ' + opener.n + ' vs. ' + token.n);
        }
        opener.end = token.i;
        return { instructions : instructions , next : i };
      } else if (token.tag === '\n') {
        token.last = (tokens.length == 0) || (tokens[0].tag == '\n');
      }

      instructions.push(token);
    }

    if (stack.length > 0) {
      throw new Error('missing closing tag: ' + stack.pop().n);
    }

    return { instructions : instructions , next : i };
  }

  function isOpener(token, tags) {
    for (var i = 0, l = tags.length; i < l; i++) {
      if (tags[i].o === token.n) {
        token.tag = '#';
        return true;
      }
    }
  }

  function isCloser(close, open, tags) {
    for (var i = 0, l = tags.length; i < l; i++) {
      if (tags[i].c === close && tags[i].o === open) {
        return true;
      }
    }
  }

  function stringifySubstitutions(obj) {
    var items = [];
    for (var key in obj) {
      items.push('"' + esc(key) + '": function(c,p,t,i) {' + obj[key] + '}');
    }
    return "{ " + items.join(",") + " }";
  }

  function stringifyPartials(codeObj) {
    var partials = [];
    for (var key in codeObj.partials) {
      partials.push('"' + esc(key) + '":{name:"' + esc(codeObj.partials[key].name) + '", ' + stringifyPartials(codeObj.partials[key]) + "}");
    }
    return "partials: {" + partials.join(",") + "}, subs: " + stringifySubstitutions(codeObj.subs);
  }

  Hogan.stringify = function(codeObj, text, options) {
    return "{code: function (c,p,i) { " + Hogan.wrapMain(codeObj.code.join('')) + " }," + stringifyPartials(codeObj) +  "}";
  }

  var serialNo = 0;
  Hogan.generate = function(tree, text, options) {
    serialNo = 0;
    var context = { code: [], subs: {}, partials: {} };
    Hogan.walk(tree, context);

    if (options.asString) {
      return this.stringify(context, text, options);
    }

    return this.makeTemplate(context, text, options);
  }

  Hogan.wrapMain = function(code) {
    return 'var t=this;t.b(i=i||"");' + code + 'return t.fl();';
  }

  Hogan.template = Hogan.Template;

  Hogan.makeTemplate = function(codeObj, text, options) {
    var template = this.makePartials(codeObj);
    template.code = new Function('c', 'p', 'i', this.wrapMain(codeObj.code.join('')));
    return new this.template(template, text, this, options);
  }

  Hogan.makePartials = function(codeObj) {
    var key, template = {subs: {}, partials: codeObj.partials, name: codeObj.name};
    for (key in template.partials) {
      template.partials[key] = this.makePartials(template.partials[key]);
    }
    for (key in codeObj.subs) {
      template.subs[key] = new Function('c', 'p', 't', 'i', codeObj.subs[key]);
    }
    return template;
  }

  function esc(s) {
    return s.replace(rSlash, '\\\\')
            .replace(rQuot, '\\\"')
            .replace(rNewline, '\\n')
            .replace(rCr, '\\r');
  }

  function chooseMethod(s) {
    return (~s.indexOf('.')) ? 'd' : 'f';
  }

  function createPartial(node, context) {
    var prefix = "<" + (context.prefix || "");
    var sym = prefix + node.n + serialNo++;
    context.partials[sym] = {name: node.n, partials: {}};
    context.code.push('t.b(t.rp("' +  esc(sym) + '",c,p,"' + (node.indent || '') + '"));');
    return sym;
  }

  Hogan.codegen = {
    '#': function(node, context) {
      context.code.push('if(t.s(t.' + chooseMethod(node.n) + '("' + esc(node.n) + '",c,p,1),' +
                      'c,p,0,' + node.i + ',' + node.end + ',"' + node.otag + " " + node.ctag + '")){' +
                      't.rs(c,p,' + 'function(c,p,t){');
      Hogan.walk(node.nodes, context);
      context.code.push('});c.pop();}');
    },

    '^': function(node, context) {
      context.code.push('if(!t.s(t.' + chooseMethod(node.n) + '("' + esc(node.n) + '",c,p,1),c,p,1,0,0,"")){');
      Hogan.walk(node.nodes, context);
      context.code.push('};');
    },

    '>': createPartial,
    '<': function(node, context) {
      var ctx = {partials: {}, code: [] , subs: {}, inPartial: true};
      Hogan.walk(node.nodes, ctx);
      var template = context.partials[createPartial(node, context)];
      template.subs = ctx.subs;
      template.partials = ctx.partials;
    },

    '$': function(node, context) {
      var ctx = {subs: {}, code: [], partials: context.partials, prefix: node.n};
      Hogan.walk(node.nodes, ctx);
      context.subs[node.n] = ctx.code.join('');
      if (!context.inPartial) {
        context.code.push('t.sub("' + esc(node.n) + '",c,p,i);');
      }
    },

    '\n': function(node, context) {
      context.code.push(write('"\\n"' + (node.last ? '' : ' + i')));
    },

    '_v': function(node, context) {
      context.code.push('t.b(t.v(t.' + chooseMethod(node.n) + '("' + esc(node.n) + '",c,p,0)));');
    },

    '_t': function(node, context) {
      context.code.push(write('"' + esc(node.text) + '"'));
    },

    '{': tripleStache,

    '&': tripleStache
  }

  function tripleStache(node, context) {
    context.code.push('t.b(t.t(t.' + chooseMethod(node.n) + '("' + esc(node.n) + '",c,p,0)));');
  }

  function write(s) {
    return 't.b(' + s + ');';
  }

  Hogan.walk = function (nodelist, context) {
    var func;
    for (var i = 0, l = nodelist.length; i < l; i++) {
      func = Hogan.codegen[nodelist[i].tag];
      func && func(nodelist[i], context);
    }
    return context;
  }

  Hogan.parse = function(tokens, text, options) {
    options = options || {};
    return buildTree(tokens, 0 ,'', [], options.sectionTags || []).instructions;
  },

  Hogan.cache = {};

  Hogan.cacheKey = function(text, options) {
    return [text, !!options.asString, !!options.disableLambda].join('||');
  },

  Hogan.compile = function(text, options) {
    options = options || {};
    var key = Hogan.cacheKey(text, options);
    var template = this.cache[key];

    if (template) {
      return template;
    }

    template = this.generate(this.parse(this.scan(text, options.delimiters), text, options), text, options);
    return this.cache[key] = template;
  };
})(typeof exports !== 'undefined' ? exports : Hogan);
