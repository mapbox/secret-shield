'use strict';

const PQueue = require('p-queue');
const lodash = require('lodash');

const readfiles = require('./utils/readfiles');
const analyzer = require('./lib/analyzer');

const queue = new PQueue({concurrency: 10});


function searchDirectory(directory, rules) {
  return new Promise((resolve, reject) => {
    if (directory === null || typeof directory === 'undefined') {
      directory = './';
    }

    if (!directory.endsWith('/')) {
      directory = directory + '/';
    }

    let options = {
      readContents: false,
      hidden: true,
      rejectOnError: false,
      exclude: rules.special.IgnoreFiles
    };
    readfiles(directory, options).then((files) => {
      let analizeTasks = files.map((f) => queue.add(() => {
        let fileLocation = directory + f;
        return analyzer(fileLocation, rules);
      }));

      Promise.all(analizeTasks).then((findings) => {
        if (findings.length) {
          findings = lodash.flatten(findings);
          return resolve(findings);
        }
        return resolve([]);
      }, (failures) => {
        console.log(failures);

        return reject({
          numCode: 50,
          code: 'DIR_SEARCH_FAIL',
          msg: 'secret-shield search-directory failed.'
        });
      });
    }).catch((err) => {
      return reject({
        numCode: 49,
        code: 'DIR_READ_FAIL',
        msg: 'Failed to read directory ' + directory,
        detailedError: err
      });
    });
  });
}

module.exports = searchDirectory;