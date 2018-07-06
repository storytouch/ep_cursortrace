var $ = require('ep_etherpad-lite/static/js/rjquery').$;

// Easier access to outer pad
var padOuter;
exports.getPadOuter = function() {
  padOuter = padOuter || $('iframe[name="ace_outer"]').contents();
  return padOuter;
}

// Easier access to inner pad
var padInner;
exports.getPadInner = function() {
  padInner = padInner || exports.getPadOuter().find('iframe[name="ace_inner"]').contents();
  return padInner;
}

// Easier access to outer doc body
var $outerDocBody;
exports.getOuterDoc = function() {
  $outerDocBody = $outerDocBody || exports.getPadOuter().find("#outerdocbody");
  return $outerDocBody;
}
