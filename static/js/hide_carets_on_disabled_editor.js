var eascUtils = require('ep_script_toggle_view/static/js/utils');

var DISABLED_CONTAINER_CLASS = 'disabled';

exports.startListeningToEditorDisabling = function() {
  var utils = pad.plugins.ep_cursortrace.utils;
  var $caretIndicatorContainer = utils.getPadOuter().find('#outerdocbody');
  utils.getPadInner().on(eascUtils.EASC_CHANGED_EVENT, function() {
    var editorIsDisabled = !eascUtils.isEditorEditable();
    $caretIndicatorContainer.toggleClass(DISABLED_CONTAINER_CLASS, editorIsDisabled);
  });
}
