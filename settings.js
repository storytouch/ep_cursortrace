settings = require('ep_etherpad-lite/node/utils/Settings');

exports.clientVars = function (hook, context, cb) {
  var fade_out_timeout = getValueOrDefaultTo('fade_out_timeout', 2000);
  var fade_out_name_timeout = getValueOrDefaultTo('fade_out_name_timeout', 0);

  return cb({
    ep_cursortrace: {
      fade_out_timeout: fade_out_timeout,
      fade_out_name_timeout: fade_out_name_timeout,
    }
  });
};

var getValueOrDefaultTo = function(settingName, defaultValue) {
  var valueOnSettings = settings.ep_cursortrace[settingName];
  return valueOnSettings === undefined ? defaultValue : valueOnSettings;
}
