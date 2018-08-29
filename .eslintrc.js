module.exports = {
  'env': {
    'node': true,
    'es6': true
  },
  'rules': {
    'quotes': [2, 'single', {'avoidEscape': true, 'allowTemplateLiterals': true}],
    'indent': ['error', 2, {'SwitchCase': 1}],
    'no-multi-spaces': [2],
    'no-unused-vars': [1],
    'no-var': [2],
    'no-mixed-spaces-and-tabs': [2],
    'no-underscore-dangle': [2],
    'no-loop-func': [2],
    'handle-callback-err': [2],
    'space-unary-ops': [2],
    'space-in-parens': ['error', 'never'],
    'space-before-function-paren': ['error', 'never'],
    'no-trailing-spaces': [2],
    'no-tabs': [2],
    'new-cap': [2],
    'block-spacing': ['error', 'always'],
    'no-multiple-empty-lines': [2],
    'semi': ['error', 'always']
  }
};
