var api = require('./api');

var currentCaretLocations = {};
var pendingCaretLocations = {};

exports.activatePendingCaretLocations = function() {
  currentCaretLocations = pendingCaretLocations;
  pendingCaretLocations = {};
  sendNewUsersListOnApi();
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
  var authorWasNotOnPadBefore = !currentCaretLocations[authorId];

  var caretLocation = buildCaretLocationData(authorId, line, column);
  currentCaretLocations[authorId] = caretLocation;

  if (authorWasNotOnPadBefore) {
    sendNewUsersListOnApi();
  }

  return caretLocation;
}

exports.updatePendingCaretLocation = function(authorId, line, column) {
  var caretLocation = buildCaretLocationData(authorId, line, column);
  pendingCaretLocations[authorId] = caretLocation;
}

exports.removeCaretLocationOf = function(authorId) {
  delete currentCaretLocations[authorId];
  sendNewUsersListOnApi();
}

exports.buildCaretLocationData = function(authorId, line, column) {
  return {
    authorId: authorId,
    line: line,
    column: column,
  };
}
var buildCaretLocationData = exports.buildCaretLocationData;

var sendNewUsersListOnApi = function() {
  var authorsOnThisPad = Object.keys(currentCaretLocations);

  // don't need to send myAuthorId on the api
  var myAuthorId = pad.getUserId();
  var authorsWithoutMe = authorsOnThisPad.filter(function(authorId) {
    return authorId !== myAuthorId;
  });

  api.triggerListOfUsersOnThisPad(authorsWithoutMe);
}
