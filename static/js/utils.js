var $ = require('ep_etherpad-lite/static/js/rjquery').$;

var utils = {
  getPadOuter: function() {
    this.padOuter = this.padOuter || $('iframe[name="ace_outer"]').contents();
    return this.padOuter;
  },

  getPadInner: function() {
    this.padInner = this.padInner || this.getPadOuter().find('iframe[name="ace_inner"]').contents();
    return this.padInner;
  },

  getOuterDoc: function() {
    this.$outerDocBody = this.$outerDocBody || this.getPadOuter().find("#outerdocbody");
    return this.$outerDocBody;
  },

  getLineOnEditor: function(lineNumber) {
    // +1 as Etherpad line numbers start at 0
    var nthChild = lineNumber + 1;
    return this.getPadInner().find('#innerdocbody > div:nth-child(' + nthChild + ')');
  },
}

exports.initialize = function() {
  return utils;
}
