var caretLocationManager = function() {
  this.currentCaretLocations = {};
  this.pendingCaretLocations = {};
  this.myAuthorId = pad.getUserId();
  this.api = pad.plugins.ep_cursortrace.api;
}

caretLocationManager.prototype.activatePendingCaretLocations = function() {
  this.currentCaretLocations = this.pendingCaretLocations;
  this.pendingCaretLocations = {};
  this._sendNewUsersListOnApi();
}

caretLocationManager.prototype.getCaretLocations = function() {
  return Object.values(this.currentCaretLocations);
}

caretLocationManager.prototype.getMyCurrentCaretLocation = function() {
  return this.currentCaretLocations[this.myAuthorId];
}

caretLocationManager.prototype.getCaretLocationsAfterLine = function(lineNumber) {
  var allCaretLocations = this.getCaretLocations();
  var caretLocationsAfterTargetLine = allCaretLocations.filter(function(caretLocation) {
    return caretLocation.line > lineNumber;
  });
  return caretLocationsAfterTargetLine;
}

caretLocationManager.prototype.myPositionChanged = function(line, column) {
  var lastPositionOfMyCaret = this.getMyCurrentCaretLocation();
  return !lastPositionOfMyCaret ||
         line !== lastPositionOfMyCaret.line ||
         column !== lastPositionOfMyCaret.column;
}

caretLocationManager.prototype.updateCaretLocation = function(authorId, line, column) {
  var authorWasNotOnPadBefore = !this.currentCaretLocations[authorId];

  var caretLocation = this._buildCaretLocationData(authorId, line, column);
  this.currentCaretLocations[authorId] = caretLocation;

  if (authorWasNotOnPadBefore) {
    this._sendNewUsersListOnApi();
  }

  return caretLocation;
}

caretLocationManager.prototype.updatePendingCaretLocation = function(authorId, line, column) {
  var caretLocation = this._buildCaretLocationData(authorId, line, column);
  this.pendingCaretLocations[authorId] = caretLocation;
}

caretLocationManager.prototype.removeCaretLocationOf = function(authorId) {
  delete this.currentCaretLocations[authorId];
  this._sendNewUsersListOnApi();
}

caretLocationManager.prototype._buildCaretLocationData = function(authorId, line, column) {
  return {
    authorId: authorId,
    line: line,
    column: column,
  };
}

caretLocationManager.prototype._sendNewUsersListOnApi = function() {
  var authorsOnThisPad = Object.keys(this.currentCaretLocations);
  this.api.triggerListOfUsersOnThisPad(authorsOnThisPad);
}

exports.initialize = function() {
  return new caretLocationManager();
}
