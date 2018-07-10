var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var LINE_CHANGED_EVENT = require('ep_comments_page/static/js/utils').LINE_CHANGED_EVENT;
var utils = require('./utils');
var caretPosition = require('./caret_position');

var SMILEY = "&#9785;"
var TIME_TO_UPDATE_CARETS_POSITION = 500;
var INDICATOR_HEIGHT = 16;
var initiated = false;
var currentCaretLocations = {};
var pendingCaretLocations = {};

exports.postAceInit = function(hook_name, args, cb) {
  initiated = true;

  pad.plugins = pad.plugins || {};
  pad.plugins.ep_cursortrace = pad.plugins.ep_cursortrace || {};
  pad.plugins.ep_cursortrace.timeToUpdateCaretPosition = TIME_TO_UPDATE_CARETS_POSITION;

  showCaretOfAuthorsAlreadyOnPad();
  updateCaretsWhenAnUpdateMightHadAffectedTheirPositions();
};

var showCaretOfAuthorsAlreadyOnPad = function() {
  var caretLocations = Object.values(pendingCaretLocations);
  buildAndShowIndicatorFor(caretLocations);
}

var updateCaretsWhenAnUpdateMightHadAffectedTheirPositions = function() {
  utils.getPadInner().on(LINE_CHANGED_EVENT, function(e, data) {
    var lineOfChange = data.lineNumber;
    setTimeout(function() {
      buildAndShowIndicatorsAfterLine(lineOfChange);
    }, pad.plugins.ep_cursortrace.timeToUpdateCaretPosition);
  });
}

var buildAndShowIndicatorsAfterLine = function(lineNumber) {
  var allCaretLocations = Object.values(currentCaretLocations);
  var caretLocationsAfterTargetLine = allCaretLocations.filter(function(caretLocation) {
    return caretLocation.line >= lineNumber;
  });
  buildAndShowIndicatorFor(caretLocationsAfterTargetLine);
}

exports.getAuthorClassName = function(author)
{
  if(!author) return;
  return "ep_cursortrace-" + author.replace(/[^a-y0-9]/g, function(c)
  {
    if (c == ".") return "-";
    return 'z' + c.charCodeAt(0) + 'z';
  });
}

exports.className2Author = function(className)
{
  if (className.substring(0, 15) == "ep_cursortrace-")
  {
    return className.substring(15).replace(/[a-y0-9]+|-|z.+?z/g, function(cc)
    {
      if (cc == '-') return '.';
      else if (cc.charAt(0) == 'z')
      {
        return String.fromCharCode(Number(cc.slice(1, -1)));
      }
      else
      {
        return cc;
      }
    });
  }
  return null;
}

exports.aceEditEvent = function(hook_name, args, cb) {
  if (!initiated) return;

  if (isCaretMoving(args)) {
    var rep = args.rep;
    var line = rep.selStart[0];
    // line might be a line with line attributes, so we need to ignore the '*' on the text
    var column = rep.selStart[1] - rep.lines.atIndex(line).lineMarker;
    if (positionChanged(line, column)) {
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

var positionChanged = function(line, column) {
  var myAuthorId = pad.getUserId();
  var lastPositionOfMyCaret = currentCaretLocations[myAuthorId];
  return !lastPositionOfMyCaret || line !== lastPositionOfMyCaret.line || column !== lastPositionOfMyCaret.column;
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
  currentCaretLocations[myAuthorId] = buildCaretLocationData(myAuthorId, line, column);
}

exports.handleClientMessage_USER_NEWINFO = function(hook, context, cb) {
  var myAuthorId = pad.getUserId();
  var lastPositionOfMyCaret = currentCaretLocations[myAuthorId];

  if (lastPositionOfMyCaret) {
    // we need to send our position to user who joined the pad, so our caret indicator is created there
    sendMessageWithCaretPosition(lastPositionOfMyCaret[0], lastPositionOfMyCaret[1]);
  }
}

exports.handleClientMessage_USER_LEAVE = function(hook, context, cb) {
  var userId = context.payload.userId;
  var authorClass = exports.getAuthorClassName(userId);
  var authorClassName = "caret-" + authorClass;

  // remove caret indicator on editor
  utils.getOuterDoc().find("." + authorClassName).remove();
  // update set of caretLocations
  delete currentCaretLocations[userId];
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
  var caretLocationData = buildCaretLocationData(authorId, line, column);
  if (!initiated) {
    // we are not ready yet to show caret indicator, so store it for when we are
    pendingCaretLocations[authorId] = caretLocationData;
  } else {
    buildAndShowIndicatorFor([caretLocationData]);
  }
}

var buildCaretLocationData = function(authorId, line, column) {
  return {
    authorId: authorId,
    line: line,
    column: column,
  };
}

var buildAndShowIndicatorFor = function(caretLocations) {
  var users = pad.collabClient.getConnectedUsers();

  for (var i = 0; i < caretLocations.length; i++) {
    var caretLocation = caretLocations[i];
    var authorId = caretLocation.authorId;
    var line     = caretLocation.line + 1; // +1 as Etherpad line numbers start at 1
    var column   = caretLocation.column;

    currentCaretLocations[authorId] = caretLocation;

    // Don't show our own caret
    if (pad.getUserId() === authorId) continue;

    var position = caretPosition.getCaretPosition(line, column);
    if (position) {
      $.each(users, function(index, user) {
        if (user.userId === authorId) {
          var $indicator = buildIndicator(user, position);
          showIndicator($indicator, authorId);
          fadeOutCaretIndicator($indicator);
        }
      });
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
  return user.name ? decodeURI(escape(user.name)) : SMILEY;
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
  var $outerdoc = utils.getOuterDoc();

  var authorClass = exports.getAuthorClassName(authorId);
  var authorClassName = "caret-" + authorClass;

  // Remove all divs that already exist for this author
  $outerdoc.find("." + authorClassName).remove();

  $indicator.addClass(authorClassName);
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
