'use strict';

const PQueue = require('p-queue');
const lodash = require('lodash');
const clone = require('git-clone');

const readfiles = require('./utils/readfiles');
const analyzer = require('./lib/analyzer');

// @TODO: Use temp directory
const uuidv4 = require('uuid/v4');
let baseDir = `/tmp/${uuidv4()}/`;

const queue = new PQueue({concurrency: 10});

function searchRepo(repo, checkout, rules) {
  return new Promise((resolve, reject) => {
    let options = {
      shallow: true
    };

    if (repo === null || typeof repo === 'undefined') {
      return reject({
        numCode: 255,
        code: 'MISSING_ARGS',
        msg: '--repository requires a repository as an argument'
      });
    }

    if (checkout !== null && typeof checkout !== 'undefined') {
      options = {
        checkout: checkout
      };
    }

    clone(repo, baseDir + repo, options, function(err) {
      if (err) {
        return reject({
          numCode: 32,
          code: 'CLONE_FAIL',
          msg: 'Could not clone repository ' + repo,
          defailedError: err
        });
      }

      let directory = baseDir + repo;

      let options = {
        readContents: false,
        hidden: true,
        rejectOnError: false,
        exclude: rules.special.IgnoreFiles
      };

      readfiles(directory, options).then((files) => {
        let analizeTasks = files.map((f) => queue.add(() => {
          let fileLocation = directory + '/' + f;
          return analyzer(fileLocation, rules);
        }));

        Promise.all(analizeTasks).then((findings) => {
          findings = lodash.flatten(findings).map(finding => {
            finding.file = finding.file.slice(baseDir.length);
            finding.finding = finding.finding.join('\n');
            return finding;
          });

          if (findings.length) {
            return resolve(findings);
          }
          return resolve([]);
        });
      }).catch((err) => {
        return reject({
          numCode: 33,
          code: 'READ_FAIL',
          msg: 'Failed to read cloned files in ' + baseDir,
          detailedError: err
        });
      });
    });
  });
}

module.exports = searchRepo;