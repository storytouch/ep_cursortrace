/***
*
* Responsible for negotiating messages between two clients
*
****/

var authorManager = require("ep_etherpad-lite/node/db/AuthorManager"),
padMessageHandler = require("ep_etherpad-lite/node/handler/PadMessageHandler"),
            async = require('ep_etherpad-lite/node_modules/async'),
messageDispatcher = require('./messageDispatcher');

var MESSAGE_DISPATCHER_INTERVAL = 1000; // 1 second
var buffer = messageDispatcher.init(function(msg) {
  padMessageHandler.handleCustomObjectMessage(msg, false, function(){
    // TODO: Error handling.
  })
}, MESSAGE_DISPATCHER_INTERVAL)

/*
* Handle incoming messages from clients
*/
exports.handleMessage = async function(hook_name, context, callback){
  // Firstly ignore any request that aren't about cursor
  var iscursorMessage = false;
  if(context){
    if(context.message){
      if(context.message.type === 'COLLABROOM'){
        if(context.message.data){
          if(context.message.data.type){
            if(context.message.data.type === 'cursor'){
              iscursorMessage = true;
            }
          }
        }
      }
    }
  }
  if(!iscursorMessage){
    callback(false);
    return false;
  }

  var message = context.message.data;
  /***
    What's available in a message?
     * action -- The action IE cursorPosition
     * padId -- The padId of the pad both authors are on
     * targetAuthorId -- The Id of the author this user wants to talk to
     * locationX and location Y are the locations. // TODO make this one object or a touple
     * myAuthorId -- The Id of the author who is trying to talk to the targetAuthorId
  ***/
  if(message.action === 'cursorPosition'){
    var authorName = await authorManager.getAuthorName(message.myAuthorId); // Get the authorname

      var msg = {
        type: "COLLABROOM",
        data: {
          type: "CUSTOM",
          payload: {
            action: "cursorPosition",
            authorId: message.myAuthorId,
            authorName: authorName,
            padId: message.padId,
            locationX: message.locationX,
            locationY: message.locationY
          }
        }
      };
    sendToRoom(message, msg);
  }

  callback([null]);
}


function sendToRoom(message, msg){
  // using a buffer handling for protection and to stop DDoS,
  // using padId+myAuthorId as key to send only the most recent
  // message in the buffer for each user per pad
  var key = message.padId + "|" + message.myAuthorId;
  buffer.dispatch(key, msg);
}
