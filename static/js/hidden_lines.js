// This code was initially adapted from ep_comments/static/js/textMarkIconsPosition.js,
// but had been modified a lot since its creation.
var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var utils = require('./utils');

exports.getVisiblePosition = function(line, column) {
  var caretPosition = buildCaretPositionData(line, column);

  var $baseLine = utils.getLineOnEditor(line);
  var baseLineNotVisible = !lineIsVisible($baseLine.get(0));
  if (baseLineNotVisible) {
    caretPosition = getPositionOfClosestVisibleLine($baseLine);
  }

  return caretPosition;
}

var buildCaretPositionData = function(line, column) {
  return {
    line: line,
    column: column,
  }
}

var lineIsVisible = function(line) {
  return line.getBoundingClientRect().height > 0;
}

var getPositionOfClosestVisibleLine = function($hiddenLine) {
  var visibleLineInfo = findClosestVisibleLineAndDirectionOfSearch($hiddenLine);
  var $visibleLine = $(visibleLineInfo.line);
  var searchedForward = visibleLineInfo.searchedForward;

  var lineNumber = $visibleLine.index();
  var columnNumber = searchedForward ? 0 : $visibleLine.text().length;
  return buildCaretPositionData(lineNumber, columnNumber);
}

/* when we have a caret in a line that is not visible we have some possibilities:
   [1] the caret is on a hidden SM:
      [1.a] there is a visible SM on the same block above caret line: use the end of previous visible line
      [1.b] there is NO visible SM on the same block above caret line: use the beginning of next visible line
   [2] the caret is on a hidden SE:
      [2.a] SE is before 1st scene of script: use the beginning of next visible line
      [2.b] SE belongs to a scene: use the end of previous visible line
*/
var findClosestVisibleLineAndDirectionOfSearch = function($hiddenLine) {
  var closestVisibleLine;
  var searchedForward = false;

  var hiddenLineIsASceneMark = $hiddenLine.hasClass('sceneMark');
  if (hiddenLineIsASceneMark) { // [1]
    closestVisibleLine = getClosestVisibleSMAbove($hiddenLine); // [1.a]
    if (!closestVisibleLine) { // [1.b]
      closestVisibleLine = getClosestVisibleSMOrHeadingBelow($hiddenLine);
      searchedForward = true;
    }
  } else { // [2]
    if (lineIsBeforeFirstScene($hiddenLine)) { // [2.a]
      closestVisibleLine = getClosestVisibleLineBelow($hiddenLine);
      searchedForward = true;
    } else { // [2.b]
      closestVisibleLine = getClosestVisibleLineAbove($hiddenLine);
    }
  }

  return {
    line: closestVisibleLine,
    searchedForward: searchedForward,
  }
}

var getClosestVisibleSMAbove = function($baseLine) {
  var $sceneMarksAboveBaseLine = $baseLine.prevUntil(':not(.sceneMark)');
  // $sceneMarksAboveBaseLine are on reversed order
  return getFirstVisibleLineOfSet($sceneMarksAboveBaseLine);
}

var getClosestVisibleSMOrHeadingBelow = function($baseLine) {
  var $sceneMarksBelowBaseLine = $baseLine.nextUntil(':not(.sceneMark, .withHeading)');
  return getFirstVisibleLineOfSet($sceneMarksBelowBaseLine);
}

var getClosestVisibleLineAbove = function($baseLine) {
  var $linesAbove = $baseLine.prevAll();
  // $linesAbove are on reversed order
  return getFirstVisibleLineOfSet($linesAbove);
}

var getClosestVisibleLineBelow = function($baseLine) {
  var $linesBelow = $baseLine.nextAll();
  return getFirstVisibleLineOfSet($linesBelow);
}

var lineIsBeforeFirstScene = function($line) {
  var lineNumberOfFirstScene = getLineNumberOfFirstScene();
  var lineNumberOfBaseLine = $line.index();
  return lineNumberOfBaseLine <= lineNumberOfFirstScene;
}

var getLineNumberOfFirstScene = function() {
  var $beginningOfFirstScene = utils.getPadInner().find('div.sceneMark').first();
  return $beginningOfFirstScene.index();
}

var getFirstVisibleLineOfSet = function($lines) {
  return $lines.get().find(lineIsVisible);
}
