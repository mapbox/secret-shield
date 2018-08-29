'use strict';

function setRulesDisabledFlag(rules, set, matching) {
  return new Promise((resolve, reject) => {
    let newRules = rules;

    try {
      for (let m of matching) {
        for (let r in rules) {
          if (r === 'preprocess') {
            for (let rule in rules.preprocess) {
              if (rules.preprocess[rule].name === m) {
                newRules.preprocess[rule].disabled = set;
              }
            }
          }

          else if (r === 'postprocess') {
            for (let rule in rules.postprocess) {
              if (rules.postprocess[rule].name === m) {
                newRules.postprocess[rule].disabled = set;
              }
            }
          }

          else {
            for (let rule in rules[r]) {
              if (rule === m) {
                newRules[r][rule].disabled = set;
              }
            }
          }
        }
      }
    } catch (err) {
      return reject(err);
    } finally {
      return resolve(newRules);
    }
  });
}

module.exports = setRulesDisabledFlag;