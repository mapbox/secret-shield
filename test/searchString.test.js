/* eslint-disable no-underscore-dangle */

'use strict';

const tape = require('tape');
const searchString = require('../searchString');

///////////////////////////////////////////////////////////////////////////////
// Preprocessor tests

tape('Remove rule should work, part 1', (t) => {
  let testRules = {
    preprocess: [
      {
        type: 'remove',
        name: 'Test removal rule',
        pattern: 'foo'
      }
    ],
    regex: {
      'original string': {
        pattern: 'foo'
      }
    }
  };

  searchString('bazfoobar', {rules: testRules}).then((results) => {
    t.equal(results.length, 0, 'should not match removed text');
    t.end();
  }, (failures) => {
    t.fail('should not error');
    t.end();
  });
});

tape('Remove rule should work, part 2', (t) => {
  let testRules = {
    preprocess: [
      {
        type: 'remove',
        name: 'Test removal rule',
        pattern: 'foo'
      }
    ],
    regex: {
      'across': {
        pattern: 'zb'
      }
    }
  };

  searchString('bazfoobar', {rules: testRules}).then((results) => {
    t.equal(results.length, 0, 'should not match across removal');
    t.end();
  }, (failures) => {
    t.fail('should not error');
    t.end();
  });
});

tape('Preprocess rules execute in order, part 1', (t) => {
  let testRules = {
    preprocess: [
      {
        type: 'replace',
        name: 'Takes a while',
        pattern: '(a+a+)+bde',
        replace: ''
      },
      {
        type: 'replace',
        name: 'Quick',
        pattern: 'c',
        replace: ''
      }
    ],
    regex: {
      'executed in order': {
        pattern: 'e'
      }
    }
  };

  searchString('aaaaaaaaaaaaaaaaaaaaaaaabcde', {rules: testRules}).then((results) => {
    t.equal(results.length, 1, 'should execute in order');
    t.end();
  }, (failures) => {
    t.fail('should not error on weird regexes');
    t.end();
  });
});

tape('Preprocess rules execute in order, part 2', (t) => {
  let testRules = {
    preprocess: [
      {
        type: 'replace',
        name: 'Quick',
        pattern: 'c',
        replace: ''
      },
      {
        type: 'replace',
        name: 'Takes a while',
        pattern: '(a+a+)+bde',
        replace: ''
      }
    ],
    regex: {
      'executed in order': {
        pattern: 'e'
      }
    }
  };

  searchString('aaaaaaaaaaaaaaaaaaaaaaaabcde', {rules: testRules}).then((results) => {
    t.equal(results.length, 0, 'should execute in order');
    t.end();
  }, (failures) => {
    t.fail('should not error on weird regexes');
    t.end();
  });
});

tape('Preprocess rules execute in order, part 3', (t) => {
  let testRules = {
    preprocess: [
      {
        type: 'replace',
        name: 'Quick 1',
        pattern: 'cd',
        replace: ''
      },
      {
        type: 'replace',
        name: 'Quick 2',
        pattern: 'de',
        replace: ''
      }
    ],
    regex: {
      'executed in order': {
        pattern: 'e'
      }
    }
  };

  searchString('cde', {rules: testRules}).then((results) => {
    t.equal(results.length, 1, 'should execute in order');
    t.end();
  }, (failures) => {
    t.fail('should not error on weird regexes');
    t.end();
  });
});

tape('Search should not work across newlines', (t) => {
  let testRules = {
    regex: {
      'Test across newline': {
        pattern: 'foo'
      },
      'Wildcard across newline': {
        pattern: 'f.*o'
      }
    }
  };

  searchString('dacc test f\noo bar', {rules: testRules}).then((results) => {
    t.equal(results.length, 0, 'should not match anything');
    t.end();
  });
});

tape('Search should work', (t) => {
  let testRules = {
    regex: {
      'Test pattern 1': {
        pattern: '[^abc][abc]{3}'
      },
      'Test pattern 2': {
        pattern: 'foob.r'
      }
    }
  };

  searchString('dacc test foob@r', {rules: testRules}).then((results) => {
    t.equal(results.length, 2, 'should match two patterns');
    t.end();
  });

});


tape('Should output correct rule name', (t) => {
  let testRules = {
    regex: {
      'T\'est$%^&#@%$&";,.\\/pattern': {
        pattern: 'take this'
      }
    }
  };

  searchString('It\'s dangerous to go alone, take this!', {rules: testRules}).then((results) => {
    t.equal(results.length, 1, 'should have one result');
    t.deepEqual(results, ['T\'est$%^&#@%$&";,.\\/pattern'], 'should display correct rule name');
    t.end();
  });
});

tape('Should be case-sensitive', (t) => {
  let testRules = {
    regex: {
      'rule one': {
        pattern: 'foo'
      },
      'rule two': {
        pattern: 'bAr'
      },
      'rule three': {
        pattern: 'BAZ'
      }
    }
  };

  searchString('Foo bar baz', {rules: testRules}).then((results) => {
    t.equal(results.length, 0, 'should not match any patterns');
    t.end();
  });

});

tape('Should respect entropy thresholds', (t) => {
  let testRules = {
    regex: {
      'should match': {
        pattern: '[a-z]{10}',
        minEntropy: 3.2
      },
      'should ignore': {
        pattern: '[A-Z]{10}',
        minEntropy: 1.8
      }
    }
  };

  searchString('tricksyelfABCACBACAC', {rules: testRules}).then((results) => {
    t.equal(results.length, 1, 'should match one');
    t.deepEqual(results, ['should match'], 'should match the correct one');
    t.end();
  });

});

// tape('Fuzzy matching should work', (t) => {
//   let testRules = {
//     fuzzy: {
//       'do not commit message': {
//         phrases: [
//           'don\'t commit',
//           'do not commit',
//           'remove before committing'
//         ],
//         threshold: 85,
//         minLength: 20,
//         caseSensitive: false
//       }
//     }
//   };
//
//   searchString('hey, do not comit this, it\'s super important, dont do it', {rules: testRules}).then((results) => {
//     t.equal(results.length, 1, 'should match one');
//     t.deepEqual(results, ['do not commit message'], 'should have caught the string');
//   });
//
//   searchString('hey, do not forget to commit this, seriously, you have to do it', {rules: testRules}).then((results) => {
//     t.equal(results.length, 0, 'should not match');
//   });
//   t.end();
// });

// TODO: add tests for entropy