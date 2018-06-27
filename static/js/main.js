var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var follow_user = require('./follow_user');
var caretPosition = require('./caret_position');

var SMILEY = "&#9785;"
var INDICATOR_HEIGHT = 16;
var initiated = false;
var last = undefined;

exports.postAceInit = function(hook_name, args, cb) {
  initiated = true;
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
  var callstack = args.callstack;
  var rep = args.rep;

  // Note: last is a tri-state: undefined (when the pad is first loaded), null (no last cursor) and [line, col]
  // The AceEditEvent because it usually applies to selected items and isn't really so mucha bout current position.
  var caretMoving = ((callstack.editEvent.eventType == "handleClick") || (callstack.type === "handleKeyEvent") || (callstack.type === "idleWorkTimer") );
  if (caretMoving && initiated){ // Note that we have to use idle timer to get the mouse position
    var Y = rep.selStart[0];
    // Y might be a line with line attributes, so we need to ignore the '*' on the text
    var X = rep.selStart[1] - rep.lines.atIndex(Y).lineMarker;
    if (!last || Y != last[0] || X != last[1]) { // If the position has changed
      var myAuthorId = pad.getUserId();
      var padId = pad.getPadId();
      // Create a cursor position message to send to the server
      var message = {
        type : 'cursor',
        action : 'cursorPosition',
        locationY: Y,
        locationX: X,
        padId : padId,
        myAuthorId : myAuthorId
      }
      last = [];
      last[0] = Y;
      last[1] = X;

      // console.log("Sent message", message);
      pad.collabClient.sendMessage(message);  // Send the cursor position message to the server
    }
  }
}

exports.handleClientMessage_CUSTOM = function(hook, context, cb){
  if (!initiated) return;

  // A huge problem with this is that it runs BEFORE the dom has been updated so edit events are always late..

  var action = context.payload.action;
  var padId = context.payload.padId;
  var authorId = context.payload.authorId;
  if(pad.getUserId() === authorId) return false; // Dont process our own caret position (yes we do get it..) -- This is not a bug

  if(action === 'cursorPosition'){ // an author has sent this client a cursor position, we need to show it in the dom
    var y = context.payload.locationY + 1; // +1 as Etherpad line numbers start at 1
    var x = context.payload.locationX;
    var position = caretPosition.getCaretPosition(y, x);

    // Author color
    var users = pad.collabClient.getConnectedUsers();
    $.each(users, function(user, value){
      if(value.userId == authorId){
        var authorClass = exports.getAuthorClassName(authorId);
        var colors = pad.getColorPalette(); // support non set colors
        var color = colors[value.colorId] || value.colorId; // Test for XSS
        var $outBody = $('iframe[name="ace_outer"]').contents().find("#outerdocbody");

        // Remove all divs that already exist for this author
        $outBody.find(".caret-"+authorClass).remove();

        // Location of stick direction IE up or down
        var location = position.top >= INDICATOR_HEIGHT ? 'stickUp' : 'stickDown';

        var authorName = decodeURI(escape(context.payload.authorName));
        if(authorName == "null"){
          var authorName = SMILEY; // If the users username isn't set then display a smiley face
        }

        // Create a new Div for this author
        var classes = "class='caretindicator " + location + " caret-" + authorClass + "'";
        var $indicator = $("<div " + classes + " title="+authorName+"><p>"+authorName+"</p></div>");
        $indicator.css({
          height:  INDICATOR_HEIGHT + "px",
          left: position.left + "px",
          top: position.top + "px",
          "background-color": color,
        });
        $outBody.append($indicator);

        // Are we following this author?
        if(follow_user.isFollowingUser(value.userId)) {
          if(position.top < 30) position.top = 0; // position.top line needs to be left visible
          // scroll to the authors location
          scrollTo(position.top);
        }

        // After a while, fade it out :)
        setTimeout(function(){
          $indicator.fadeOut(500, function(){
            $indicator.remove();
          });
        }, 2000);
      }
    });
  }
}

var scrollTo = function(top) {
  var newY = top + "px";
  var $outerdoc = $('iframe[name="ace_outer"]').contents().find("#outerdocbody");
  var $outerdocHTML = $outerdoc.parent();

  // works on earlier versions of Chrome (< 61)
  $outerdoc.animate({scrollTop: newY});
  // works on Firefox & later versions of Chrome (>= 61)
  $outerdocHTML.animate({scrollTop: newY});
}
