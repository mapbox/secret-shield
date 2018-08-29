'use strict';

const fs = require('fs');
const MB = 1000000.0;

function getFileSizeInMB(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size / MB;
}

module.exports = getFileSizeInMB;
