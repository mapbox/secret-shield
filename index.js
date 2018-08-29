const searchString = require('./searchString');
const searchFile = require('./searchFile');
const searchRepo = require('./searchRepo');
const searchTemplate = require('./searchCFTemplate');
const searchDirectory = require('./searchDirectory');
const checkInstalled = require('./checkInstalled');

function checkAndRun(stopWorkingDate) {
  return checkInstalled.checkAndRun(stopWorkingDate);
}

module.exports = {
  searchString,
  searchFile,
  searchRepo,
  searchTemplate,
  searchDirectory,
  checkAndRun
};
