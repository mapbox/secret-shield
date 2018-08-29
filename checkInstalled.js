'use strict';

const cp = require('child_process');
const fs = require('fs');
const commandJoin = require('command-join');
const semver = require('semver');

const minVersion = '1.0.0-alpha.1';

// In this file you will see a lot of

function checkAndRun(stopWorkingDate) {
  let path = cp.execSync('echo $PATH').toString().trim();
  path = path.replace(/[^:]+\/\.bin[^:]*(:|$)/g, ''); // if it's in a .bin, it's not global.

  if (typeof stopWorkingDate === 'undefined') {
    stopWorkingDate = '1970-01-01';
  }
  const code = checkSecretShield(stopWorkingDate, path);
  if (code === 255) { // 255 signifies that grace period - secret-shield should not run;
    return 0;
  } else if (code > 0) {
    return code;
  }
  try {
    // This is the trick of the whole operation. We're running the global secret-shield, not the one
    // that was included with 'require'
    cp.execSync(`PATH=${path} secret-shield --pre-commit -C precommit`);
    return 0;
  } catch (e) {
    return 1;
  }
}

function checkSecretShield(stopWorkingDate, path) {
  try {
    let crt;

    crt = checkInstalled(stopWorkingDate, path);
    if (crt > -1) {
      return crt;
    }

    crt = checkVersionAndUpdate(path);
    if (crt > -1) {
      return crt;
    }

    crt = checkHooksGlobal(path);
    if (crt > -1) {
      return crt;
    }

    return 253;
  } catch (e) {
    console.error(e);
    return 254;
  }
}

function checkInstalled(stopWorkingDate, path) {
  try {
    cp.execSync(`PATH=${path} command -v secret-shield`);
  } catch (e) {
    // There is no secret-shield
    if (new Date() > Date.parse(stopWorkingDate)) {
      // Grace period expired
      console.error('ERROR! You must have secret-shield installed and configured globally to commit to this repository. To set up secret-shield, follow these instructions: https://github.com/mapbox/secret-shield/blob/master/docs/partnerBadge.md');
      return 10;
    } else {
      console.warn(`WARNING! You must have secret-shield installed and configured globally to commit to this repository. Committing will stop working on ${stopWorkingDate} if you don't globally install and configure secret-shield as detailed in the docs: https://github.com/mapbox/secret-shield/blob/master/docs/partnerBadge.md`);
      return 255;
    }
  }

  try {
    let currentVersion = JSON.parse(cp.execSync(`PATH=${path} secret-shield --info`)).version.trim();
    if (semver.lt(currentVersion, minVersion)) {
      console.error(`ERROR! You need secret-shield ${minVersion} or above. Your current version is ${currentVersion}. Run "npm install -g @mapbox/secret-shield@latest" to resolve this issue.`);
      return 11;
    }
  } catch (e) {
    console.error('ERROR! Secret-shield is installed but not working properly. Please run "npm install -g @mapbox/secret-shield@latest" to resolve this issue. If the issue persists, see https://github.com/mapbox/secret-shield/blob/master/docs/commonIssues.md');
    return 12;
  }

  return -1;
}

function checkVersionAndUpdate(path) {
  if (Math.random() > 0.01) {
    return -1; // Skip version checks most of the time.
  }
  try {
    console.log('Checking for secret-shield updates...');
    cp.execSync(`PATH=${path} secret-shield --update >/dev/null 2>&1`);
  } catch (e) {
    if (e.status === 110) {
      console.warn('WARNING! Could not check secret-shield for updates.');
      return -1;
    } else if (e.status === 111) {
      console.warn('WARNING! Could not update secret-shield to the latest version.');
      return -1;
    } else if (e.status === 112) {
      console.error('ERROR! Could not point git hooks to new location. Run "secret-shield --add-hooks global", try again, and if you are still encountering issues, check out the documentation at https://github.com/mapbox/secret-shield/blob/master/docs/commonIssues.md for help.');
      return 112;
    } else {
      console.warn('WARNING! Could not check secret-shield for updates due to an unknown error.');
      console.warn(e);
      console.warn('Continuing...');
      return -1;
    }
  }
  return -1;
}

function checkHooksGlobal(path) {
  let hooksPath = '';
  try {
    hooksPath = cp.execSync('git config --global core.hooksPath 2>/dev/null').toString().trim();
    if (hooksPath.length === 0) {
      throw new Error();
    }
  } catch (e) {
    // There are no global hooks
    try {
      cp.execSync(`PATH=${path} secret-shield --add-hooks global >/dev/null 2>&1`);
      return 0;
    } catch(er) {
      console.error('ERROR! Failed to create secret-shield hooks');
      return 20;
    }
  }

  const hooksFile = hooksPath.slice(-1) === '/' ? hooksPath + 'pre-commit' : hooksPath + '/pre-commit';

  if (fs.existsSync(hooksFile)) {
    try {
      fs.accessSync(hooksFile, (fs.constants || fs).X_OK);
    } catch (er) {
      console.error(`ERROR! Your global pre-commit hooks located in ${hooksFile} are not executable. In order to commit to this repository, you must have global pre-commit hooks installed and configured to run secret-shield. To fix this issue, run chmod +x ${hooksFile} More info here: https://github.com/mapbox/secret-shield/blob/master/docs/partnerBadge.md`);
      return 21;
    }
  } else {
    // Copy the pre-commit hook in the proper location
    try {
      let dirname = JSON.parse(cp.execSync(`PATH=${path} secret-shield --info`)).installed_dir.trim();
      dirname = __dirname.slice(-1) === '/' ? __dirname : __dirname + '/';
      cp.execSync(commandJoin(['cp', '-f', dirname + '../config/hooks/pre-commit', hooksFile]) + ' >/dev/null 2>&1');
    } catch (e) {
      console.error('ERROR! Failed to copy over the secret-shield hooks');
      return 22;
    }

    try {
      cp.execSync(`chmod +x ${hooksFile}`);
      return 0;
    } catch (e) {
      console.error('ERROR! Failed to make secret-shield hooks executable');
      return 23;
    }
  }

  try {
    cp.execSync(`grep "secret-shield --pre-commit" ${hooksFile} >/dev/null 2>&1`);
  } catch (e) {
    console.error(`ERROR! Your global pre-commit hooks located in ${hooksFile} are not configured to run secret-shield. In order to commit to this repository, your global pre-commit hooks must be configured to run secret-shield. More info here: https://github.com/mapbox/secret-shield/blob/master/docs/partnerBadge.md`);
    return 24;
  }
  return 0;
}

module.exports = {
  checkAndRun,
  checkSecretShield,
  checkInstalled,
  checkVersionAndUpdate,
  checkHooksGlobal
};