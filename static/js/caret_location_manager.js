var currentCaretLocations = {};
var pendingCaretLocations = {};

exports.activatePendingCaretLocations = function() {
  currentCaretLocations = pendingCaretLocations;
  pendingCaretLocations = {};
}

exports.getCaretLocations = function() {
  return Object.values(currentCaretLocations);
}
var getCaretLocations = exports.getCaretLocations;

exports.getMyCurrentCaretLocation = function() {
  var myAuthorId = pad.getUserId();
  return currentCaretLocations[myAuthorId];
}
var getMyCurrentCaretLocation = exports.getMyCurrentCaretLocation;

exports.getCaretLocationsAfterLine = function(lineNumber) {
  var allCaretLocations = getCaretLocations();
  var caretLocationsAfterTargetLine = allCaretLocations.filter(function(caretLocation) {
    return caretLocation.line > lineNumber;
  });
  return caretLocationsAfterTargetLine;
}

exports.myPositionChanged = function(line, column) {
  var lastPositionOfMyCaret = getMyCurrentCaretLocation();
  return !lastPositionOfMyCaret || line !== lastPositionOfMyCaret.line || column !== lastPositionOfMyCaret.column;
}

exports.updateCaretLocation = function(authorId, line, column) {
  var caretLocation = buildCaretLocationData(authorId, line, column);
  currentCaretLocations[authorId] = caretLocation;
  return caretLocation;
}

exports.updatePendingCaretLocation = function(authorId, line, column) {
  var caretLocation = buildCaretLocationData(authorId, line, column);
  pendingCaretLocations[authorId] = caretLocation;
  return caretLocation;
}

exports.removeCaretLocationOf = function(authorId) {
  delete currentCaretLocations[authorId];
}

exports.buildCaretLocationData = function(authorId, line, column) {
  return {
    authorId: authorId,
    line: line,
    column: column,
  };
}
var buildCaretLocationData = exports.buildCaretLocationData;
