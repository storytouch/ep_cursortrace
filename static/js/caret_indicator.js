var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var Security = require('ep_etherpad-lite/static/js/security');

var api = require('./api');
var utils = require('./utils');
var hiddenLines = require('./hidden_lines');
var caretPosition = require('./caret_position');

var SMILEY = "&#9785;"
var INDICATOR_HEIGHT = 16;

exports.initialize = function() {
  api.startListeningToInboundMessages();
  api.setHandleGoToCaretOfUser(scrollEditorToShowCaretIndicatorOf);
}

var scrollEditorToShowCaretIndicatorOf = function(authorId) {
  var $caretIndicator = getCaretIndicatorOf(authorId);
  $caretIndicator.get(0).scrollIntoView({ behavior: 'smooth' });
}

exports.buildAndShowIndicators = function(caretLocations) {
  var users = pad.collabClient.getConnectedUsers();

  for (var i = 0; i < caretLocations.length; i++) {
    var caretLocation = caretLocations[i];
    var authorId = caretLocation.authorId;
    var line     = caretLocation.line;
    var column   = caretLocation.column;

    // Don't show our own caret
    if (pad.getUserId() === authorId) continue;

    var visibleCaretPosition = hiddenLines.getVisiblePosition(line, column);
    var position = caretPosition.getCaretPosition(visibleCaretPosition.line, visibleCaretPosition.column);
    if (position) {
      $.each(users, function(index, user) {
        if (user.userId === authorId) {
          var $indicator = buildIndicator(user, position);
          showIndicator($indicator, authorId);
          fadeOutCaretIndicator($indicator);
        }
      });
    } else {
      removeCaretOf(authorId);
    }
  }
}

var getAuthorColor = function(author) {
  var colors = pad.getColorPalette(); // support non set colors
  var color = colors[author.colorId] || author.colorId; // Test for XSS
  return color;
}

// If the name isn't set then display a smiley face
var getAuthorName = function(user) {
  return user.name ? Security.escapeHTMLAttribute(user.name) : SMILEY;
}

var buildIndicator = function(user, position) {
  // Location of stick direction IE up or down
  var location = position.top >= INDICATOR_HEIGHT ? 'stickUp' : 'stickDown';
  var color = getAuthorColor(user);
  var authorName = getAuthorName(user);
  var classes = "class='caretindicator " + location + "'";
  var timestamp = Date.now();

  // Create a new Div for this author
  var $indicator = $("<div " + classes + " timestamp="+timestamp+"><p>"+authorName+"</p></div>");
  $indicator.css({
    height:  INDICATOR_HEIGHT + "px",
    left: position.left + "px",
    top: position.top + "px",
    "background-color": color,
  });

  return $indicator;
}

var showIndicator = function($indicator, authorId) {
  var authorClassName = getAuthorClassName(authorId);
  $indicator.addClass(authorClassName);

  var $outerdoc = utils.getOuterDoc();
  // Remove all divs that already exist for this author
  $outerdoc.find("." + authorClassName).remove();

  $outerdoc.append($indicator);
}

var fadeOutCaretIndicator = function($indicator) {
  if (clientVars.ep_cursortrace.fade_out_timeout) {
    // After a while, fade it out :)
    setTimeout(function(){
      $indicator.fadeOut(500, function(){
        $indicator.remove();
      });
    }, clientVars.ep_cursortrace.fade_out_timeout);
  }
}

exports.removeCaretOf = function(authorId) {
  getCaretIndicatorOf(authorId).remove();
}
var removeCaretOf = exports.removeCaretOf;

var getCaretIndicatorOf = function(authorId) {
  var authorClassName = getAuthorClassName(authorId);
  return utils.getOuterDoc().find('.' + authorClassName);
}

/*
  Transform an authorId into a valid class name.
    - replaces '.' on the id by a '-';
    - replaces any non-numeric and non-alphabetic char into its charCode wrapped by "z";
  Example: 'a.12#45' => 'a-12z35z45'
*/
var getAuthorClassName = function(authorId) {
  var cleanedAuthorClass = (authorId || '').replace(/[^a-y0-9]/g, function(c) {
    return c === '.' ? '-': 'z' + c.charCodeAt(0) + 'z';
  });
  return 'caret-' + cleanedAuthorClass;
}
