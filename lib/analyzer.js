'use strict';

const fs = require('fs');
const lodash = require('lodash');

const readline = require('readline');

const jsParser = require('./parsers/tokenizer/js/index');
const jsonParser = require('./parsers/tokenizer/json/index');
const yamlParser = require('./parsers/tokenizer/yml/index');
const searchString = require('./../searchString');
const extractExtension = require('./../utils/extractExtension');
const searchTemplate = require('../searchCFTemplate');
const getFileSizeInMB = require('../utils/getFileSizeInMB');
const numberOfLines = require('../utils/numberOfLines');

const FILE_PARSERS = {
  'yml': yamlParser,
  'json': jsonParser,
  'js': jsParser
};

const PARSERS_EXTENSIONS = [
  'yml',
  'json',
  'js'
];


function isValidJSON(body) {
  try {
    let data = JSON.parse(body);
    // if came to here, then valid
    return true;
  } catch(e) {
    // failed to parse
    return false;
  }
}

function isFalsePositive(candidateString) {
  if (candidateString.split(' ').length > 1) {
    return false;
  }

  return !!(
    candidateString.match('.js$') ||
    candidateString.match('.geojson$') ||
    candidateString.match('.jpg$') ||
    candidateString.match('.mbtiles$') ||
    candidateString.match('.png$') ||
    candidateString.match('.tgz$') ||
    candidateString.match('.md$') ||
    candidateString.match('.pbf$') ||
    candidateString.match('.zip$') ||
    candidateString.match('.txt$')
  );
}

function isValidFilename(filename, excludeFileRegexs) {
  for (let regex of excludeFileRegexs) {
    let match = filename.match(regex);
    if (match) {
      return false;
    }
  }
  return true;
}

function findSecrets(fileLocation, ext, rules) {
  return new Promise((resolve, reject) => {
    fs.readFile(fileLocation, 'utf-8', function(err, content) {
      if (err) {
        return reject({
          numCode: 55,
          code: 'FILE_READ_FAIL',
          msg: 'Could not read file ' + fileLocation,
          detailedError: err
        });
      }

      let candidates = FILE_PARSERS[ext](content);

      Promise.all(candidates.map(s => { return searchString(s, {rules: rules}); })).then((results) => {
        let findings = lodash.zipWith(candidates, results, function(candidate, result) {
          return {
            'file': fileLocation,
            'string': candidate,
            'finding': result
          };
        });

        findings = findings.filter((find) => {
          return find.finding.length && find.string && !isFalsePositive(find.string);
        });

        findings = findings.map((find) => {
          return {
            'file': find.file,
            'string': find.string.trim(),
            'finding': find.finding
          };
        });

        findings = lodash.uniq(findings);

        return resolve(findings);
      }, (failures) => {
        return resolve([]);
      });
    });
  });
}

function analyzer(fileLocation, rules) {
  return new Promise((resolve, reject) => {
    let excludeFileRegexs = ('special' in rules && 'IgnoreFiles' in rules.special) ? rules.special.IgnoreFiles : [];
    if (isValidFilename(fileLocation, excludeFileRegexs)) {

      const fileSizeLimit = (('special' in rules && 'FileSizeRestrictionInMB' in rules.special) ? rules.special.FileSizeRestrictionInMB : false);
      if (fileSizeLimit) {
        let fileSize = getFileSizeInMB(fileLocation);
        if (!fileLocation.endsWith('.min.js') && !fileLocation.endsWith('bundle.js') && fileSize >= parseFloat(fileSizeLimit)) {
          console.log(`Secret shield is not analyzing ${fileLocation} because the size of the file is ${fileSize} MB. Use a different rule if you want to analyze the file`);
          return resolve([]);
        }
      }

      const numberOfLinesLimit = (('special' in rules && 'NumberOfLinesRestriction' in rules.special) ? rules.special.NumberOfLinesRestriction : false);
      if (numberOfLinesLimit) {
        let noLines = numberOfLines(fileLocation);
        if (!fileLocation.endsWith('.min.js') && !fileLocation.endsWith('bundle.js') && noLines >= parseFloat(numberOfLinesLimit)) {
          console.log(`Secret shield is not analyzing ${fileLocation} because it has ${noLines} lines. Use a different rule if you want to analyze the file`);
          return resolve([]);
        }
      }

      let ext = extractExtension(fileLocation);

      let templateFindings = [];
      if (fileLocation.match('.template.js')) { // Dispatch to template searcher
        searchTemplate(fileLocation, rules).then((findings) => {
          templateFindings = findings;
        }, (failures) => {
          // ignore
        });
      }

      if (PARSERS_EXTENSIONS.indexOf(ext) !== -1) {
        findSecrets(fileLocation, ext, rules).then((findings) => {
          return resolve(templateFindings.concat(findings));
        }, (failures) => {
          return resolve(templateFindings);
        });
      } else {
        let content;
        try {
          content = fs.readFileSync(fileLocation, 'utf-8');
        } catch (err) {
          //console.log('File ' + fileLocation + ' does not exist or is a symlink.');
          return resolve([]);
        }
        if (isValidJSON(content)) {
          findSecrets(fileLocation, 'json', rules).then((findings) => {
            return resolve(findings);
          }, (failures) => {
            return resolve([]);
          });
        } else {
          let lines = [];

          const rl = readline.createInterface({
            input: fs.createReadStream(fileLocation),
            crlfDelay: Infinity
          });

          rl.on('line', (line) => {
            lines.push(line);
          });

          rl.on('close', function() {
            Promise.all(lines.map(s => { return searchString(s, {rules: rules}); })).then((results) => {
              let findings = lodash.zipWith(lines, results);
              findings = findings.map((find) => {
                return {
                  'file': fileLocation,
                  'string': find[0],
                  'finding': find[1]
                };
              });

              findings = findings.filter((find) => {
                return find.finding.length && find.string && !isFalsePositive(find.string);
              });

              findings = findings.map((find) => {
                return {
                  'file': find.file,
                  'string': find.string.trim(),
                  'finding': find.finding
                };
              });

              return resolve(findings);
            }, (failures) => {
              return resolve([]);
            });
          });
        }
      }
    } else {
      return resolve([]);
    }
  });
}

module.exports = analyzer;
