// This code was adapted from ep_comments/static/js/textMarkIconsPosition.js
var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var utils = require('./utils');

exports.getVisiblePosition = function(line, column) {
  var caretPosition = buildCaretPosition(line, column);

  var $baseLine = utils.getLineOnEditor(line);
  var baseLineNotVisible = !lineIsVisible($baseLine.get(0));
  if (baseLineNotVisible) {
    caretPosition = getPositionOnClosestVisibleLine($baseLine);
  }

  return caretPosition;
}

var lineIsVisible = function(line) {
  return line.getBoundingClientRect().height > 0;
}

// when we have a caret in a line that is not visible we have 2 possibilities:
// [1] the caret is on a hidden SM, so we use the beginning of next visible line
// [2] the caret is on a hidden SE, so we use the end of previous visible line
var getPositionOnClosestVisibleLine = function($baseLine) {
  var searchForward = $baseLine.hasClass('sceneMark');
  var getVisibleLine = searchForward ? getNextVisibleLine : getPreviousVisibleLine; // [1] / [2]
  var visibleLine = getVisibleLine($baseLine);
  var lineNumber = $(visibleLine).index();
  var columnNumber = searchForward ? 0 : $(visibleLine).text().length - 1; // [1] / [2]
  return buildCaretPosition(lineNumber, columnNumber);
}

var getNextVisibleLine = function($sceneMarkNotVisible) {
  var $nextSceneMarks = $sceneMarkNotVisible.nextUntil('div:has(heading)').andSelf();
  var $heading = $nextSceneMarks.last().next();
  var $nextSceneMarksWithHeading = $nextSceneMarks.add($heading);
  return getFirstVisibleLineOfSet($nextSceneMarksWithHeading);
}

// If we are on a SE and it is hidden, the previous visible line must be a SM.
// So we [1] go back to the heading; then [2] get the set of SMs of that heading
var getPreviousVisibleLine = function($scriptElementNotVisible) {
  var $heading = $scriptElementNotVisible.prevUntil('div:has(heading)').andSelf().first(); // [1]
  var $previousSceneMarks = $heading.prevUntil('div:not(.sceneMark)'); // [2]
  return getLastVisibleLineOfSet($previousSceneMarks);
}

var getFirstVisibleLineOfSet = function($lines) {
  return $lines.get().find(lineIsVisible);
}
var getLastVisibleLineOfSet = function($lines) {
  return $lines.get().reverse().find(lineIsVisible);
}

var buildCaretPosition = function(line, column) {
  return {
    line: line,
    column: column,
  }
}
