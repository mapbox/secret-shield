'use strict';

const cp = require('child_process');
const semver = require('semver');

// secret-shield --update reinstalls itself globally, and if it needs to update the hook locations
// then it bootstraps itself to --add-hooks global in its new directory, thus completing the transition

function update(oldHooksPath) {
  return new Promise((resolve, reject) => {
    let current = '0.0.0';
    let latest = '0.0.0';
    try {
      console.log('Checking secret-shield version...');
      latest = cp.execSync('npm dist-tag ls | grep latest', { cwd: __dirname }).toString().split(' ')[1].trim();
      current = JSON.parse(cp.execSync('secret-shield --info', { cwd: __dirname })).version.trim();
    } catch (e) {
      return reject({
        numCode: 110,
        code: 'NPM_FAIL',
        msg: 'Error: could not check npm for the latest version of secret-shield.'
      });
    }

    try {
      if (semver.lt(current, latest)) {
        console.log(`Update is available: ${current} -> ${latest}, installing...`);
        cp.execSync('npm install -g @mapbox/secret-shield@latest', { cwd: __dirname, encoding: 'utf-8' });
        console.log('Update installed successfully.');

        // If hooks pointed to the old secret-shield, they should now point to the new secret-shield.
        let hooksPath = '';
        try {
          hooksPath = cp.execSync('git config --global core.hooksPath', { encoding: 'utf-8' }).trim();
          hooksPath = hooksPath.slice(-1) === '/' ? hooksPath + 'pre-commit' : hooksPath + '/pre-commit';
        } catch (er) {
          hooksPath = '';
        }
        if (typeof oldHooksPath === 'undefined') {
          oldHooksPath = __dirname + '/config/hooks/pre-commit';
        }

        if (hooksPath === oldHooksPath) {
          try {
            console.log('Updating your hooks path...');
            cp.execSync('secret-shield --add-hooks global >/dev/null 2>&1'); // This is the new secret-shield, so the hooks now point correctly!
            console.log('Success!');
          } catch (er) {
            console.error(`Could not update the hooks path!! Run secret-shield --add-hooks global and if you are still encountering issues, check out the documentation for help.`);
            return reject({
              numCode: 112,
              code: 'HOOK_UPDATE_FAIL',
              msg: 'Error: could not update the secret-shield hooks path.',
            });
          }
        }
      } else {
        console.log('Already at latest version.');
      }
    } catch (e) {
      console.log(e);
      return reject({
        numCode: 111,
        code: 'UPDATE_FAIL',
        msg: 'Error: could not update secret-shield to the latest version.'
      });
    }
    return resolve();
  });
}

module.exports = update;