describe('ep_cursortrace - api - outbound messages', function() {
  var utils, apiUtils, multipleUsers;

  var createEmptyScript = function(done) {
    done();
  }

  before(function(done) {
    multipleUsers = ep_script_copy_cut_paste_test_helper.multipleUsers;
    utils         = ep_cursortrace_test_helper.utils;
    apiUtils      = ep_cursortrace_test_helper.apiUtils;

    utils.openPadForMultipleUsers(this, createEmptyScript, done);
  });

  it('sends both users on the list of users on pad for the other user', function(done) {
    helper.waitFor(function() {
      var usersOfOtherPad = apiUtils.getLastListOfUsersOnPadOf(utils.otherUserId);
      return usersOfOtherPad.length === 2;
    }).done(function() {
      var usersOfOtherPad = apiUtils.getLastListOfUsersOnPadOf(utils.otherUserId);
      expect(usersOfOtherPad).to.contain(utils.myUserId);
      expect(usersOfOtherPad).to.contain(utils.otherUserId);
      done();
    });
  });

  it('sends both users on the list of users on pad for this user', function(done) {
    // The initial list is sent with no other users, we need to wait for the list
    // to be updated with the other user id
    helper.waitFor(function() {
      var usersOfMyPad = apiUtils.getLastListOfUsersOnPadOf(utils.myUserId);
      return usersOfMyPad.length > 1;
    }).done(function() {
      var usersOfMyPad = apiUtils.getLastListOfUsersOnPadOf(utils.myUserId);
      expect(usersOfMyPad.length).to.be(2);
      expect(usersOfMyPad).to.contain(utils.myUserId);
      expect(usersOfMyPad).to.contain(utils.otherUserId);
      done();
    });
  });

  context('when other user leaves pad', function() {
    before(function() {
      multipleUsers.closePadForOtherUser();
    });

    it('sends only one users on pad for this user', function(done) {
      helper.waitFor(function() {
        var usersOfMyPad = apiUtils.getLastListOfUsersOnPadOf(utils.myUserId);
        return usersOfMyPad.length === 1;
      }).done(function() {
        var usersOfMyPad = apiUtils.getLastListOfUsersOnPadOf(utils.myUserId);
        expect(usersOfMyPad).to.contain(utils.myUserId);
        done();
      });
    });
  });
});
