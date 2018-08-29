'use strict';

const child = require('child_process');
const lodash = require('lodash');
const searchString = require('./searchString');
const is_node_four = require('./utils/is_node_four');

function searchDiff(toplevel, file, against, rules) {
  return new Promise((resolve, reject) => {
    let lines;
    try {
      lines = child.execSync('git diff --unified=0 ' + against + ' -- ' + file, {cwd: toplevel})
        .toString()
        .split('\n')
        .slice(4, -1)
        .filter(line => line[0] === '+')
        .map(line => line.slice(1));
    } catch(err) {
      return reject({
        numCode: 126,
        code: 'GIT_DIFF_FILE_FAIL',
        msg: `Git diff failed on file ${file}`,
        detailedError: err
      });
    }

    const numberOfLinesLimit = (('special' in rules && 'GitHookNumberOfChangesRestriction' in rules.special) ? rules.special.GitHookNumberOfChangesRestriction: false);
    if (numberOfLinesLimit) {
      if (lines.length >= parseFloat(numberOfLinesLimit)) {
        console.log(`Skipping ${file} because it contains to many changes (${lines.length}).`);
        return resolve([]);
      }
    }

    let newLines = lines;
    Promise.all(lines.map(s => {
      return searchString(s, {rules: rules}); }
    )
    ).then((results) => {
      let findings = lodash.zipWith(newLines, results, function(line, result) {
        return {
          'file': file,
          'string': line,
          'finding': result.join('\n')
        };
      });

      findings = findings.filter((finding) => {
        return finding.finding.length && finding.string;
      });
      return resolve(findings);
    });
  });
}

function preCommit(rules) {
  return new Promise((resolve, reject) => {
    let headers = [
      { value: 'file', width: 25, headerAlign: 'center' },
      { value: 'string', width: 45, headerAlign: 'center' },
      { value: 'finding', width: 20, headerAlign: 'center' }
    ];

    let toplevel;
    try {
      toplevel = child.execSync('git rev-parse --show-toplevel 2>/dev/null').toString().slice(0, -1);
      // If the root of your filesystem is a repository, you deserve whatever comes to you.
    } catch (err) {
      return reject({
        numCode: 128,
        code: 'NOT_A_REPO',
        msg: 'Could not run pre-commit check: you\'re not in a git repository'
      });
    }

    let against;
    try {
      against = child.execSync('git rev-parse --verify HEAD 2>/dev/null').slice(0, -1);
    } catch (err) {
      against = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
    }

    let files;
    try {
      files = child.execSync('git diff-index --name-status ' + against)
        .toString()
        .split('\n')
        .slice(0, -1)
        .filter(filename => filename[0] === 'A' || filename[0] === 'M')
        .map(filename => filename.slice(2));
    } catch (err) {
      return reject({
        numCode: 127,
        code: 'GIT_DIFF_NAME_FAIL',
        msg: 'Could not run pre-commit check: diff failed'
      });
    }

    if (files.length === 0) {
      return resolve('No secrets were found because there were no changes.');
    }

    let promises = [];
    for (let file of files) {
      promises.push(searchDiff(toplevel, file, against, rules));
    }

    Promise.all(promises).then((findings) => {
      findings = lodash.flatten(findings);
      if (findings.length) { //we found something
        findings = lodash.flatten(findings);
        let output;
        if (is_node_four()) {
          let lines = [];
          for (let result of findings) {
            lines.push(`${result.finding} | ${result.string} | ${result.file}`);
          }
          output = lines.join('\n');
        } else {
          const table = require('tty-table');
          let t1 = table(headers, findings);
          output = t1.render();
        }
        return reject({
          numCode: 1,
          code: 'SECRET_FOUND',
          msg: 'Your commit was blocked because secret-shield found some potential secrets. Please review the above findings. To commit anyway, run git commit with --no-verify',
          detailedError: output
        });
      }
      return resolve('No secrets were found.');
    }, (failures) => {
      return reject({
        numCode: 125,
        code: 'PRE_COMMIT_SEARCH_FAIL',
        msg: 'secret-shield could not search for secrets due to an error.' // TODO fix this message.
      });
    });
  });
}

module.exports = preCommit;
