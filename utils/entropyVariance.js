// Helps you calculate entropy variances and percentiles for random strings.
// Should allow you to select proper entropy values to reduce false positives
// Usage: node entropyVariance.js <character pool> <string length> <runs>
// Example: node entropyVariance.js "abcdefghijklmnopqrstuvwxyz0123456789" 40

const entropy = require('../lib/entropy');
const stat = require('simple-statistics');

let runs = process.argv[4];
let results = [];

function round(number, precision) {
  let shift = function(number, precision, reverseShift) {
    if (reverseShift) {
      precision = -precision;
    }
    numArray = ('' + number).split('e');
    return +(numArray[0] + 'e' + (numArray[1] ? (+numArray[1] + precision) : precision));
  };
  return shift(Math.round(shift(number, precision, false)), precision, true);
}

for (let i = 0; i < runs; i++) {
  let run = [];
  for (let j = 0; j < process.argv[3]; j++) {
    run += process.argv[2].charAt(Math.floor(Math.random() * process.argv[2].length));
  }
  results.push(entropy(run));
}

let mean = stat.mean(results);
let stdev = stat.standardDeviation(results);

console.log('mean: ' + round(mean, 3));
console.log('stdev: ' + round(stdev, 3));
console.log('0.05 min: ' + round(mean - 1.645 * stdev, 3) + ' (catches 95% of secrets)');
console.log('0.01 min: ' + round(mean - 2.326 * stdev, 3) + ' (catches 99% of secrets)');
console.log('0.005 min: ' + round(mean - 2.576 * stdev, 3) + ' (catches 99.5% of secrets)');
console.log('0.001 min: ' + round(mean - 3.090 * stdev, 3) + ' (catches 99.9% of secrets)');
console.log('0.0005 min: ' + round(mean - 3.291 * stdev, 3) + ' (catches 99.95% of secrets)');