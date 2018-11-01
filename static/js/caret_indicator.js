var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var Security = require('ep_etherpad-lite/static/js/security');

var colors = require('./colors');
var hiddenLines = require('./hidden_lines');
var caretPosition = require('./caret_position');

var SMILEY = '&#9785;'
var CARET_INDICATOR_CLASS = 'caretindicator'
// If you change value of INDICATOR_HEIGHT, you also need to change the values on CSS
var INDICATOR_HEIGHT = 15;

exports.initialize = function() {
  return new caretIndicator();
}

var caretIndicator = function() {
  this.myAuthorId = pad.getUserId();
  this.thisPlugin = pad.plugins.ep_cursortrace;
  // map userId => colorName. Ex: { 'a.G1RIWyGaHlXbbYi9' : 'A8' }
  this.usersColors = {};

  var api = this.thisPlugin.api;
  api.setHandleOnGoToCaretOfUser(this.scrollEditorToShowCaretIndicatorOf.bind(this));
  api.onUsersColorsChange(this.setUsersColors.bind(this));
}

caretIndicator.prototype.scrollEditorToShowCaretIndicatorOf = function(authorId) {
  // we don't render the caret indicator of ourselves, so we need to use the
  // line on padInner as reference
  var $target = (authorId === this.myAuthorId) ? this._getMyCurrentLine() : this._getCaretIndicatorOf(authorId);
  $target.get(0).scrollIntoView({ behavior: 'smooth' });

  // if user needs to click out of editor (padInner) to trigger the scroll to caret of target author,
  // the editor will lose focus, so user cannot start typing right away.
  // Force focus to be on editor to avoid that.
  this._makeSureEditorHasTheFocus();
}

caretIndicator.prototype._makeSureEditorHasTheFocus = function() {
  this.thisPlugin.utils.getPadOuter().find('iframe[name="ace_inner"]').get(0).contentWindow.focus();
}

caretIndicator.prototype._getMyCurrentLine = function() {
  var myCurrentLocation = this.thisPlugin.caretLocationManager.getMyCurrentCaretLocation();
  var $myCurrentLine = this.thisPlugin.utils.getLineOnEditor(myCurrentLocation.line);
  return $myCurrentLine;
}

caretIndicator.prototype.setUsersColors = function(usersColors) {
  this.usersColors = usersColors;
  this._updateColorsOfCurrentIndicators();
}

caretIndicator.prototype._updateColorsOfCurrentIndicators = function() {
  var self = this;
  var $caretIndicator = this._getOuterDoc().find('.' + CARET_INDICATOR_CLASS);

  $caretIndicator.each(function() {
    var $caretIndicator = $(this);
    self._setColorOf($caretIndicator);
  });
}

caretIndicator.prototype._setColorOfTextOfCaretIndicator = function($indicator) {
  var userColorName = this._getUserColorName($indicator);
  if (colors.isColorLight(userColorName)) {
    $indicator.addClass('light-bg');
  }
}

caretIndicator.prototype.buildAndShowIndicators = function(caretLocations) {
  var self = this;
  var users = pad.collabClient.getConnectedUsers();

  for (var i = 0; i < caretLocations.length; i++) {
    var caretLocation = caretLocations[i];
    var authorId = caretLocation.authorId;
    var line     = caretLocation.line;
    var column   = caretLocation.column;

    // Don't show our own caret
    if (self.myAuthorId === authorId) continue;

    var visibleCaretPosition = hiddenLines.getVisiblePosition(line, column);
    var position = caretPosition.getCaretPosition(visibleCaretPosition.line, visibleCaretPosition.column);
    if (position) {
      $.each(users, function(index, user) {
        if (user.userId === authorId) {
          var $indicator = self._buildIndicator(user, position);
          self._showIndicator($indicator, authorId);
          self._fadeOutCaretIndicator($indicator);
        }
      });
    } else {
      self.removeCaretOf(authorId);
    }
  }
}

// If the name isn't set then display a smiley face
caretIndicator.prototype._getAuthorName = function(user) {
  return user.name ? Security.escapeHTMLAttribute(user.name) : SMILEY;
}

caretIndicator.prototype._buildIndicator = function(user, position) {
  // Location of stick direction IE up or down
  var location = position.top >= INDICATOR_HEIGHT ? 'stickUp' : 'stickDown';
  var authorName = this._getAuthorName(user);
  var author = '<div class="name"><p>' + authorName + '</p></div>'
  var classes = 'class="' + CARET_INDICATOR_CLASS + ' ' + location + '"';
  var timestamp = 'timestamp="' + Date.now() + '"';

  // Create a new Div for this author
  var $indicator = $('<div ' + classes + ' ' + timestamp + '>' + author + '</div>');
  $indicator.data('user_id', user.userId);
  $indicator.css({
    left: position.left + 'px',
    top: (position.top - INDICATOR_HEIGHT) + 'px',
  });
  this._setColorOf($indicator);
  return $indicator;
}

caretIndicator.prototype._setColorOf = function($indicator) {
  var color = this._getAuthorColor($indicator);
  $indicator.css({
    color: color,
  });
  this._setColorOfTextOfCaretIndicator($indicator);
}

caretIndicator.prototype._getUserColorName = function($indicator) {
  var userId = $indicator.data('user_id');
  return this.usersColors[userId];
}

caretIndicator.prototype._getAuthorColor = function($indicator) {
  var userColorName = this._getUserColorName($indicator);
  return colors.getColorHash(userColorName);
}

caretIndicator.prototype._showIndicator = function($indicator, authorId) {
  var authorClassName = this._getAuthorClassName(authorId);
  $indicator.addClass(authorClassName);

  var $outerdoc = this._getOuterDoc();
  // Remove all divs that already exist for this author
  $outerdoc.find('.' + authorClassName).remove();

  $outerdoc.append($indicator);
}

caretIndicator.prototype._fadeOutCaretIndicator = function($indicator) {
  var settings = clientVars.ep_cursortrace;

  if (settings.fade_out_timeout) {
    setTimeout(function(){
      $indicator.fadeOut(500, function(){
        $indicator.remove();
      });
    }, settings.fade_out_timeout);
  } else if (settings.fade_out_name_timeout) {
    // we use CSS animations to show/hide author name
    var hideAuthorName = function() { $indicator.addClass('no-name') };
    var showAuthorName = function() { $indicator.removeClass('no-name') };

    // fade name after a while...
    setTimeout(hideAuthorName, settings.fade_out_name_timeout);
    // ... and show it again while mouse is over
    $indicator.on('mouseenter', showAuthorName).on('mouseleave', hideAuthorName);
  }
}

caretIndicator.prototype.removeCaretOf = function(authorId) {
  this._getCaretIndicatorOf(authorId).remove();
}

caretIndicator.prototype._getCaretIndicatorOf = function(authorId) {
  var authorClassName = this._getAuthorClassName(authorId);
  return this._getOuterDoc().find('.' + authorClassName);
}

/*
  Transform an authorId into a valid class name.
    - replaces '.' on the id by a '-';
    - replaces any non-numeric and non-alphabetic char into its charCode wrapped by "z";
  Example: 'a.12#45' => 'a-12z35z45'
*/
caretIndicator.prototype._getAuthorClassName = function(authorId) {
  var cleanedAuthorClass = (authorId || '').replace(/[^a-y0-9]/g, function(c) {
    return c === '.' ? '-': 'z' + c.charCodeAt(0) + 'z';
  });
  return 'caret-' + cleanedAuthorClass;
}

caretIndicator.prototype._getOuterDoc = function() {
  if (!this.$outerdoc) {
    this.$outerdoc = pad.plugins.ep_cursortrace.utils.getOuterDoc();
  }
  return this.$outerdoc;
}
