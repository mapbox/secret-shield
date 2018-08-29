'use strict';

const esprima = require('esprima');

function isInsecureParameter(node, secureParameterNames) {
  if (node.type !== 'Property' || node.key.type !== 'Identifier' || node.value.type !== 'ObjectExpression') {
    return '';
  }

  let hasTypeString = false, hasSecureDescription = false, hasNonEmptyDefault = false;

  for (let property of node.value.properties) {
    if (property.type !== 'Property' || property.key.type !== 'Identifier' || property.value.type !== 'Literal') {
      continue;
    }

    if (property.key.name === 'Type') {
      if (property.value.value === 'String') {
        hasTypeString = true;
      }
      continue;
    }

    if (property.key.name === 'Description') {
      if (property.value.value.slice(0,8) === '[secure]') {
        hasSecureDescription = true;
      }
      continue;
    }

    if (property.key.name === 'Default') {
      if (property.value.value.length > 0) {
        hasNonEmptyDefault = true;
      }
      continue;
    }
  }

  for (let regex of secureParameterNames) {
    if (node.key.name.match(regex) && !hasSecureDescription) {
      if (hasNonEmptyDefault) {
        return 'Cloudformation parameter must have [secure] and must have an empty default!';
      }
      return 'CloudFormation parameter must have [secure]';
    }
  }

  if (hasTypeString && hasSecureDescription && hasNonEmptyDefault) {
    return 'Secure Cloudformation parameter must have an empty default';
  }

  return '';
}

function templateAnalyzer(template, secureParameterNames, filePath) {
  return new Promise((resolve, reject) => {
    try {
      let findings = [];
      esprima.parseScript(template, {}, function(parent, meta) {
        if (parent.type === 'Property' && parent.key.name === 'Parameters') {
          if ('value' in parent && 'properties' in parent.value) {
            for (let node of parent.value.properties) {
              try {
                let result = isInsecureParameter(node, secureParameterNames);
                if (result.length > 0) {
                  findings.push({
                    'finding': [result],
                    'string': node.key.name,
                    'file': filePath
                  });
                }
              } catch (err) {
                // do nothing
              }
            }
          }
        }
      });
      return resolve(findings);
    } catch (err) {
      return reject(err);
    }
  });
}

module.exports = templateAnalyzer;