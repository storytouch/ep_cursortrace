var _ = require('ep_etherpad-lite/static/js/underscore');

// [A1,...,A10]
var COLORS_A = _(_.range(1, 11)).map(function(i) { return 'A' + i });
// [B11,...,B20]
var COLORS_B = _(_.range(11, 21)).map(function(i) { return 'B' + i });
// [C21,...,C30]
var COLORS_C = _(_.range(21, 31)).map(function(i) { return 'C' + i });
// [D21,...,D30]
var COLORS_D = _(_.range(31, 41)).map(function(i) { return 'D' + i });

exports.COLOR_NAMES = _.union(COLORS_A, COLORS_B, COLORS_C, COLORS_D);

exports.getColorHash = function(colorName, alpha) {
  alpha = alpha == undefined ? 1 : alpha;
  var rgb = COLORS_RGB[colorName] || COLORS_RGB['A2']; // default to A2
  return 'rgba(' + rgb + ', ' + alpha + ')';
}

var COLORS_RGB = {
  A1:  '255, 0  , 0',
  A2:  '255, 126, 0',
  A3:  '255, 204, 0',
  A4:  '80 , 240, 0',
  A5:  '0  , 194, 0',
  A6:  '20 , 240, 242',
  A7:  '22 , 170, 255',
  A8:  '32 , 110, 255',
  A9:  '160, 45 , 220',
  A10: '255, 24 , 128',
  B11: '162, 8  , 12',
  B12: '162, 83 , 8',
  B13: '164, 135, 32',
  B14: '54 , 153, 8',
  B15: '6  , 123, 6',
  B16: '20 , 152, 154',
  B17: '22 , 112, 163',
  B18: '29 , 76 , 163',
  B19: '105, 35 , 140',
  B20: '163, 24 , 86',
  C21: '234, 144, 146',
  C22: '234, 189, 144',
  C23: '237, 220, 160',
  C24: '169, 227, 142',
  C25: '140, 207, 140',
  C26: '150, 227, 229',
  C27: '153, 205, 235',
  C28: '158, 185, 235',
  C29: '202, 162, 222',
  C30: '235, 153, 190',
  D31: '105, 45 , 60',
  D32: '125, 83 , 55',
  D33: '150, 140, 90',
  D34: '110, 135, 95',
  D35: '75 , 100, 85',
  D36: '75 , 125, 130',
  D37: '65 , 105, 125',
  D38: '75 , 85 , 105',
  D39: '90 , 65 , 105',
  D40: '105, 70 , 85',
}
