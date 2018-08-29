'use strict';

const d3 = require('d3-queue');
const fuzzy = require('fast-fuzzy');

const entropy = require('./lib/entropy');
const entropyThreshold = require('./lib/entropyThreshold');

///////////////////////////////////////////////////////////////////////////////
// Preprocessor features

function processSingleReplace(string, pattern, replacement, callback) {
  try {
    string.s = string.s.replace(new RegExp(pattern, 'g'), replacement);
  }
  catch (err) {
    return callback(err);
  }
  return callback(null);
}

function processSingleExclude(string, rule, callback) {
  if (rule.hasOwnProperty('disallowedString') && string.s.indexOf(rule.disallowedString) !== -1) {
    return callback(); // don't run exclusion if it contains string
  }
  if (rule.hasOwnProperty('minLength') && string.s.length < rule.minLength) {
    string.s = '';
    return callback();
  }
  if (rule.hasOwnProperty('maxLength') && string.s.length > rule.maxLength) {
    string.s = '';
    return callback();
  }
  return callback();
}

function processSingleBulkIgnore(string, rule, callback) {
  let exclusions = require(rule.path);

  if (exclusions === null || exclusions.length === 0) {
    return callback();
  }

  for (let exclusion of exclusions) {
    if (string.s.indexOf(exclusion) !== -1) {
      string.s = string.s.replace(new RegExp(('\\b' + exclusion + '\\b'), 'g'), '\n');
    }
  }
  return callback();
}

///////////////////////////////////////////////////////////////////////////////
// Preprocessor logic

function triagePreprocess(string, rule, next) {
  if (rule.hasOwnProperty ('disabled') && rule.disabled === true) {
    return next();
  }
  if (rule.type === 'remove') {
    processSingleReplace(string, rule.pattern, '\n', function(err) {
      if (err) {
        return next(err);
      }
      return next();
    });
  }
  if (rule.type === 'replace') {
    processSingleReplace(string, rule.pattern, rule.replace, function(err) {
      if (err) {
        return next(err);
      }
      return next();
    });
  }
  if (rule.type === 'exclude') {
    processSingleExclude(string, rule, function(err) {
      if (err) {
        return next(err);
      }
      return next();
    });
  }
  if (rule.type === 'bulkIgnore') {
    processSingleBulkIgnore(string, rule, function(err) {
      if (err) {
        return next(err);
      }
      return next();
    });
  }
}

function preProcess(rules, string, callback) {
  let q = d3.queue(1);

  if (rules.hasOwnProperty('preprocess')) {
    if(Array.isArray(rules.preprocess)) {
      rules.preprocess.forEach(function(rule) {
        q.defer(triagePreprocess, string, rule);
      });
    } else {
      q.defer(triagePreprocess, string, rules.preprocess);
    }
  }

  q.awaitAll(function(err) {
    if (err) {
      return callback(err);
    }
    return callback();
  });
}

///////////////////////////////////////////////////////////////////////////////
// Main processor features

function processSingleRegex(rules, string, matchingRules, rule, next) {
  let matched = null;
  try {
    matched = string.match(new RegExp(rules.regex[rule].pattern, 'g'));
  }
  catch (err) {
    return next(err);
  }

  if (matched !== null && matched.length > 0 && rules.regex[rule].hasOwnProperty('minEntropy')) { // There's an entropy threshold
    matched = matched.filter((match) => {
      return entropy(match) >= rules.regex[rule].minEntropy;
    });
  }

  if (matched !== null && matched.length > 0) {
    matchingRules.push(rule);
  }

  return next();
}

function processSingleFuzzy(rules, string, matchingRules, rule, next) {
  let stringToFuzz = string;
  let choices = rules.fuzzy[rule].phrases;

  if (!(rules.fuzzy[rule].hasOwnProperty('caseSensitive') && rules.fuzzy[rule].caseSensitive)) { // default to case insensitive
    stringToFuzz = stringToFuzz.toLowerCase();
    choices = choices.map(s => s.toLowerCase());
  }

  for (let choice of choices) {
    if (fuzzy.fuzzy(choice, stringToFuzz) > rules.fuzzy[rule].threshold) {
      matchingRules.push(rule);
      return next();
    }
  }

  return next();
}

function processSingleEntropy(rules, string, matchingRules, rule, next) {
  let matches = false;

  let regex = new RegExp('\\b[0-9a-zA-Z]{' + rules.entropy[rule].minLength + ',' + rules.entropy[rule].maxLength + '}\\b', 'g');
  let candidates = string.match(regex);

  if (candidates === null) {
    return next();
  }

  for (let candidate of candidates) {
    if (!matches) {
      let type = '';
      if (/^[A-Z]+$/.test(candidate) || /^[a-z]+$/.test(candidate)) {
        type = 'alpha';
      } else if (/^[a-zA-Z]+$/.test(candidate)) {
        type = 'alphaCase';
      } else if (/^[0-9A-F]+$/.test(candidate) || /^[0-9a-f]+$/.test(candidate)) {
        type = 'hex';
      } else if (/^[0-9A-Z]+$/.test(candidate) || /^[0-9a-z]+$/.test(candidate)) {
        type = 'alphaNum';
      } else {
        type = 'alphaNumCase';
      }

      try {
        let threshold = entropyThreshold(type, candidate.length, rules.entropy[rule].percentile);
        matches = entropy(candidate) >= threshold;
      } catch (err) {
        return next(err);
      }

      if (matches) {
        matchingRules.push(rule);
        return next();
      }
    }
  }

  return next();
}

///////////////////////////////////////////////////////////////////////////////
// Main processor logic

function mainProcess(rules, string, matchingRules, callback) {
  let q = d3.queue();

  if (rules.hasOwnProperty('regex')) {
    for (let rule in rules.regex) {
      if (rules.regex[rule].hasOwnProperty ('disabled') && rules.regex[rule].disabled) {
        continue;
      }
      q.defer(processSingleRegex, rules, string, matchingRules, rule);
    }
  }

  if (rules.hasOwnProperty('fuzzy')) {
    for (let rule in rules.fuzzy) {
      if (rules.fuzzy[rule].hasOwnProperty ('disabled') && rules.fuzzy[rule].disabled) {
        continue;
      }
      q.defer(processSingleFuzzy, rules, string, matchingRules, rule);
    }
  }

  if (rules.hasOwnProperty('entropy')) {
    for (let rule in rules.entropy) {
      if (rules.entropy[rule].hasOwnProperty ('disabled') && rules.entropy[rule].disabled) {
        continue;
      }
      q.defer(processSingleEntropy, rules, string, matchingRules, rule);
    }
  }

  q.awaitAll(function(err) {
    if (err) {
      return callback(err);
    }
    return callback(); // For the moment keep chugging along even if there are errors
  });
}

///////////////////////////////////////////////////////////////////////////////
// Postprocessor features

function processSingleIgnoreFinding(matchingRules, rule, callback) {
  if (matchingRules.r.indexOf(rule.finding) !== -1) {
    matchingRules.r = [];
  }
  return callback();
}

///////////////////////////////////////////////////////////////////////////////
// Postprocessor logic

function triagePostprocess(string, matchingRules, rule, next) {
  if (rule.hasOwnProperty ('disabled') && rule.disabled === true) {
    return next();
  }
  if (rule.type === 'ignoreFinding') {
    processSingleIgnoreFinding(matchingRules, rule, function(err) {
      if (err) {
        return next(err);
      }
      return next();
    });
  }
}

function postProcess(rules, string, matchingRules, callback) {
  //return callback(null, matchingRules.r);
  let q = d3.queue(1);

  if (rules.hasOwnProperty('postprocess')) {
    if(Array.isArray(rules.postprocess)) {
      rules.postprocess.forEach(function(rule) {
        q.defer(triagePostprocess, string, matchingRules, rule);
      });
    } else {
      q.defer(triagePostprocess, string, matchingRules, rules.postprocess);
    }
  }

  q.awaitAll(function(err) {
    if (err) {
      return callback(err);
    }
    return callback(null, matchingRules.r);
  });
}

///////////////////////////////////////////////////////////////////////////////
// Magic happens here

function searchString(inputString, options) {
  options = options || {};
  return new Promise((resolve, reject) => {
    let rules;

    if (options.hasOwnProperty('rules')) {
      rules = options.rules;
    } else {
      console.err('Error: calling searchString.js without rules no longer works!');
      return reject({
        numCode: 251,
        code: 'DEPRECATED',
        msg: 'Erorr: searchString without rules no longer works!'
      });
    }

    let string = {s: inputString};
    let matchingRules = [];

    if (inputString === null || typeof inputString === 'undefined') {
      return reject({
        numCode: 254,
        code: 'MISSING_ARGS',
        msg: 'Error: searchString requires an argument.'
      });
    }
    preProcess(rules, string, function(err) {
      if (err) {
        return reject({
          numCode: 64,
          code: 'PREPROC_FAIL',
          msg: 'Error: searchString preprocessing failed',
          detailedError: err
        });
      }
      mainProcess(rules, string.s, matchingRules, function(err) {
        if (err) {
          return reject({
            numCode: 65,
            code: 'MAINPROC_FAIL',
            msg: 'Error: searchString main processing failed',
            detailedError: err
          });
        }

        postProcess(rules, string.s, {r: matchingRules}, function(err, postprocessedRules) {
          if (err) {
            return reject({
              numCode: 66,
              code: 'POSTPROC_FAIL',
              msg: 'Error: searchString postprocessing failed',
              detailedError: err
            });
          }
          return resolve(postprocessedRules);
        });
      });
    });
    return resolve([]);
  });
}

module.exports = searchString;

if (require.main === module) {
  searchString(process.argv[2]).then((matchingRules) => {
    console.log(matchingRules);
    return 0;
  }).catch((err) => {
    console.log(err);
    return 1;
  });
}
