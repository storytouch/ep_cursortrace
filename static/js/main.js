var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var follow_user = require('./follow_user');
var caretPosition = require('./caret_position');

var SMILEY = "&#9785;"
var INDICATOR_HEIGHT = 16;
var initiated = false;
var otherCaretLocations = {};
var last = undefined;

exports.postAceInit = function(hook_name, args, cb) {
  initiated = true;

  // show carets of other authors that had already sent their positions
  var caretLocations = Object.values(otherCaretLocations);
  buildAndShowIndicatorFor(caretLocations);
};

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

  // Note: last is a tri-state: undefined (when the pad is first loaded), null (no last cursor) and [line, col]
  // The AceEditEvent because it usually applies to selected items and isn't really so much about current position.

  if (isCaretMoving(args)) {
    var rep = args.rep;
    var line = rep.selStart[0];
    // line might be a line with line attributes, so we need to ignore the '*' on the text
    var column = rep.selStart[1] - rep.lines.atIndex(line).lineMarker;
    if (positionChanged(line, column)) {
      sendMessageWithCaretPosition(line, column);
      last = [line, column];
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
  return !last || line !== last[0] || column !== last[1];
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

  // console.log("Sent message", message);
  // Send the cursor position message to the server
  pad.collabClient.sendMessage(message);
}

exports.handleClientMessage_USER_NEWINFO = function(hook, context, cb) {
  if (last) {
    // we need to send our position to user who joined the pad, so our caret indicator is created there
    sendMessageWithCaretPosition(last[0], last[1]);
  }
}

exports.handleClientMessage_USER_LEAVE = function(hook, context, cb) {
  // remove caret indicator for author
  var userId = context.payload.userId;
  var authorClass = exports.getAuthorClassName(userId);
  var authorClassName = "caret-" + authorClass;
  getOuterDoc().find("." + authorClassName).remove();
}

// A huge problem with this is that it runs BEFORE the dom has been updated so edit events are always late..
exports.handleClientMessage_CUSTOM = function(hook, context, cb) {
  if (context.payload.action !== 'cursorPosition') return false;

  // an author has sent this client a cursor position, we need to show it in the dom

  var authorId = context.payload.authorId;
  var authorName = context.payload.authorName;
  var line = context.payload.locationY + 1; // +1 as Etherpad line numbers start at 1
  var column = context.payload.locationX;

  var caretLocationData = {
    authorId: authorId,
    line: line,
    column: column,
  };

  if (pad.getUserId() === authorId) {
    // Dont process our own caret position (yes we do get it..) -- This is not a bug
    return false;
  } else if (!initiated) {
    // we are not ready yet to show caret indicator, so store it for when we are
    otherCaretLocations[authorId] = caretLocationData;
  } else {
    buildAndShowIndicatorFor([caretLocationData]);
  }
}

var buildAndShowIndicatorFor = function(caretLocations) {
  var users = pad.collabClient.getConnectedUsers();

  for (var i = 0; i < caretLocations.length; i++) {
    var caretLocation = caretLocations[i];
    var authorId = caretLocation.authorId;
    var line = caretLocation.line;
    var column = caretLocation.column;
    var position = caretPosition.getCaretPosition(line, column);

    if (position) {
      $.each(users, function(index, user) {
        if (user.userId === authorId) {
          var $indicator = buildIndicator(user, position);
          showIndicator($indicator, authorId);
          scrollEditor(position, authorId);
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

  // Create a new Div for this author
  var $indicator = $("<div " + classes + " title="+authorName+"><p>"+authorName+"</p></div>");
  $indicator.css({
    height:  INDICATOR_HEIGHT + "px",
    left: position.left + "px",
    top: position.top + "px",
    "background-color": color,
  });

  return $indicator;
}

var showIndicator = function($indicator, authorId) {
  var $outerdoc = getOuterDoc();

  var authorClass = exports.getAuthorClassName(authorId);
  var authorClassName = "caret-" + authorClass;

  // Remove all divs that already exist for this author
  $outerdoc.find("." + authorClassName).remove();

  $indicator.addClass(authorClassName);
  $outerdoc.append($indicator);
}

var scrollEditor = function(position, authorId) {
  // Are we following this author?
  if(follow_user.isFollowingUser(authorId)) {
    if(position.top < 30) position.top = 0; // position.top line needs to be left visible
    // scroll to the authors location
    scrollTo(position.top);
  }
}

var scrollTo = function(top) {
  var newY = top + "px";
  var $outerdoc = getOuterDoc();
  var $outerdocHTML = $outerdoc.parent();

  // works on earlier versions of Chrome (< 61)
  $outerdoc.animate({scrollTop: newY});
  // works on Firefox & later versions of Chrome (>= 61)
  $outerdocHTML.animate({scrollTop: newY});
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

// Easier access to outer doc body
var $outerDocBody;
var getOuterDoc = function() {
  $outerDocBody = $outerDocBody || $('iframe[name="ace_outer"]').contents().find("#outerdocbody");
  return $outerDocBody;
}
