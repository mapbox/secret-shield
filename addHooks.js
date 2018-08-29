'use strict';

const fs = require('fs');
const child = require('child_process');

function addHooks(type) { //test3
  return new Promise((resolve, reject) => {
    let source = __dirname + '/config/hooks/pre-commit'; // currently only supports pre-commit

    if (type === null || typeof type === 'undefined') {
      type = 'global'; // Default to global
    }

    if (type === 'local') {
      let dest = '';

      try {
        dest = child.execSync('git rev-parse --show-toplevel');
      } catch (err) {
        return reject({
          numCode: 128,
          code: 'NOT_A_REPO',
          msg: 'Could not add local hooks: you\'re not in a git repository'
        });
      }
      dest = dest.toString().slice(0, -1) + '/.git/hooks/pre-commit'; //test change 2
      // test change

      try {
        if (!fs.existsSync(__dirname + '../config/hooks/pre-commit.local')) {
          return reject({
            numCode: 129,
            code: 'NO_LOCAL_HOOK_ADD',
            msg: 'Could not find the local hooks to add -- is your secret-shield module correctly installed?'
          });
        }
        if (fs.existsSync(hooksFile)) {
          return reject({
            numCode: 130,
            code: 'LOCAL_HOOK_EXIST',
            msg: 'Could not add local hooks: hooks already exist in ' + dest
          });
        }

        cp.execSync(commandJoin(['cp', '-n', __dirname + '../config/hooks/pre-commit.local', hooksFile]) + ' >/dev/null 2>&1');
      } catch (err) {
        return reject({
          numCode: 131,
          code: 'LOCAL_HOOK_ADD_COPY_FAIL',
          msg: 'Could not add local hooks: hook copy failed!'
        });
      }

      try {
        child.execSync('chmod +x ' + dest);
      } catch (err) {
        return reject({
          numCode: 132,
          code: 'LOCAL_HOOK_ADD_CHMOD_FAIL',
          msg: 'Could not make the new local hooks at ' + dest + ' executable. You have to do this manually.'
        });
      }

      return resolve('Successfully added local hooks in ' + dest);
    }

    if (type === 'global') {
      try {
        child.execSync('git config --global core.hooksPath ' + __dirname + '/config/hooks');
      } catch (err) {
        return reject({
          numCode: 133,
          code: 'GLOBAL_HOOK_ADD_FAIL',
          msg: 'Could not add global hooks: git exited with error ' + err.status
        });
      }

      return resolve('Successfully added global hooks!');
    }

    if (type === 'template') {
      return reject({
        numCode: 250,
        code: 'NOT_IMPLEMENTED',
        msg: 'Could not add hooks: ' + type + ' hooks not implemented. Use local or global.'
      });
    }

    return reject({
      numCode: 255,
      code: 'WRONG_ARGS',
      msg: 'Could not add hooks: invalid argument to --add-hooks: ' + type
    });
  });
}

module.exports = addHooks;