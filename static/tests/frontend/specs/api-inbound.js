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

  before(function(done) {
    utils = ep_cursortrace_test_helper.utils;
    apiUtils = ep_cursortrace_test_helper.apiUtils;

    utils.openPadForMultipleUsers(this, createLongScript, function() {
      utils.waitForCaretIndicatorToBeVisibleForBothUsers(done);
    });
  });

  describe('GO_TO_CARET_OF_USER', function() {
    before(function(done) {
      // move caret of other user to the end of pad, so it is out of viewport
      var moveCaretOutOfViewport = function(done) {
        utils.placeCaretOfOtherUserAtEndOfLine(MULTIPLE_LINES - 1, done);
      }
      utils.executeAndWaitForCaretIndicatorToMove(moveCaretOutOfViewport, done);
    });

    context('when user requires to go to caret of other user', function() {
      before(function() {
        apiUtils.simulateCallToGoToCaretOfUser(utils.otherUserId);
      });

      it('scrolls editor until the caret indicator of target user is visible', function(done) {
        var isVisibleOnViewport = ep_comments_page_test_helper.utils.isVisibleOnViewport;
        var $caretIndicator = utils.getCaretIndicator();

        helper.waitFor(function() {
          return isVisibleOnViewport($caretIndicator.get(0));
        }).done(done);
      });
    });

    context('when user requires to go to caret of my user', function() {
      before(function() {
        // move my caret to the beginning of pad...
        var $lineToPlaceMyCaret = utils.getLine(0);
        $lineToPlaceMyCaret.sendkeys('{selectall}{rightarrow}');

        // ... then scroll viewport away from that line
        var $editor = helper.padOuter$('#outerdocbody');
        $editor.parent().scrollTop($editor.height() / 2);

        apiUtils.simulateCallToGoToCaretOfUser(utils.myUserId);
      });

      it('scrolls editor until the caret of my user is visible', function(done) {
        var $editor = helper.padOuter$('#outerdocbody');
        helper.waitFor(function() {
          return $editor.parent().scrollTop() === 0;
        }).done(done);
      });
    });
  });

  describe('SET_USERS_COLORS', function() {
    context('when users colors are updated', function() {
      var COLOR_NAME = 'A5';
      var COLOR_HASH = 'rgb(0, 194, 0)';

      before(function() {
        var usersColors = {};
        usersColors[utils.otherUserId] = COLOR_NAME;
        apiUtils.simulateCallToSetUsersColors(usersColors);
      });

      it('shows caret indicator with the provided color', function(done) {
        var getBackgroundColorOf = ep_script_touches_test_helper.utils.getBackgroundColorOf;
        helper.waitFor(function() {
          var $caretIndicator = utils.getCaretIndicator();
          return getBackgroundColorOf($caretIndicator) === COLOR_HASH;
        }).done(done);
      });
    });
  });
});
