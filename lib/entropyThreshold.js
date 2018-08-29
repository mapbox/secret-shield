'use strict';

// Returns a good entropy threshold given the specified percentile

const entropyTable = require('../config/tables/entropy100000.json');

module.exports = (stringType, stringLength, percentile) => {
  const ztable = {
    '95': 1.645,
    '99': 2.326,
    '99.5': 2.576,
    '99.9': 3.090,
    '99.95': 3.291
  };

  let threshold = Infinity;
  try {
    threshold = entropyTable[stringType][stringLength.toString()].mean;
    threshold -= ztable[percentile] * entropyTable[stringType][stringLength.toString()].stdev;
  } catch (err) {
    return Infinity;
  }
  return threshold;
};