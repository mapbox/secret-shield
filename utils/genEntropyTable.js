// Generates entropy tables
// Usage: node genEntropyTable.js <min length> <max length> <runs>

const entropy = require('../lib/entropy');
const stat = require('simple-statistics');

let runs = parseInt(process.argv[4]);
let minL = parseInt(process.argv[2]);
let maxL = parseInt(process.argv[3]);

let tables = {
  hex: {},
  alpha: {},
  alphaCase: {},
  alphaNum: {},
  alphaNumCase: {}
};

let pools = {
  hex: 'ABCDEF0123456789',
  alpha: 'abcdefghijklmnopqrstuvwxyz',
  alphaCase: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  alphaNum: 'abcdefghijklmnopqrstuvwxyz0123456789',
  alphaNumCase: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
};

for (let table in tables) {
  for (let l = minL; l <= maxL; l++) {
    let results = [];
    for (let i = 0; i < runs; i++) {
      let run = [];
      for (let j = 0; j < l; j++) {
        run += pools[table].charAt(Math.floor(Math.random() * pools[table].length));
      }
      results.push(entropy(run));
    }


    let mean = stat.mean(results);
    let stdev = stat.standardDeviation(results);
    tables[table][l] = {
      'mean': mean,
      'stdev': stdev
    };
  }
}
console.log(JSON.stringify(tables));