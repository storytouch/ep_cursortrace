var assert = require('assert');
var messageDispatcher = require('../../../../messageDispatcher');

describe('Message Dispatcher', function() {
  var messageDispatcherInstance, revisionNumber;

  var dispatchedMessages = [];
  var dispatchInterval = 50; // 50ms (milliseconds) 
  var dispatchFunction = function(message) {
    dispatchedMessages.push(message);
  };

  var resetDeliveredMessages = function() {
    dispatchedMessages = [];
  };

  var sleep = function(time) {
    return new Promise(function(resolve) {
      setTimeout(resolve, time);
    });
  };

  before(function() {
    messageDispatcherInstance = messageDispatcher.init(dispatchFunction, dispatchInterval);
  });

  context('dispatch()', function() {
    var messages = [];

    var subject = async function(messagesToDispatch) {
      for (var message of messagesToDispatch) {
        await sleep(message.delay);
        messageDispatcherInstance.dispatch(message.key, message);
      }
    };

    beforeEach(function() {
      resetDeliveredMessages();
    });

    context('when one message with a new key is dispatched', function() {
      beforeEach(async function() {
        messages = [{ key: 'k0', message: 'm 0', delay: 0 }];

        await subject(messages);
        await sleep(dispatchInterval);
      });

      it('dispatches the message', function() {
        assert.deepEqual(dispatchedMessages, messages);
      });
    });

    context('when two messages with different keys are dispatched within an interval lower than dispatchInterval', function() {
      beforeEach(async function() {
        messages = [
          { key: 'k0', message: 'm 0', delay: 0 },
          { key: 'k1', message: 'm 1', delay: 49 },
        ];

        await subject(messages);
        await sleep(dispatchInterval);
      });

      it('dispatches both messages', function() {
        assert.deepEqual(dispatchedMessages, messages);
      });
    });

    context('when two messages with different keys are dispatched within an interval greater than or equal to dispatchInterval', function() {
      beforeEach(async function() {
        messages = [
          { key: 'k0', message: 'm 0', delay: 0 },
          { key: 'k1', message: 'm 1', delay: 50 },
        ];

        await subject(messages);
        await sleep(dispatchInterval);
      });

      it('dispatches both messages', function() {
        assert.deepEqual(dispatchedMessages, messages);
      });
    });

    context('when two messages with the same key are dispatched within an interval lower than dispatchInterval', function() {
      beforeEach(async function() {
        messages = [
          { key: 'k0', message: 'm 0', delay: 0 },
          { key: 'k0', message: 'm 1', delay: 49 },
        ];

        await subject(messages);
        await sleep(dispatchInterval);
      });

      it('dispatches only the last message', function() {
        assert.deepEqual(dispatchedMessages, [messages[1]]);
      });
    });

    context('when two messages with the same key are dispatched within an interval greater than or equal to dispatchInterval', function() {
      beforeEach(async function() {
        messages = [
          { key: 'k0', message: 'm 0', delay: 0 },
          { key: 'k0', message: 'm 1', delay: 50 },
        ];

        await subject(messages);
        await sleep(dispatchInterval);
      });

      it('dispatches both messages', function() {
        assert.deepEqual(dispatchedMessages, messages);
      });
    });

    // simulates the case where messages could be postponed forever
    context('when a number greater than MAXIMUM_POSTPONEMENTS of messages with the same key are dispatched within an interval lower than dispatchInterval', function() {
      beforeEach(async function() {
        messages = [
          { key: 'k0', message: 'm 0', delay: 0  },
          { key: 'k0', message: 'm 1', delay: 40 }, //  40ms passed, postponed 1x
          { key: 'k0', message: 'm 2', delay: 40 }, //  80ms passed, postponed 2x
          { key: 'k0', message: 'm 3', delay: 40 }, // 120ms passed, postponed 3x
          { key: 'k0', message: 'm 4', delay: 40 }, // 160ms passed <- Must be dispatched
          { key: 'k0', message: 'm 5', delay: 40 }, // 200ms passed <- Must be dispatched
        ];

        await subject(messages);
        await sleep(dispatchInterval);
      });

      it('dispatches the message after MAXIMUM_POSTPONEMENTS is reached and the last message', function() {
        assert.deepEqual(dispatchedMessages, [messages[4], messages[5]]);
      });
    });
  });
});
