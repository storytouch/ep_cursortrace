describe('ep_cursortrace - Basic Tests', function () {
  var utils, multipleUsers;

  var TARGET_LINE = 0;

  var createScript = function(done) {
    // add some content to the pad
    var $firstLine = utils.getLine(TARGET_LINE);
    $firstLine.sendkeys('first line '.repeat(20));
    done();
  }

  before(function(done) {
    multipleUsers = ep_script_copy_cut_paste_test_helper.multipleUsers;
    utils = ep_cursortrace_test_helper.utils;
    utils.openPadForMultipleUsers(this, createScript, done);
  });

  it('shows caret indicator when another user joins the same pad', function(done) {
    utils.waitForCaretIndicatorToBeVisible(done);
  });

  it('shows caret indicator for the user that was already on the pad', function(done) {
    multipleUsers.performAsOtherUser(function(done) {
      utils.waitForCaretIndicatorToBeVisible(done);
    }, done);
  });

  context('when other user moves the caret', function() {
    var moveCaret = function(done) {
      utils.placeCaretOfOtherUserAtEndOfLine(TARGET_LINE, done);
    }

    before(function(done) {
      utils.waitForCaretIndicatorToBeVisibleForBothUsers(done);
    });

    it('updates the caret indicator for this user', function(done) {
      this.timeout(4000);
      utils.executeAndWaitForCaretIndicatorToMove(moveCaret, function() {
        // caret is at the end of the line; caret indicator should be there too
        var distance = utils.getDistanceBetweenCaretIndicatorAndEndOfLine(TARGET_LINE);
        expect(distance.left).to.be(0);
        expect(distance.top).to.be(0);
        done();
      }, 2000);
    });
  });

  context('when this user edits the line where caret of other user is', function() {
    var editLine = function(done) {
      var $firstLine = utils.getLine(TARGET_LINE);
      $firstLine.sendkeys('{selectall}{leftarrow}').sendkeys('!!!!'); // force text goes to next line
      done();
    }

    before(function(done) {
      this.timeout(8000);
      utils.waitForCaretIndicatorToBeVisibleForBothUsers(function() {
        makeSureCaretOfOtherUserIsAtEndOfLine(TARGET_LINE, done);
      });
    });

    it('updates the caret indicator of the other user', function(done) {
      this.timeout(6000);
      utils.executeAndWaitForCaretIndicatorToMove(editLine, function() {
        var distance = utils.getDistanceBetweenCaretIndicatorAndEndOfLine(TARGET_LINE);
        expect(distance.left).to.be(0);
        expect(distance.top).to.be(0);
        done();
      }, 4000);
    });
  });

  context('when other user formats part of the text', function() {
    var originalPosition;

    before(function(done) {
      this.timeout(6000);
      utils.waitForCaretIndicatorToBeVisibleForBothUsers(function() {
        originalPosition = utils.getCaretIndicatorPosition();

        // [user 2] add bold to part of the middle of the line
        multipleUsers.startActingLikeOtherUser();
        selectTextInTheMiddleOfLine(TARGET_LINE);
        addBoldToSelectedText()

        // [user 1] caret indicator should move to the bold text
        multipleUsers.startActingLikeThisUser();
        utils.waitForCaretIndicatorToMove(originalPosition, function() {
          originalPosition = utils.getCaretIndicatorPosition();

          // [user 2] go back to the end of line
          utils.placeCaretOfOtherUserAtEndOfLine(TARGET_LINE, done);
        }, 4000);
      });
    });

    it('does not affect caret indicator for this user', function(done) {
      this.timeout(4000);
      utils.waitForCaretIndicatorToMove(originalPosition, function() {
        var distance = utils.getDistanceBetweenCaretIndicatorAndEndOfLine(TARGET_LINE);
        expect(distance.left).to.be(0);
        expect(distance.top).to.be(0);
        done();
      }, 2000);
    });
  });

  context('when other user places caret on an empty line', function() {
    before(function(done) {
      utils.waitForCaretIndicatorToBeVisibleForBothUsers(function() {

        // [user 2] create an empty line at the end of pad
        multipleUsers.startActingLikeOtherUser();
        var $lines = helper.padInner$('div');
        var originalNumberOfLines = $lines.length;
        var $lastLine = $lines.last();
        $lastLine.html($lastLine.html() + '<div/>');

        // wait for line to be created for both users
        helper.waitFor(function() {
          return helper.padInner$('div').length === originalNumberOfLines + 1;
        }).done(function() {
          multipleUsers.startActingLikeThisUser();
          helper.waitFor(function() {
            return helper.padInner$('div').length === originalNumberOfLines + 1;
          }).done(done);
        });
      });
    });

    var moveCaretToEmptyLine = function(done) {
      var lastLine = helper.padInner$('div').length - 1;

      // [user 2] place caret on empty line
      utils.placeCaretOfOtherUserAtEndOfLine(lastLine, done);
    }

    it('updates the caret indicator of the other user', function(done) {
      this.timeout(4000);

      utils.executeAndWaitForCaretIndicatorToMove(moveCaretToEmptyLine, function() {
        var $emptyLine = helper.padInner$('div').last();

        // it takes a while for the caret to go to the empty line
        helper.waitFor(function() {
          var distance = utils.getDistanceBetweenCaretIndicatorAndTarget($emptyLine);
          return distance.left === 0 && distance.top === 0;
        }).done(done);
      }, 2000);
    });
  });

  context('when other user leaves pad', function() {
    before(function() {
      multipleUsers.closePadForOtherUser();
    });

    it('removes the caret indicator', function(done) {
      utils.waitForCaretIndicatorToBeHidden(done);
    });
  });

  /********************************** Helper Functions **********************************/
  var placeCaretAtEndOfLine = function(lineNumber) {
    var $line = utils.getLine(lineNumber);
    $line.sendkeys('{selectall}{rightarrow}');
  }

  var selectTextInTheMiddleOfLine = function(lineNumber) {
    var $line = utils.getLine(lineNumber);
    helper.selectLines($line, $line, 50, 60);
  }

  var addBoldToSelectedText = function() {
    var $boldButton = helper.padChrome$('.buttonicon-bold');
    $boldButton.click();
  }

  var _buildFunctionToMoveCaret = function(lineNumber, execCaretMove) {
    return function(done) {
      multipleUsers.startActingLikeOtherUser();
      execCaretMove(lineNumber);
      multipleUsers.startActingLikeThisUser();
      done();
    }
  }

  var makeSureCaretOfOtherUserIsAtEndOfLine = function(lineNumber, done) {
    var moveCaretToMiddleOfLine = _buildFunctionToMoveCaret(lineNumber, selectTextInTheMiddleOfLine);
    var moveCaretToEndOfLine    = _buildFunctionToMoveCaret(lineNumber, placeCaretAtEndOfLine);

    // move caret to middle of line, so we're able to detect when it is moved to the end
    // and caret indicator was updated
    utils.executeAndWaitForCaretIndicatorToMove(moveCaretToMiddleOfLine, function() {
      utils.executeAndWaitForCaretIndicatorToMove(moveCaretToEndOfLine, done, 4000);
    }, 4000);
  }
});
