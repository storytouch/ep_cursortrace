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

  it('sends this user on the list of users on pad for the other user', function(done) {
    var usersOfOtherPad = apiUtils.getLastListOfUsersOnPadOf(utils.otherUserId);
    expect(usersOfOtherPad.length).to.be(1);
    expect(usersOfOtherPad[0]).to.be(utils.myUserId);
    done();
  });

  it('sends the other user on the list of users on pad for this user', function(done) {
    // The initial list is sent with no other users, we need to wait for the list
    // to be updated with the other user id
    helper.waitFor(function() {
      var usersOfMyPad = apiUtils.getLastListOfUsersOnPadOf(utils.myUserId);
      return usersOfMyPad.length > 0;
    }).done(function() {
      var usersOfMyPad = apiUtils.getLastListOfUsersOnPadOf(utils.myUserId);
      expect(usersOfMyPad.length).to.be(1);
      expect(usersOfMyPad[0]).to.be(utils.otherUserId);
      done();
    });
  });

  context('when other user leaves pad', function() {
    before(function() {
      multipleUsers.closePadForOtherUser();
    });

    it('sends an empty list of users on pad for this user', function(done) {
      var usersOfMyPad = apiUtils.getLastListOfUsersOnPadOf(utils.myUserId);
      expect(usersOfMyPad).to.be.empty;
      done();
    });
  });
});
