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
      createScript(function() {
        var utils = ep_cursortrace_test_helper.utils;
        utils.speedUpCaretUpdate();

        // force setting to not hide caret indicators after some time, so tests
        // can take a while and still be successful
        utils.makeSureCaretIndicatorWillBeAlwaysVisible();

        ep_script_copy_cut_paste_test_helper.multipleUsers.openSamePadOnWithAnotherUser(done);
      });
    });

    test.timeout(60000);
  },

  makeSureCaretIndicatorWillBeAlwaysVisible: function() {
    var pluginSettings = helper.padChrome$.window.clientVars.ep_cursortrace;
    pluginSettings.fade_out_timeout = 0;
  },

  speedUpCaretUpdate: function() {
    var thisPlugin = helper.padChrome$.window.pad.plugins.ep_cursortrace;
    thisPlugin.timeToUpdateCaretPosition = 0;

    // There's a unique trigger for lines changed event (on ep_comments), we need to set
    // the timeout there
    var ep_comments_page = helper.padChrome$.window.pad.plugins.ep_comments_page;
    ep_comments_page.commentHandler.lineChangeEventTriggerer.padChangedListener.timeout = 0;
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

    var top  = caretPosition.top  - helperMarkPosition.top;
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
