describe('ep_cursortrace - integration with ep_script_scene_marks', function () {
  var utils, smUtils, multipleUsers;

  var LINE_BEFORE_SM = 0;
  var LINE_WITH_HEADING = 4;
  var LINE_AFTER_SM = 6;

  /*
    Script lines:
      LINE_BEFORE_SM
      synopsis title
      synopsis description
      LINE_WITH_HEADING
      LINE_AFTER_SM
  */
  var createScript = function(done) {
    // add a SM, and some content before and after it
    var sceneText = 'scene';
    var firstLineText = 'first line '.repeat(10);
    var lastLineText = 'last line '.repeat(10);

    var lineBeforeSM = smUtils.action(firstLineText);
    var lineAfterSM  = smUtils.action(lastLineText);
    var synopsis     = smUtils.synopsis(sceneText);
    var heading      = smUtils.heading(sceneText);
    var separator    = smUtils.general('separator');

    // add a separator between target lines and SM/heading, as lines adjacent to changed
    // line are also updated
    var script = lineBeforeSM + separator + synopsis + heading + separator + lineAfterSM;

    smUtils.createScriptWith(script, lastLineText, done);
  }

  before(function(done) {
    multipleUsers = ep_script_copy_cut_paste_test_helper.multipleUsers;
    utils = ep_cursortrace_test_helper.utils;
    smUtils = ep_script_scene_marks_test_helper.utils;

    utils.openPadForMultipleUsers(this, createScript, function() {
      utils.waitForCaretIndicatorToBeVisibleForBothUsers(done);
    });
  });

  context('when other user places caret on a SM hidden for this user', function() {
    var moveCaret = function(done) {
      utils.placeCaretOfOtherUserAtEndOfLine(LINE_WITH_HEADING - 1, done);
    }

    it('shows caret indicator on beginning of line with heading', function(done) {
      utils.executeAndWaitForCaretIndicatorToMove(moveCaret, function() {
        var distance = utils.getDistanceBetweenCaretIndicatorAndBeginningOfLine(LINE_WITH_HEADING);
        expect(distance.left).to.be(0);
        expect(distance.top).to.be(0);
        done();
      });
    });
  });

  context('when other user places caret on a line after a SM hidden for this user', function() {
    var moveCaret = function(done) {
      utils.placeCaretOfOtherUserAtEndOfLine(LINE_AFTER_SM, done);
    }

    it('updates the caret indicator for this user', function(done) {
      utils.executeAndWaitForCaretIndicatorToMove(moveCaret, function() {
        var distance = utils.getDistanceBetweenCaretIndicatorAndEndOfLine(LINE_AFTER_SM);
        expect(distance.left).to.be(0);
        expect(distance.top).to.be(0);
        done();
      });
    });

    context('and this user opens the SM', function() {
      var originalTimestamp;

      before(function() {
        originalTimestamp = utils.getCaretIndicator().attr('timestamp');
        if (!originalTimestamp) {
          utils.failTest('Timestamp not set on caret indicator');
        }

        smUtils.clickOnSceneMarkButtonOfLine(LINE_WITH_HEADING);
      });

      after(function() {
        // close SM again
        smUtils.clickOnSceneMarkButtonOfLine(LINE_WITH_HEADING);
      });

      it('updates the caret indicator', function(done) {
        helper.waitFor(function() {
          var timestamp = utils.getCaretIndicator().attr('timestamp');
          return timestamp !== originalTimestamp;
        }, 1900).done(done);
      });

      it('moves the caret indicator to the new position of the caret of the other user', function(done) {
        var distance = utils.getDistanceBetweenCaretIndicatorAndEndOfLine(LINE_AFTER_SM);
        expect(distance.left).to.be(0);
        expect(distance.top).to.be(0);
        done();
      });
    });
  });

  context('when other user places caret on a line before a SM hidden for this user', function() {
    var moveCaret = function(done) {
      utils.placeCaretOfOtherUserAtEndOfLine(LINE_BEFORE_SM, done);
    }

    it('updates the caret indicator for this user', function(done) {
      utils.executeAndWaitForCaretIndicatorToMove(moveCaret, function() {
        var distance = utils.getDistanceBetweenCaretIndicatorAndEndOfLine(LINE_BEFORE_SM);
        expect(distance.left).to.be(0);
        expect(distance.top).to.be(0);
        done();
      });
    });

    context('and this user opens the SM', function() {
      var originalTimestamp;

      before(function() {
        originalTimestamp = utils.getCaretIndicator().attr('timestamp');
        if (!originalTimestamp) {
          utils.failTest('Timestamp not set on caret indicator');
        }

        smUtils.clickOnSceneMarkButtonOfLine(LINE_WITH_HEADING);
      });

      after(function() {
        // close SM again
        smUtils.clickOnSceneMarkButtonOfLine(LINE_WITH_HEADING);
      });

      it('does not update the caret indicator', function(done) {
        helper.waitFor(function() {
          var timestamp = utils.getCaretIndicator().attr('timestamp');
          return timestamp !== originalTimestamp;
        }, 1900).done(function() {
          utils.failTest('Caret indicator was updated');
        }).fail(function() {
          // all set, no indicator was updated call. We can finish the test
          done();
        });
      });

      it('keeps the caret indicator close to the caret of the other user', function(done) {
        var distance = utils.getDistanceBetweenCaretIndicatorAndEndOfLine(LINE_BEFORE_SM);
        expect(distance.left).to.be(0);
        expect(distance.top).to.be(0);
        done();
      });
    });
  });
});
