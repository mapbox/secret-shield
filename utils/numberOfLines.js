'use strict';

const fs = require('fs');

function numberOfLines(filePath) {
  let file = fs.readFileSync(filePath);
  return file.toString().split('\n').length - 1;
}

module.exports = numberOfLines;
