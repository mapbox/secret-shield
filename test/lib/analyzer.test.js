'use strict';

const tape = require('tape');

const fs = require('fs');
const path = require('path');

const jsTokenizer = require('../lib/parsers/tokenizer/js/index');
const jsonTokenizer = require('../lib/parsers/tokenizer/json/index');
const yamlTokenizer = require('../lib/parsers/tokenizer/yml/index');
const extractExtension = require('../utils/extractExtension');
const listFromString = require('../utils/listFromString');


tape('JS tokenizer should work', (t) => {
  t.equal(jsTokenizer('let token="abcd";').length, 1, 'finds one string');
  t.deepEqual(jsTokenizer('let token="abcd";'), ['abcd'], 'string is correct');

  t.equal(jsTokenizer('let token="abcd"; const AWSKEY="abcd"').length, 1, 'deduplicates strings');
  t.deepEqual(jsTokenizer('let token="abcd"; const AWSKEY="abcd"'), ['abcd'], 'string is correct');

  t.equal(jsTokenizer('let token="abcd"; const AWSKEY=\'abcd\'; var MODE = \'452\'').length, 2, 'finds both single and double quotes');
  t.deepEqual(jsTokenizer('let token="abcd"; const AWSKEY=\'abcd\'; var MODE = \'452\''), ['abcd', '452'], 'strings are correct');

  t.end();
});

tape('JSON Parse should work', (t) => {
  let jsonContent = '{"KEYS": "AAABBCC"}';
  t.deepEqual(jsonTokenizer(jsonContent), ['AAABBCC'], 'matches only json values');

  jsonContent = fs.readFileSync(path.join(__dirname, './data/sample.json'), 'utf8');

  t.deepEqual(jsonTokenizer(jsonContent), ['Some license', 'some repository', 'cde'], 'simple json');

  jsonContent = fs.readFileSync(path.join(__dirname, './data/complex.json'), 'utf8');

  t.deepEqual(jsonTokenizer(jsonContent), [
    'Some license',
    'some repository',
    'cde',
    'a',
    'b',
    'c',
    'value',
    'x',
    'y',
    'p',
    'q',
    'r',
    'i',
    'j',
    'k',
    'w',
    'd',
    'e',
    'wat',
    'first',
    'second',
    'w1',
    'w2',
    'w3',
    'z1',
    'z3',
    'pk',
    'pk2',
    'sa',
    'sb',
    'sc',
    's2',
    's3',
    '31',
    '32'
  ], 'complex json');

  t.end();
});


tape('yaml Parse should work', (t) => {
  let yamlContent = fs.readFileSync(path.join(__dirname, './data/sample.yml'), 'utf8');

  t.deepEqual(yamlTokenizer(yamlContent), ['node_js', 'ubuntu-toolchain-r-test', 'g++-4.8', 'libstdc++6'], 'finds in yaml');

  t.end();
});

tape('Extract Extension', (t) => {
  t.equal(extractExtension('sample.js'), 'js', 'js extension');
  t.equal(extractExtension('sample.json'), 'json', 'json extension');
  t.equal(extractExtension('sample'), '', 'no extension');
  t.equal(extractExtension('./xyz/abcd/xyz.template.js'), 'js', 'js extension in template');
  t.end();
});

tape('listFromString should output a list', (t) => {
  t.deepEqual(listFromString(null), [], 'null gives nothing');
  t.deepEqual(listFromString(undefined), [], 'undefined gives noting');
  t.deepEqual(listFromString(''), [], 'empty string gives nothing');
  t.deepEqual(listFromString('     '), [], 'spaces-only string gives nothing');
  t.deepEqual(listFromString('a'), ['a'], 'single character parses ok');
  t.deepEqual(listFromString('     a'), ['a'], 'removes spaces padding');
  t.deepEqual(listFromString('a,b,c'), ['a', 'b', 'c'], 'no spaces between commas');
  t.deepEqual(listFromString('  a,b,c  '), ['a', 'b', 'c'], 'space-padded list');
  t.deepEqual(listFromString('  a,  b  ,   c  '), ['a', 'b', 'c'], 'random spaces in list');
  t.deepEqual(listFromString('  p q,  b  ,   c  '), ['p q', 'b', 'c'], 'more random spaces in list');
  t.end();
});
