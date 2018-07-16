var doNothing = function() {}

exports.initialize = function() {
  return new api();
}

var api = function() {
  // messages sent to outside
  this.LIST_OF_USERS_ON_PAD = 'caret-users_on_pad';
  // messages coming from outside
  this.GO_TO_CARET_OF_USER = 'caret-go_to_caret_of_user';
  this.SET_USERS_COLORS = 'caret-set_users_colors';

  this.onGoToCaretOfUser = doNothing;
  this.onSetUsersColors = doNothing;

  this.startListeningToInboundMessages();
}

api.prototype.startListeningToInboundMessages = function() {
  var self = this;
  window.addEventListener('message', function(e) {
    self._handleInboundCalls(e);
  });
}

api.prototype._handleInboundCalls = function _handleInboundCalls(e) {
  switch (e.data.type) {
    case this.GO_TO_CARET_OF_USER:
      this.onGoToCaretOfUser(e.data.userId);
      break;
    case this.SET_USERS_COLORS:
      this.onSetUsersColors(e.data.usersColors);
      break;
  }
}

api.prototype.setHandleOnGoToCaretOfUser = function(fn) {
  this.onGoToCaretOfUser = fn;
}

api.prototype.onUsersColorsChange = function(fn) {
  this.onSetUsersColors = fn;
}

/*
  message: {
    type: 'caret-users_on_pad',
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
