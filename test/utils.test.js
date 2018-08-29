const tape = require('tape');
const getFileSizeInMB = require('../utils/getFileSizeInMB');
const numberOfLines = require('./../utils/numberOfLines');

tape('getFileSizeInMB should work', (t) => {
  t.equal(getFileSizeInMB('./test/data/sample.txt'), 0.000112, 'it should get the file size in MB');
  t.end();
});

tape('numberOfLines should work', (t) => {
  t.equal(numberOfLines('./test/data/sample.txt'), 56, 'it should count the number of lines');
  t.end();
});
