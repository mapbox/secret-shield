'use strict';

const tape = require('tape');

const entropy = require('../lib/entropy');

function round(x){
  return Math.round(x * 100) / 100;
}

tape('Entropy should work', (t) => {
  t.equal(entropy('aaaaa'), 0, 'zero entropy string');
  t.equal(round(entropy('aafaa')), 0.72, 'low entropy string');
  t.equal(round(entropy('abcdeabcdefj')), 2.75, 'medium entropy string');
  t.end();
});