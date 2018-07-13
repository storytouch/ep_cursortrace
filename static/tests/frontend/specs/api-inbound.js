describe('ep_cursortrace - api - inbound messages', function() {
  var utils, apiUtils;

  var MULTIPLE_LINES = 40;

  var createLongScript = function(done) {
    var oneLine = 'one line<br>';
    var longPad = oneLine.repeat(MULTIPLE_LINES);
    var $firstLine = utils.getLine(0);
    $firstLine.html(longPad);

    // wait for Etherpad to process changes
    helper.waitFor(function() {
      var numberOfLines = helper.padInner$('div').length;
      return numberOfLines >= MULTIPLE_LINES;
    }).done(done);
  }

  var moveCaretOutOfViewport = function(done) {
    utils.placeCaretOfOtherUserAtEndOfLine(MULTIPLE_LINES - 1, done);
  }

  before(function(done) {
    utils = ep_cursortrace_test_helper.utils;
    apiUtils = ep_cursortrace_test_helper.apiUtils;

    utils.openPadForMultipleUsers(this, createLongScript, function() {
      // move caret of other user to the end of pad, so it is out of viewport
      utils.waitForCaretIndicatorToBeVisibleForBothUsers(function() {
        utils.executeAndWaitForCaretIndicatorToMove(moveCaretOutOfViewport, done);
      });
    });
  });

  context('when user requires to go to caret of other user', function() {
    before(function() {
      apiUtils.simulateCallToGoToCaretOfUser(utils.otherUserId);
    });

    it('scrolls editor until the caret of target user is visible', function(done) {
      var isVisibleOnViewport = ep_comments_page_test_helper.utils.isVisibleOnViewport;
      var $caretIndicator = utils.getCaretIndicator();

      helper.waitFor(function() {
        return isVisibleOnViewport($caretIndicator.get(0));
      }).done(done);
    });
  });
});
