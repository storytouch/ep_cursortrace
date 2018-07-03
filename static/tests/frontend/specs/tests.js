describe('ep_cursortrace - Basic Tests', function () {
  var multipleUsers, originalDistance, originalPosition;

  before(function(done) {
    multipleUsers = ep_script_copy_cut_paste_test_helper.multipleUsers;
    helper.newPad(function() {
      // force setting to not hide caret indicators after some time, so tests
      // can take a while and still be successful
      makeSureCaretIndicatorWillBeAlwaysVisible();

      // add some content to the pad
      var $firstLine = helper.padInner$('div').first();
      $firstLine.sendkeys('first line '.repeat(20));

      multipleUsers.openSamePadOnWithAnotherUser(done);
    });
    this.timeout(60000);
  });

  it('shows caret indicator when another user joins the same pad', function(done) {
    helper.waitFor(function() {
      return getCaretIndicator().is(':visible');
    }, 1900).done(done);
  });

  it('shows caret indicator for the user that was already on the pad', function(done) {
    multipleUsers.performAsOtherUser(function(done) {
      helper.waitFor(function() {
        return getCaretIndicator().is(':visible');
      }, 1900).done(done);
    }, done);
  });

  context('when other user moves the caret', function() {
    before(function(done) {
      originalPosition = getCaretIndicatorPosition();

      multipleUsers.performAsOtherUser(function(done) {
        placeCaretAtEndOfLine();
        done();
      }, done);
    });

    it('updates the caret indicator for this user', function(done) {
      waitForCaretIndicatorToMove(function() {
        // caret is at the end of the line; caret indicator should be there too
        var distance = getDistanceBetweenCaretIndicatorAndEndOfLine();
        expect(distance.left).to.be(0);
        expect(distance.top).to.be(0);
        done();
      });
    });
  });

  context('when this user edits the line where caret of other user is', function() {
    before(function() {
      originalPosition = getCaretIndicatorPosition();

      var $firstLine = helper.padInner$('div').first();
      $firstLine.sendkeys('{selectall}{leftarrow}').sendkeys('!');
    });

    it('updates the caret indicator of the other user', function(done) {
      waitForCaretIndicatorToMove(function() {
        var distance = getDistanceBetweenCaretIndicatorAndEndOfLine();
        expect(distance.left).to.be(0);
        expect(distance.top).to.be(0);
        done();
      });
    });
  });

  context('when other user formats part of the text', function() {
    before(function(done) {
      this.timeout(4000);

      // [user 2] add bold to part of the middle of the line
      multipleUsers.startActingLikeOtherUser();
      selectTextInTheMiddleOfTheLine();
      addBoldToSelectedText()

      // [user 1] caret indicator should move to the bold text
      multipleUsers.startActingLikeThisUser();
      waitForCaretIndicatorToMove(function() {
        originalPosition = getCaretIndicatorPosition();

        // [user 2] go back to the end of line
        multipleUsers.startActingLikeOtherUser();
        placeCaretAtEndOfLine();

        multipleUsers.startActingLikeThisUser();
        done();
      });
    });

    it('does not affect caret indicator for this user', function(done) {
      waitForCaretIndicatorToMove(function() {
        var distance = getDistanceBetweenCaretIndicatorAndEndOfLine();
        expect(distance.left).to.be(0);
        expect(distance.top).to.be(0);
        done();
      });
    });
  });

  context('when other user places caret on an empty line', function() {
    before(function(done) {
      // [user 2] create an empty line at the end of pad
      multipleUsers.startActingLikeOtherUser();
      var $lines = helper.padInner$('div');
      var originalNumberOfLines = $lines.length;
      var $lastLine = $lines.last();
      $lastLine.html($lastLine.html() + '<div/>');
      // wait for line to be created
      helper.waitFor(function() {
        return helper.padInner$('div').length === originalNumberOfLines + 1;
      }).done(function() {
        // [user 1] get baseline position
        multipleUsers.startActingLikeThisUser();
        originalPosition = getCaretIndicatorPosition();

        // [user 2] place caret on empty line
        multipleUsers.startActingLikeOtherUser();
        var $lastLine = helper.padInner$('div').last();
        $lastLine.sendkeys('{selectall}{leftarrow}');

        multipleUsers.startActingLikeThisUser();
        done();
      });
    });

    it('updates the caret indicator of the other user', function(done) {
      waitForCaretIndicatorToMove(function() {
        var $emptyLine = helper.padInner$('div').last();
        var distance = getDistanceBetweenCaretIndicatorAndTarget($emptyLine);

        expect(distance.left).to.be(0);
        expect(distance.top).to.be(0);
        done();
      });
    });
  });

  context('when other user leaves pad', function() {
    before(function() {
      multipleUsers.closePadForOtherUser();
    });

    it('removes the caret indicator', function(done) {
      helper.waitFor(function() {
        return !getCaretIndicator().is(':visible');
      }, 1900).done(done);
    });
  });

  /********************************** Helper Functions **********************************/
  var makeSureCaretIndicatorWillBeAlwaysVisible = function() {
    var pluginSettings = helper.padChrome$.window.clientVars.ep_cursortrace;
    pluginSettings.fade_out_timeout = 0;
  }

  var getCaretIndicator = function() {
    return helper.padOuter$('.caretindicator');
  }

  var getDistanceBetweenCaretIndicatorAndTarget = function($target, useEndOfTargetAsOrigin) {
    var caretPosition = getCaretIndicatorPosition();
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
  }

  var getCaretIndicatorPosition = function() {
    return getCaretIndicator().position();
  }

  var getDistanceBetweenCaretIndicatorAndEndOfLine = function() {
    var $endOfFirstLine = helper.padInner$('div').first().find('span').last();
    return getDistanceBetweenCaretIndicatorAndTarget($endOfFirstLine, true);
  }

  var waitForCaretIndicatorToMove = function(done) {
    helper.waitFor(function() {
      var position = getCaretIndicatorPosition();
      return position.left !== originalPosition.left || position.top !== originalPosition.top;
    }).done(done).fail(done);
  }

  var placeCaretAtEndOfLine = function() {
    var $firstLine = helper.padInner$('div').first();
    $firstLine.sendkeys('{selectall}{rightarrow}');
  }

  var selectTextInTheMiddleOfTheLine = function() {
    var $firstLine = helper.padInner$('div').first();
    helper.selectLines($firstLine, $firstLine, 50, 60);
  }

  var addBoldToSelectedText = function() {
    var $boldButton = helper.padChrome$('.buttonicon-bold');
    $boldButton.click();
  }
});
