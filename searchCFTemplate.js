'use strict';

const fs = require('fs');
const readline = require('readline');
const templateAnalyzer = require('./lib/templateAnalyzer');

function searchTemplate(filePath, rules) {
  return new Promise((resolve, reject) => {
    if (filePath === null || typeof filePath === 'undefined') {
      return reject({
        numCode: 254,
        code: 'MISSING_ARGS',
        msg: '--template requires a template file as an argument'
      });
    }

    let secureParameters = ('special' in rules && 'CFTemplateSecureParameters' in rules.special) ? rules.special.CFTemplateSecureParameters : [];

    let fileContents = '';
    readline.createInterface({
      input: fs.createReadStream(filePath),
      crflDelay: Infinity
    }).on('line', line => {
      fileContents += line + '\n';
    }).on('close', () => {
      templateAnalyzer(fileContents, secureParameters, filePath).then((findings) => {
        return resolve(findings);
      }, (failures) => {
        return reject({
          numCode: 216,
          code: 'CF_TEMPLATE_PARSE_FAIL',
          msg: 'CFTemplate file parsing failed.',
          detailedError: failures
        });
      });
    });
  });
}

module.exports = searchTemplate;