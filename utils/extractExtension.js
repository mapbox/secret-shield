'use strict';

function extractExtension(file){
  let parts = file.split('.');
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }
  return '';
}

module.exports = extractExtension;
