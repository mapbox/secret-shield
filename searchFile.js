'use strict';

const analyzer = require('./lib/analyzer');

function searchFile(filePath, rules) {
  return new Promise((resolve, reject) => {
    if (filePath === null || typeof filePath === 'undefined') {
      return reject({
        numCode: 254,
        code: 'MISSING_ARGS',
        msg: '--file requires a file as an argument'
      });
    }

    analyzer(filePath, rules).then(function(findings) {
      if (findings.length) {
        return resolve(findings);
      }
      return resolve([]);
    }, function(err) {
      return reject(err);
    });
  });
}

module.exports = searchFile;