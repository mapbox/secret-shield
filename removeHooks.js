'use strict';

const fs = require('fs');
const child = require('child_process');

function removeHooks(type) {
  return new Promise((resolve, reject) => {
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
          msg: 'Could not remove local hooks: you\'re not in a git repository'
        });
      }
      dest = dest.toString().slice(0, -1) + '/.git/hooks/pre-commit';

      try {
        fs.unlinkSync(dest);
      } catch (err) {
        if (err.code === 'ENOENT') {
          return reject({
            numCode: 98,
            code: 'NO_LOCAL_HOOK',
            msg: 'Could not find any local hooks to remove at ' + dest
          });
        }
        return reject({
          numCode: 99,
          code: 'LOCAL_HOOK_REMOVE_FAIL',
          msg: 'Could not delete local hooks at ' + dest
        });
      }

      return resolve('Successfully deleted the local hooks at ' + dest);
    }

    if (type === 'global') {
      try {
        child.execSync('git config --global --unset core.hooksPath');
      } catch (err) {
        if (err.status === 5) {
          return reject({
            numCode: 97,
            code: 'NO_GLOBAL_HOOK',
            msg: 'Could not remove global hooks because they aren\'t set'
          });
        }
        return reject({
          numCode: 96,
          code: 'GLOBAL_HOOK_REMOVE_FAIL',
          msg: 'Could not remove global hooks: git exited with error code ' + err.status
        });
      }

      return resolve('Successfully removed global hooks!');
    }

    if (type === 'template') {
      return reject({
        numCode: 250,
        code: 'NOT_IMPLEMENTED',
        msg: 'Could not remove hooks: ' + type + ' hooks not implemented. Use local or global.'
      });
    }

    return reject({
      numCode: 255,
      code: 'WRONG_ARGS',
      msg: 'Could not remove hooks: invalid argument to --remove-hooks: ' + type
    });
  });
}

module.exports = removeHooks;