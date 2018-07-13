// messages sent to outside
var LIST_OF_USERS_ON_PAD = 'LIST_OF_USERS_ON_PAD';

// messages coming from outside
var GO_TO_CARET_OF_USER = 'GO_TO_CARET_OF_USER';

exports.startListeningToInboundMessages = function() {
  window.addEventListener('message', function(e) {
    _handleInboundCalls(e);
  });
}

var _handleInboundCalls = function _handleInboundCalls(e) {
  if (e.data.type === GO_TO_CARET_OF_USER) {
    onGoToCaretOfUser(e.data.userId);
  }
}

var onGoToCaretOfUser = function() {};
exports.setHandleGoToCaretOfUser = function(fn) {
  onGoToCaretOfUser = fn;
}

/*
  message: {
    type: 'LIST_OF_USERS_ON_PAD',
    userIds: ['a.psvBbHQGlbpH3OJX', 'a.xAvBb4KHlbpH3OJX']
  }
*/
exports.triggerListOfUsersOnThisPad = function(userIds) {
  var message = {
    type: LIST_OF_USERS_ON_PAD,
    userIds: userIds,
  };
  _triggerEvent(message);
}

var _triggerEvent = function _triggerEvent(message) {
  // send some extra info when running tests
  if (_sendTestData()) {
    message.fromUser = pad.getUserId();
  }

  // if there's a wrapper to Etherpad, send data to it; otherwise use Etherpad own window
  var target = window.parent ? window.parent : window;
  target.postMessage(message, '*');
}

var _sendTestData = function() {
  return pad && pad.plugins && pad.plugins.ep_cursortrace && pad.plugins.ep_cursortrace.sendTestDataOnApi;
}
