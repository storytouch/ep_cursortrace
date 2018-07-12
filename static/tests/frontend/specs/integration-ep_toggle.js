describe('ep_cursortrace - integration with ep_script_toggle_view', function () {
  var utils, smUtils, eascUtils, multipleUsers;

  var LINE_BEFORE_SEQ             = 0;
  var LINE_WITH_ACT_TITLE         = LINE_BEFORE_SEQ             + 2;
  var LINE_WITH_ACT_DESCRIPTION   = LINE_WITH_ACT_TITLE         + 1;
  var LINE_WITH_SEQ_TITLE         = LINE_WITH_ACT_DESCRIPTION   + 1;
  var LINE_WITH_SEQ_DESCRIPTION_1 = LINE_WITH_SEQ_TITLE         + 1;
  var LINE_WITH_SEQ_DESCRIPTION_2 = LINE_WITH_SEQ_DESCRIPTION_1 + 1;
  var LINE_WITH_SCE_TITLE         = LINE_WITH_SEQ_DESCRIPTION_2 + 1;
  var LINE_WITH_SCE_DESCRIPTION   = LINE_WITH_SCE_TITLE         + 1;
  var LINE_WITH_HEADING           = LINE_WITH_SCE_DESCRIPTION   + 1;
  var LINE_AFTER_HEADING          = LINE_WITH_HEADING           + 3;

  /*
    Script lines:
      LINE_BEFORE_SEQ              --\
      LINE_WITH_ACT_TITLE             +--> group 1
      LINE_WITH_ACT_DESCRIPTION    --/
      LINE_WITH_SEQ_TITLE          --\
      LINE_WITH_SEQ_DESCRIPTION_1     +--> group 2
      LINE_WITH_SEQ_DESCRIPTION_2  --/
      LINE_WITH_SCE_TITLE          --\
      LINE_WITH_SCE_DESCRIPTION       \
      LINE_WITH_HEADING                +--> group 3
      some lines...                   /
      LINE_AFTER_HEADING           --/
  */
  var createScript = function(done) {
    // add a SM, and some content before and after it
    var sceneText = 'scene 1';
    var firstLineText = 'first line '.repeat(10);
    var lastLineText = 'last line '.repeat(10);

    var lineBeforeSM = smUtils.action(firstLineText);
    var lineAfterSM  = smUtils.action(lastLineText);
    var act          = smUtils.act(sceneText);
    // sequence has 2 lines of the description
    var sequence     = smUtils.sequence(sceneText) + smUtils.sequenceSummary(sceneText);
    var synopsis     = smUtils.synopsis(sceneText);
    var heading      = smUtils.heading(sceneText);
    var separator    = smUtils.general('separator');

    // add a separator between target lines and SM/heading, as lines adjacent to changed
    // line are also updated
    var script = lineBeforeSM +
                 separator +
                 act +
                 sequence +
                 synopsis +
                 heading +
                 separator.repeat(3) +
                 lineAfterSM;

    smUtils.createScriptWith(script, lastLineText, done);
  }

  var moveCaretOfOtherUserToLine = function(lineNumber) {
    return function(done) {
      utils.placeCaretOfOtherUserAtEndOfLine(lineNumber, done);
    };
  }

  // function to be used when we have a series of scenarios that should show the
  // caret at the same place. We need to know when they were moved to the expected
  // place, so to do that we force them to move somewhere else, and then execute
  // the action that should move caret indicator to the final position
  var forceCaretIndicatorToMove = function(done) {
    var moveCaretToTheMiddleOfSequence = function(done) {
      utils.placeCaretOfOtherUserAtBeginningOfLine(LINE_WITH_SEQ_DESCRIPTION_1, done);
    };

    utils.executeAndWaitForCaretIndicatorToMove(moveCaretToTheMiddleOfSequence, done);
  }

  var testCaretIndicatorIsOnSamePositionOfCaret = function(testConfig) {
    it('shows caret indicator on the exact position when the other user placed it', function(done) {
      var moveCaret = moveCaretOfOtherUserToLine(testConfig.lineNumber);
      utils.executeAndWaitForCaretIndicatorToMove(moveCaret, function() {
        var distance = utils.getDistanceBetweenCaretIndicatorAndEndOfLine(testConfig.lineNumber);
        expect(distance.left).to.be(0);
        expect(distance.top).to.be(0);
        done();
      }, 1900);
    });
  };

  var testCaretIndicatorIsAtBeginningOfSequenceTitle = function(testConfig) {
    it('shows caret indicator at the beginning of sequence title', function(done) {
      var moveCaret = moveCaretOfOtherUserToLine(testConfig.lineNumber);
      utils.executeAndWaitForCaretIndicatorToMove(moveCaret, function() {
        var distance = utils.getDistanceBetweenCaretIndicatorAndBeginningOfLine(LINE_WITH_SEQ_TITLE);
        expect(distance.left).to.be(0);
        expect(distance.top).to.be(0);
        done();
      }, 1900);
    });
  };

  var testCaretIndicatorIsAtEndOfSequenceDescription = function(testConfig) {
    it('shows caret indicator at the end of last line of sequence description', function(done) {
      var moveCaret = moveCaretOfOtherUserToLine(testConfig.lineNumber);
      utils.executeAndWaitForCaretIndicatorToMove(moveCaret, function() {
        var distance = utils.getDistanceBetweenCaretIndicatorAndEndOfLine(LINE_WITH_SEQ_DESCRIPTION_2);
        expect(distance.left).to.be(0);
        expect(distance.top).to.be(0);
        done();
      }, 1900);
    });
  };

  before(function(done) {
    multipleUsers = ep_script_copy_cut_paste_test_helper.multipleUsers;
    utils         = ep_cursortrace_test_helper.utils;
    smUtils       = ep_script_scene_marks_test_helper.utils;
    eascUtils     = ep_script_toggle_view_test_helper.utils;

    var openSM = function(done) {
      multipleUsers.startActingLikeOtherUser();
      smUtils.clickOnSceneMarkButtonOfLine(LINE_WITH_HEADING);
      multipleUsers.startActingLikeThisUser();
      done();
    }

    utils.openPadForMultipleUsers(this, createScript, function() {
      utils.waitForCaretIndicatorToBeVisibleForBothUsers(function() {
        // open SM for the other user, so all lines of the SM are visible
        utils.executeAndWaitForCaretIndicatorToMove(openSM, done);
      });
    });
  });

  context('when EASC is [SEQ]', function() {
    before(function() {
      eascUtils.setEascMode(['sequence']);
    });

    [
      // [group 1] tests for caret on lines that are visible
      { test: testCaretIndicatorIsOnSamePositionOfCaret, lineNumber: LINE_WITH_SEQ_TITLE,         description: 'the sequence title'},
      { test: testCaretIndicatorIsOnSamePositionOfCaret, lineNumber: LINE_WITH_SEQ_DESCRIPTION_1, description: 'the first line of sequence description'},
      { test: testCaretIndicatorIsOnSamePositionOfCaret, lineNumber: LINE_WITH_SEQ_DESCRIPTION_2, description: 'the last line of sequence description'},
      // [group 2] tests for caret on lines that are before first visible line
      { test: testCaretIndicatorIsAtBeginningOfSequenceTitle, lineNumber: LINE_BEFORE_SEQ,           description: 'a line way before first visible line'},
      { test: testCaretIndicatorIsAtBeginningOfSequenceTitle, lineNumber: LINE_WITH_ACT_TITLE,       description: 'the act title'},
      { test: testCaretIndicatorIsAtBeginningOfSequenceTitle, lineNumber: LINE_WITH_ACT_DESCRIPTION, description: 'the act description'},
      // [group 3] tests for caret on lines that are after last visible line
      { test: testCaretIndicatorIsAtEndOfSequenceDescription, lineNumber: LINE_WITH_SCE_TITLE,       description: 'the synopsis title'},
      { test: testCaretIndicatorIsAtEndOfSequenceDescription, lineNumber: LINE_WITH_SCE_DESCRIPTION, description: 'the synopsis description'},
      { test: testCaretIndicatorIsAtEndOfSequenceDescription, lineNumber: LINE_WITH_HEADING,         description: 'the heading'},
      { test: testCaretIndicatorIsAtEndOfSequenceDescription, lineNumber: LINE_AFTER_HEADING,        description: 'a line way after last visible line'},
    ].forEach(function(testConfig) {
        context('and line is ' + testConfig.description, function() {
          before(function(done) {
            forceCaretIndicatorToMove(done);
          });

          testConfig.test(testConfig);
        });
      });
  });

  context('when all EASC levels are disabled', function() {
    before(function() {
      eascUtils.setEascMode([]);
    });

    after(function(done) {
      eascUtils.setEascMode(['script']);
      utils.waitForCaretIndicatorToBeVisible(done);
    });

    it('hides the caret indicator', function(done) {
      helper.waitFor(function() {
        return !utils.getCaretIndicator().is(':visible');
      }, 1900).done(done);
    });
  });
});
