exports.initialize = function() {
  return new api();
}

var api = function() {
  // messages sent to outside
  this.LIST_OF_USERS_ON_PAD = 'LIST_OF_USERS_ON_PAD';
  // messages coming from outside
  this.GO_TO_CARET_OF_USER = 'GO_TO_CARET_OF_USER';

  this.onGoToCaretOfUser = function() {};
  this.startListeningToInboundMessages();
}

api.prototype.startListeningToInboundMessages = function() {
  var self = this;
  window.addEventListener('message', function(e) {
    if (e.data.type === self.GO_TO_CARET_OF_USER) {
      self.onGoToCaretOfUser(e.data.userId);
    }
  });
}

api.prototype.setHandleGoToCaretOfUser = function(fn) {
  this.onGoToCaretOfUser = fn;
}

/*
  message: {
    type: 'LIST_OF_USERS_ON_PAD',
    userIds: ['a.psvBbHQGlbpH3OJX', 'a.xAvBb4KHlbpH3OJX']
  }
*/
api.prototype.triggerListOfUsersOnThisPad = function(userIds) {
  var message = {
    type: this.LIST_OF_USERS_ON_PAD,
    userIds: userIds,
  };
  this._triggerEvent(message);
}

api.prototype._triggerEvent = function _triggerEvent(message) {
  // send some extra info when running tests
  if (this._sendTestData()) {
    message.fromUser = pad.getUserId();
  }

  // if there's a wrapper to Etherpad, send data to it; otherwise use Etherpad own window
  var target = window.parent ? window.parent : window;
  target.postMessage(message, '*');
}

api.prototype._sendTestData = function() {
  return pad.plugins.ep_cursortrace.sendTestDataOnApi;
}
