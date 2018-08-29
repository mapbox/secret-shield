#!/usr/bin/env node
'use strict';

// Wrapper around various utilities for manually or automatically searching for secrets.
// REQUIRED PARAMETER FUNCTIONALITY: --pre-commit. secret-shield --pre-commit MUST work.

/* eslint-disable no-underscore-dangle */

const args = require('command-line-args');
const path = require('path');
const fs = require('fs');
const os = require('os');

const preCommit = require('../preCommit');
const checkAndRun = require('../checkInstalled').checkAndRun;
const addHooks = require('../addHooks');
const removeHooks = require('../removeHooks');
const searchString = require('../searchString');
const searchFile = require('../searchFile');
const searchRepo = require('../searchRepo');
const searchTemplate = require('../searchCFTemplate');
const searchDirectory = require('../searchDirectory');
const update = require('../update');
const setRulesDisabledFlag = require('../lib/setRulesDisabledFlag');
const is_node_four = require('./../utils/is_node_four');

const helpLong = `secret-shield: Finds secrets in repositories, files, or strings.

OPTIONS:
  GIT OPTIONS
    --pre-commit: checks for new secrets since the last commit
    --add-hooks <local|global>: create pre-commit hooks; default global
    --remove-hooks <local|global>: remove the pre-commit hooks; default global

  SEARCH OPTIONS
    --string (-s) <string>: search through a string
    --directory (-d) <directory>: search through a directory (default ./)
    --file (-f) <file>: search through a file
    --repository (-r) <repository> [branch]: clone and searches a git repository

  CUSTOM RULES
    --config (-C) <path/to/config.json>: use a given configuration file
    --config (-C) <configName>: load a configuration from the included configurations
    --enable <rules>: enable specified rules if they are defined in the rules config file
    --disable <rules>: disable specified rules if they are defined in the rules config file
    --output <json|json-blob|table>: specify the output type; default: table

  MISCELLANEOUS
    --help: display this help
    --info: get debug information about your secret-shield installation
    --update: update secret-shield to the latest version
    --check-and-run YYYY-MM-DD: see documentation; should ONLY be run inside an npm script

EXAMPLES:
  secret-shield --add-hooks global
  secret-shield --repo git@github.com:mapbox/secret-shield --disable "Short high-entropy string"
  secret-shield --string "password = 'wbhnjvknttsogcdncgvo'"`;
const helpShort = `Usage: secret-shield <--string|--file|--directory|--repository> target
For detailed help run secret-shield --help or check the documentation.`;

const optionDefinitions = [
  {name: 'pre-commit'},
  {name: 'add-hooks', type: String},
  {name: 'remove-hooks', type: String},
  {name: 'repository', alias: 'r', type: String, multiple: true},
  {name: 'string', alias: 's', type: String},
  {name: 'file', alias: 'f', type: String},
  {name: 'directory', alias: 'd', type: String},
  {name: 'config', alias: 'C', type: String},
  {name: 'enable', alias: 'E', type: String, multiple: true},
  {name: 'disable', alias: 'D', type: String, multiple: true},
  {name: 'output', alias: 'o', type: String},
  {name: 'help', alias: 'h', type: String},
  {name: 'redact', alias: 'R', type: Number},
  {name: 'template', alias: 't', type: String},
  {name: 'info', alias: 'i', type: String},
  {name: 'run-id', type: String},
  {name: 'update'},
  {name: 'check-and-run', type: String}
];

const headers = [
  { value: 'file', width: 25, headerAlign: 'center' },
  { value: 'string', width: 45, headerAlign: 'center' },
  { value: 'finding', width: 20, headerAlign: 'center' }
];

function secretShield() {
  const options = args(optionDefinitions, {camelCase: true});
  let rules;

  try {
    let rulesPath = fs.readFileSync(path.resolve(__dirname, '../config/defaultRules'),'utf-8');
    rules = require('../config/rules/' + rulesPath + '.json');
  } catch (err) {
    console.error('You need to specify a default ruleset in ' + __dirname + '/../config/defaultRules. Default: minimal');
    process.exit(252);
  }
  let redact = null;
  if (options.hasOwnProperty('redact')) {
    if (options.redact) {
      redact = options.redact;
    } else {
      redact = 0;
    }
  }
  /////////////////////////////////////////////////////////////////////////////
  // Modifiers: any number of these can be given

  if (options.hasOwnProperty('config')) {
    try {
      if (options.config.slice(-5) === '.json') {
        rules = require(path.resolve(options.config));
      } else {
        rules = require('../config/rules/' + options.config + '.json');
      }
    } catch (err) {
      console.error('Invalid configuration file provided.');
      console.error(err);
      process.exit(16);
    }
  }

  // so much for little logic
  if (options.hasOwnProperty('disable')) {
    setRulesDisabledFlag(rules, true, options.disable).then((newRules) => {
      rules = newRules;
    }, (fail) => {
      console.error('Could not parse configuration disable');
      console.error(fail);
      process.exit(17);
    });
  }
  if (options.hasOwnProperty('enable')) {
    setRulesDisabledFlag(rules, false, options.enable).then((newRules) => {
      rules = newRules;
    }, (fail) => {
      console.error('Could not parse configuration enable');
      console.error(fail);
      process.exit(18);
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // Main options: only one can be given

  if (options.hasOwnProperty('preCommit')) {
    preCommit(rules).then(function(result) {
      process.exit(0);
    }, function(err) {
      if (err.code === 'SECRET_FOUND') {
        console.error(err.detailedError);
        console.error(err.msg);
        process.exit(err.numCode);
      }
      console.log(err.msg);
      process.exit(0); // Ignore all errors that are not secret-related.
    });
  }

  else if (options.hasOwnProperty('checkAndRun')) {
    process.exit(checkAndRun(options.checkAndRun));
  }

  else if (options.hasOwnProperty('update')) {
    update().then(function(result) {
      process.exit(0);
    }, function(err) {
      console.error(err.msg);
      process.exit(err.numCode);
    });
  }

  else if (options.hasOwnProperty('addHooks')) {
    addHooks(options.addHooks).then(function(result) {
      console.log(result);
      process.exit(0);
    }, function(err) {
      console.error(err.msg);
      process.exit(err.numCode);
    });
  }

  else if (options.hasOwnProperty('removeHooks')) {
    removeHooks(options.removeHooks).then(function(result) {
      console.log(result);
      process.exit(0);
    }, function(err) {
      console.error(err.msg);
      process.exit(err.numCode);
    });
  }

  else if (options.hasOwnProperty('string')) {
    searchString(options.string, {rules: rules}).then(function(results) {
      console.log(results);
    }, function(err) {
      console.error(err.msg);
      process.exit(err.numCode);
    });
  }

  else if (options.hasOwnProperty('repository')) {
    let repo, branch, target;
    try {
      repo = options.repository[0];
      target = repo;
      branch = options.repository[1];
      if (typeof branch !== undefined && branch) {
        target = target + ':' + branch;
      }
    } finally {
      searchRepo(repo, branch, rules).then(function(results) {
        outputResults(results, rules, options, redact, target);
        process.exit(0);
      }, function(err) {
        console.error(err.msg);
        process.exit(err.numCode);
      });
    }
  }

  else if (options.hasOwnProperty('directory')) {
    searchDirectory(options.directory, rules).then(function(results) {
      outputResults(results, rules, options, redact);
      process.exit(0);
    }, function(err) {
      console.error(err.msg);
      process.exit(err.numCode);
    });
  }

  else if (options.hasOwnProperty('file')) {
    searchFile(options.file, rules).then(function(results) {
      outputResults(results, rules, options, redact);
      process.exit(0);
    }, function(err) {
      console.error(err.msg);
      process.exit(err.numCode);
    });
  }

  else if (options.hasOwnProperty('template')) {
    searchTemplate(options.template, rules).then(function(results) {
      outputResults(results, rules, options, redact);
      process.exit(0);
    }, function(err) {
      console.error(err);
      process.exit(err.numCode);
    });
  }

  else if (options.hasOwnProperty('help')) {
    console.log(helpLong);
  }

  else if (options.hasOwnProperty('info')) {
    let packageInfo = fs.readFileSync(path.resolve(__dirname, '../package.json'));
    packageInfo = JSON.parse(packageInfo);

    let info = {
      'version': packageInfo.version,
      'node': process.version,
      'os_platform': os.platform(),
      'os_release': os.release(),
      'installed_dir': __dirname
    };
    console.log(JSON.stringify(info, null, 2));
  }

  else {
    console.log(helpShort);
  }
}

function tableOutput(results) {
  if (is_node_four()) {
    let lines = [];
    for (let result of results) {
      lines.push(`${result.finding} | ${result.string} | ${result.file}`);
    }
    return lines.join('\n');
  } else {
    const table = require('tty-table');
    let t1 = table(headers, results);
    return t1.render();
  }
}

function maybeRedact(results, redaction) {
  if (redaction === null) {
    return results; // Don't redact
  }

  return results.map(result => {
    result.string = result.string.trim().slice(0, redaction) + '[REDACTED]';
    return result;
  });
}

function outputResults(results, rules, options, redaction, target) {

  if (options.hasOwnProperty('output') && options.output === 'json-blob') {
    let report = {
      'results': maybeRedact(results, redaction),
      'meta': {
        'rules_info': rules._info,
        'rules_user': rules._user,
        'date': new Date(),
        'target': target ? target : ''
      }
    };

    if (options.runId) {
      report.meta.runId = options.runId;
    }

    console.log(JSON.stringify(report));
    return;
  }

  if (options.hasOwnProperty('output') && options.output === 'json') {
    let report = maybeRedact(results, redaction).map(result => {
      let singleReport = {
        result: result,
        meta: {
          rules_info: rules._info,
          rules_user: rules._user,
          date: new Date(),
          target: target ? target : ''
        }
      };

      if (options.runId) {
        singleReport.meta.runId= options.runId;
      }
      return singleReport;
    });

    for (let line of report) {
      console.log(JSON.stringify(line));
    }
    return;
  }

  if (results.length) {
    console.log(tableOutput(maybeRedact(results, redaction)));
    return;
  }

  console.log('No secrets found.');
  return;
}

try {
  secretShield();
} catch (e) {
  if (e.hasOwnProperty('name') && e.name === 'UNKNOWN_VALUE' || e.name === 'UNKNOWN_OPTION') {
    console.error('Unknown option: ' + e.value);
    console.error(helpShort);
    process.exit(255);
  }
  throw e;
}
/* eslint-enable no-underscore-dangle */
