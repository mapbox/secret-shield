'use strict';

const lodash = require('lodash');

/**
 * Get all the strings values from the json file
 */
const getValues = (object) => {
  const result = [];

  if (object === undefined || object === null) {
    return result;
  }

  Object.keys(object).forEach((key) => {
    let value = object[key];

    // v instanceof Array
    if (typeof value === 'object' && value instanceof Array) {
      for (let v of value) {
        if (typeof v === 'object' && v instanceof Array) {
          result.push(v);
        } else if (typeof v === 'boolean'){
        } else if (typeof v === 'object') {
          result.push(getValues(v));
        } else {
          result.push(v);
        }
      }
    } else if (typeof value === 'object') {
      result.push(getValues(value));
    } else if (typeof value === 'boolean'){
      return result;
    } else {
      result.push(value);
    }
  });

  return result;
};

/**
 * Return an array of all strings from JSON file.
 */
module.exports = (content) => {
  let json;

  try {
    json = JSON.parse(content);
  } catch (e) {
    return [];
  }

  let result = getValues(json);
  result = lodash.flattenDeep(result).filter((value) => {
    return typeof value === 'string';
  });
  return lodash.uniq(result);
};