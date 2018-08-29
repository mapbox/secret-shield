'use strict';

const tokenizer = require('acorn');
const lodash = require('lodash');


/**
 * Return an array of all strings from javascript file.
 */
module.exports = (code) => {
  const tokens = [];

  try {
    tokenizer.parse(code, {onToken: tokens});
  } catch (e) {
    /**
     * Error when parsing JS file.
     * @TODO fallback to parse whole file as a single blob.
     */
    return [];
  }

  // Return only unique values of 'string' type objects.
  return lodash.uniq(
    tokens.filter(t => t.type.label === 'string').map(t => t.value)
  );
};