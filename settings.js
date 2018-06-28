settings = require('ep_etherpad-lite/node/utils/Settings');

exports.clientVars = function (hook, context, cb) {
  var fade_out_timeout = settings.ep_cursortrace ? settings.ep_cursortrace.fade_out_timeout : 2000;

  return cb({ ep_cursortrace: { fade_out_timeout: fade_out_timeout } });
};
