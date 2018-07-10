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

  getDistanceBetweenCaretIndicatorAndEndOfLine: function(lineNumber) {
    var utils = ep_cursortrace_test_helper.utils;
    var $endOfLine = utils.getLine(lineNumber).find('span').last();
    return utils.getDistanceBetweenCaretIndicatorAndTarget($endOfLine, true);
  },

  getCaretIndicatorPosition: function() {
    return ep_cursortrace_test_helper.utils.getCaretIndicator().position();
  },

  waitForCaretIndicatorToMove: function(originalPosition, done) {
    helper.waitFor(function() {
      var position = ep_cursortrace_test_helper.utils.getCaretIndicatorPosition();
      return position.left !== originalPosition.left || position.top !== originalPosition.top;
    }).done(done).fail(done);
  },

  executeAndWaitForCaretIndicatorToMove: function(execFunction, done) {
    var utils = ep_cursortrace_test_helper.utils;
    var originalPosition = utils.getCaretIndicatorPosition();
    execFunction(function() {
      utils.waitForCaretIndicatorToMove(originalPosition, done);
    });
  },

  waitForCaretIndicatorToBeVisible: function(done) {
    var utils = ep_cursortrace_test_helper.utils;
    helper.waitFor(function() {
      return utils.getCaretIndicator().is(':visible');
    }, 1900).done(done);
  },
}
