'use strict';

const yaml = require('yamljs');
const jsonParser = require('./../json/index');


/**
 * Return an array of all strings from javascript file.
 */
module.exports = (code) => {
  try {
    let jsObject = yaml.parse(code);
    let jsonObject = JSON.stringify(jsObject);
    return jsonParser(jsonObject);
  } catch (e) {
    console.log(e);
    /**
     * Error when parsing YAML file.
     * @TODO fallback to parse whole file as a single blob.
     */
    return [];
  }
};
