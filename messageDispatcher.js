var MAXIMUM_POSTPONEMENTS = 3;

var messageDispatcher = function(dispatchFunction, dispatchInterval) {
  this.dispatchFunction = dispatchFunction || function() {};
  this.dispatchInterval = dispatchInterval || 0;
  this.indexedBuffer = {};
};

messageDispatcher.prototype._registerMessage = function(key, message) {
  var existingBufferRegister = this.indexedBuffer[key];
  if (existingBufferRegister) {
    // updates the message if the key already
    // exists in the buffer. It leads us to
    // consume only the most recent message with
    // this key.
    existingBufferRegister.message = message;
  } else {
    // if the key does not exists in the buffer yet,
    // creates a new register
    this.indexedBuffer[key] = {
      message: message,
      timeoutRef: null,
      postponementsCounter: 0,
    };
  }
};

messageDispatcher.prototype._consumeMessage = function(key) {
  var bufferEntry = this.indexedBuffer[key];
  var message = bufferEntry.message;
  delete this.indexedBuffer[key];
  return message;
};

/*
 * This function will schedule the sending
 * of a message according to its key.
 * There may be three cases:
 *
 *  [1] A message with the given key was
 *  not schedule before, then we schedule
 *  it.
 *
 *  [2] A message with the given key was
 *  already schedule before, so we postpone
 *  its execution.
 *
 *  [3] A message with the given key was
 *  already schedule before and was already
 *  postponed the maximum number of times
 *  allowed. So, we do not postpone it anymore.
 */
messageDispatcher.prototype._scheduleDispatch = function(key) {
  var self = this;

  var bufferEntry = self.indexedBuffer[key];
  var previousScheduler = bufferEntry.timeoutRef;
  if (previousScheduler) {
    var postponementsCounter = bufferEntry.postponementsCounter;
    var shouldDispatchNow = postponementsCounter >= MAXIMUM_POSTPONEMENTS;
    if (shouldDispatchNow) {
      // if a max potsponement times was reached,
      // do noting because the previous scheduler
      // will dispatch the message [3]
      return;
    } else {
      // cancel previous schedulers for this key
      // and postpone the execution bellow [2]
      bufferEntry.postponementsCounter += 1;
      clearTimeout(previousScheduler);
    }
  }

  // creates a new scheduler for this key [1]
  var timeoutRef = setTimeout(function() {
    var message = self._consumeMessage(key);
    self.dispatchFunction(message);
  }, self.dispatchInterval);

  bufferEntry.timeoutRef = timeoutRef;
};

messageDispatcher.prototype.dispatch = function(key, message) {
  this._registerMessage(key, message);
  this._scheduleDispatch(key);
};

exports.init = function(dispatchFunction, dispatchInterval) {
  return new messageDispatcher(dispatchFunction, dispatchInterval);
};
