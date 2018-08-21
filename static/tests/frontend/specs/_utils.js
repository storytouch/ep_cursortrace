var ep_cursortrace_test_helper = ep_cursortrace_test_helper || {};
ep_cursortrace_test_helper.utils = {
  failTest: function(msg) {
    expect().fail(function() { return msg });
  },

  getLine: function(lineNum) {
    return helper.padInner$('div').eq(lineNum);
  },

  openPadForMultipleUsers: function(test, createScript, done) {
    helper.newPad(function() {
      var utils = ep_cursortrace_test_helper.utils;
      var multipleUsers = ep_script_copy_cut_paste_test_helper.multipleUsers;
      var apiUtils = ep_cursortrace_test_helper.apiUtils;

      apiUtils.startListeningToApiEvents();
      utils._speedUpCaretUpdate();

      // force setting to not hide caret indicators after some time, so tests
      // can take a while and still be successful
      utils._makeSureCaretIndicatorWillBeAlwaysVisible();

      createScript(function() {
        multipleUsers.openSamePadOnWithAnotherUser(function() {
          utils._storeUserIds(done);
        });
      });
    });

    test.timeout(60000);
  },

  _makeSureCaretIndicatorWillBeAlwaysVisible: function() {
    var pluginSettings = helper.padChrome$.window.clientVars.ep_cursortrace;
    pluginSettings.fade_out_timeout = 0;
  },

  _speedUpCaretUpdate: function() {
    var thisPlugin = helper.padChrome$.window.pad.plugins.ep_cursortrace;
    thisPlugin.timeToUpdateCaretPosition = 0;

    // There's a unique trigger for lines changed event (on ep_comments), we need to set
    // the timeout there
    var ep_comments_page = helper.padChrome$.window.pad.plugins.ep_comments_page;
    ep_comments_page.commentHandler.lineChangeEventTriggerer.padChangedListener.timeout = 0;
  },

  _storeUserIds: function(done) {
    var utils = ep_cursortrace_test_helper.utils;
    var multipleUsers = ep_script_copy_cut_paste_test_helper.multipleUsers;

    utils.myUserId = helper.padChrome$.window.pad.getUserId();
    multipleUsers.startActingLikeOtherUser();
    utils.otherUserId = helper.padChrome$.window.pad.getUserId();
    multipleUsers.startActingLikeThisUser();

    done();
  },

  getCaretIndicator: function() {
    return helper.padOuter$('.caretindicator');
  },

  getDistanceBetweenCaretIndicatorAndTarget: function($target, useEndOfTargetAsOrigin) {
    var caretPosition = ep_cursortrace_test_helper.utils.getCaretIndicatorPosition();
    // create a temp element to get its position, then remove it
    var $helperMark = $('<span>x</span>');
    if (useEndOfTargetAsOrigin) {
      $target.append($helperMark);
    } else {
      $target.prepend($helperMark);
    }
    var helperMarkPosition = $helperMark.position();

    // +15: in order to improve UX when clicking close to the indicator, we shift the
    // whole indicator 15px up. So we need to adjust its position when comparing to
    // an element on editor
    var actualCaretTop = caretPosition.top + 15;
    var top  = actualCaretTop  - helperMarkPosition.top;
    var left = caretPosition.left - helperMarkPosition.left;

    $helperMark.remove();

    return { top: top, left: left };
  },

  getDistanceBetweenCaretIndicatorAndBeginningOfLine: function(lineNumber) {
    var $beginningOfLine = this.getLine(lineNumber).find('span:not(:empty)').first();
    return this.getDistanceBetweenCaretIndicatorAndTarget($beginningOfLine, false);
  },

  getDistanceBetweenCaretIndicatorAndEndOfLine: function(lineNumber) {
    var $endOfLine = this.getLine(lineNumber).find('span').last();
    return this.getDistanceBetweenCaretIndicatorAndTarget($endOfLine, true);
  },

  getCaretIndicatorPosition: function() {
    return this.getCaretIndicator().position();
  },

  waitForCaretIndicatorToMove: function(originalPosition, done, timeout) {
    helper.waitFor(function() {
      var position = ep_cursortrace_test_helper.utils.getCaretIndicatorPosition();
      return position.left !== originalPosition.left || position.top !== originalPosition.top;
    }, timeout || 1000).done(done);
  },

  executeAndWaitForCaretIndicatorToMove: function(execFunction, done, timeout) {
    var utils = ep_cursortrace_test_helper.utils;
    var originalPosition = utils.getCaretIndicatorPosition();
    execFunction(function() {
      utils.waitForCaretIndicatorToMove(originalPosition, done, timeout);
    });
  },

  waitForCaretIndicatorToBeVisible: function(done) {
    var utils = ep_cursortrace_test_helper.utils;
    helper.waitFor(function() {
      return utils.getCaretIndicator().is(':visible');
    }, 1900).done(done);
  },

  waitForCaretIndicatorToBeHidden: function(done) {
    var utils = ep_cursortrace_test_helper.utils;
    helper.waitFor(function() {
      return !utils.getCaretIndicator().is(':visible');
    }, 1900).done(done);
  },

  waitForCaretIndicatorToBeVisibleForBothUsers: function(done) {
    var utils = ep_cursortrace_test_helper.utils;
    var multipleUsers = ep_script_copy_cut_paste_test_helper.multipleUsers;
    utils.waitForCaretIndicatorToBeVisible(function() {
      multipleUsers.performAsOtherUser(utils.waitForCaretIndicatorToBeVisible, done);
    });
  },

  placeCaretOfOtherUserAtBeginningOfLine: function(lineNumber, done) {
    this._placeCaretOfOtherUserAtLine(lineNumber, false, done);
  },
  placeCaretOfOtherUserAtEndOfLine: function(lineNumber, done) {
    this._placeCaretOfOtherUserAtLine(lineNumber, true, done);
  },
  _placeCaretOfOtherUserAtLine: function(lineNumber, atEndOfLine, done) {
    var multipleUsers = ep_script_copy_cut_paste_test_helper.multipleUsers;

    multipleUsers.startActingLikeOtherUser();
    var $line = this.getLine(lineNumber);
    var command = atEndOfLine ? '{selectall}{rightarrow}' : '{selectall}{leftarrow}';
    $line.sendkeys(command);

    multipleUsers.startActingLikeThisUser();
    done();
  },
}
