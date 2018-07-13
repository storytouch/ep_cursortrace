var LINE_CHANGED_EVENT = require('ep_comments_page/static/js/utils').LINE_CHANGED_EVENT;
var utils = require('./utils');
var caretIndicator = require('./caret_indicator');
var caretLocationManager = require('./caret_location_manager');
var hideCaretsOnDisabledEditor = require('./hide_carets_on_disabled_editor');

var TIME_TO_UPDATE_CARETS_POSITION = 500;
var initiated = false;

exports.postAceInit = function(hook_name, args, cb) {
  initiated = true;

  pad.plugins = pad.plugins || {};
  pad.plugins.ep_cursortrace = pad.plugins.ep_cursortrace || {};
  pad.plugins.ep_cursortrace.timeToUpdateCaretPosition = TIME_TO_UPDATE_CARETS_POSITION;

  hideCaretsOnDisabledEditor.initialize();
  caretIndicator.initialize();
  showCaretOfAuthorsAlreadyOnPad();
  updateCaretsWhenAnUpdateMightHadAffectedTheirPositions();
};

var showCaretOfAuthorsAlreadyOnPad = function() {
  caretLocationManager.activatePendingCaretLocations();
  var caretLocations = caretLocationManager.getCaretLocations();
  caretIndicator.buildAndShowIndicators(caretLocations);
}

var buildAndShowIndicatorsAfterLine = function(lineNumber) {
  var caretLocations = caretLocationManager.getCaretLocationsAfterLine(lineNumber);
  caretIndicator.buildAndShowIndicators(caretLocations);
}

var updateCaretsWhenAnUpdateMightHadAffectedTheirPositions = function() {
  utils.getPadInner().on(LINE_CHANGED_EVENT, function(e, data) {
    var lineOfChange = data.lineNumber;
    setTimeout(function() {
      buildAndShowIndicatorsAfterLine(lineOfChange);
    }, pad.plugins.ep_cursortrace.timeToUpdateCaretPosition);
  });
}

exports.aceEditEvent = function(hook_name, args, cb) {
  if (!initiated) return;

  if (isCaretMoving(args)) {
    var rep = args.rep;
    var line = rep.selStart[0];
    // line might be a line with line attributes, so we need to ignore the '*' on the text
    var column = rep.selStart[1] - rep.lines.atIndex(line).lineMarker;
    if (caretLocationManager.myPositionChanged(line, column)) {
      sendMessageWithCaretPosition(line, column);
    }
  }
}

// Note that we have to use idle timer to get the mouse position
var isCaretMoving = function(args) {
  var callstack = args.callstack;
  return (callstack.editEvent.eventType == "handleClick") ||
         (callstack.type === "handleKeyEvent") ||
         (callstack.type === "idleWorkTimer");
}

var sendMessageWithCaretPosition = function(line, column) {
  var myAuthorId = pad.getUserId();
  var padId = pad.getPadId();
  // Create a cursor position message to send to the server
  var message = {
    type : 'cursor',
    action : 'cursorPosition',
    locationY: line,
    locationX: column,
    padId : padId,
    myAuthorId : myAuthorId
  }

  // Send the cursor position message to the server
  pad.collabClient.sendMessage(message);
  // Update set of caretLocations
  caretLocationManager.updateCaretLocation(myAuthorId, line, column);
}

// we need to send our position to user who joined the pad, so our caret indicator is created there
exports.handleClientMessage_USER_NEWINFO = function(hook, context, cb) {
  var lastPositionOfMyCaret = caretLocationManager.getMyCurrentCaretLocation();
  if (lastPositionOfMyCaret) {
    sendMessageWithCaretPosition(lastPositionOfMyCaret.line, lastPositionOfMyCaret.column);
  }
}

exports.handleClientMessage_USER_LEAVE = function(hook, context, cb) {
  var userId = context.payload.userId;
  // remove caret indicator on editor
  caretIndicator.removeCaretOf(userId);
  // update set of caretLocations
  caretLocationManager.removeCaretLocationOf(userId);
}

// A huge problem with this is that it runs BEFORE the dom has been updated so edit events are always late..
exports.handleClientMessage_CUSTOM = function(hook, context, cb) {
  if (context.payload.action !== 'cursorPosition') return false;

  var authorId = context.payload.authorId;
  var line     = context.payload.locationY;
  var column   = context.payload.locationX;

  // Don't process our own caret position
  if (pad.getUserId() === authorId) return false;

  // an author has sent this client a cursor position, we need to show it in the dom
  if (!initiated) {
    // we are not ready yet to show caret indicator, so store it for when we are
    caretLocationManager.updatePendingCaretLocation(authorId, line, column);
  } else {
    var caretLocation = caretLocationManager.updateCaretLocation(authorId, line, column);
    caretIndicator.buildAndShowIndicators([caretLocation]);
  }
}
