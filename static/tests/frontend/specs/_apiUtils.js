var ep_cursortrace_test_helper = ep_cursortrace_test_helper || {};
ep_cursortrace_test_helper.apiUtils = {
  /**** messages sent to outside ****/
  LIST_OF_USERS_ON_PAD: 'LIST_OF_USERS_ON_PAD',

  lastDataSent: {},

  startListeningToApiEvents: function() {
    var self = this;
    this.resetData();

    // make sure we get also the author who sent each message, so we can test
    // api messages from/to both users
    var thisPlugin = helper.padChrome$.window.pad.plugins.ep_cursortrace;
    thisPlugin.sendTestDataOnApi = true;

    var outboundApiEventsTarget = helper.padChrome$.window.parent;
    outboundApiEventsTarget.addEventListener('message', function(message) {
      if (message.data.type === self.LIST_OF_USERS_ON_PAD) {
        var userId = self._getUserIdFromMessage(message);
        self.lastDataSent[userId] = message.data;
      }
    });
  },

  _getUserIdFromMessage: function(message) {
    var userId = message.data.fromUser;
    // When message was sent before we were able to set sendTestDataOnApi, it won't have
    // the extra info we need. In this case, assume the message is being sent by the last
    // user loading a pad.
    // This happens because we send the initial list of users right after pad is loaded, and
    // we only call apiUtils.startListeningToApiEvents() after that happens.
    if (!userId) {
      var $lastOpenedPad = $('#iframe-container iframe').last();
      userId = $lastOpenedPad.get(0).contentWindow.pad.getUserId();
    }
    return userId;
  },

  resetData: function() {
    this.lastDataSent = {};
  },

  getLastListOfUsersOnPadOf: function(userId) {
    return (this.lastDataSent[userId] || {}).userIds;
  },

  /**** messages coming from outside ****/
  GO_TO_CARET_OF_USER: 'GO_TO_CARET_OF_USER',

  simulateCallToGoToCaretOfUser: function(userId) {
    var message = {
      type: this.GO_TO_CARET_OF_USER,
      userId: userId,
    };

    var inboundApiEventsTarget = helper.padChrome$.window;
    inboundApiEventsTarget.postMessage(message, '*');
  },
}
