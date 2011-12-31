var Hogan = Hogan || require('../lib/hogan');

var Mustache = (function () {
  return {
    to_html: function(text, data, partials, sendFun) {
      var template = Hogan.compile(text);
      return template.render(data, partials);
    }
  };
})();

// Export the hogan constructor for Node.js and CommonJS.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Mustache;
} else if (typeof exports !== 'undefined') {
  exports.Mustache = Mustache;
}