'use strict';

const tape = require('tape');
const sinon = require('sinon');

const cp = require('child_process');

const update = require('../update');

tape('Does not update if there is no new version', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onCall(0).returns('latest: 0.5.0'); // latest
  execStub.onCall(1).returns('{"version": "0.5.1"}'); // current

  update().then(() => {
    t.ok('does not error');
    t.equal(execStub.callCount, 2, 'called twice');
  }).catch((err) => {
    t.fail('should not have errored: ' + err);
  }).then(() => {
    execStub.restore();
    t.end();
  });
});

tape('Catches error if npm borks', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onCall(0).throws(); // latest
  execStub.onCall(1).returns('{"version": "0.5.1"}'); // current

  update().then(() => {
    t.fail('should have errored');
  }).catch((err) => {
    t.equal(err.numCode, 110, 'should have exited with correct code');
  }).then(() => {
    execStub.restore();
    t.end();
  });
});

tape('Updates if update available', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onCall(0).returns('latest: 1.0.0'); // latest
  execStub.onCall(1).returns('{"version": "0.3.5"}'); // current
  execStub.onCall(2).returns();
  execStub.onCall(3).returns('/baz');


  update('/foo/bar/config/hooks/pre-commit').then(() => {
    t.ok('does not error');
    t.equal(execStub.callCount, 4, 'called four times');
    t.equal(execStub.getCall(2).args[0], 'npm install -g @mapbox/secret-shield@latest', 'called the update');
    t.equal(execStub.getCall(3).args[0], 'git config --global core.hooksPath', 'checked hooks path');
  }).catch((err) => {
    t.fail('should not have errored: ' + err);
  }).then(() => {
    execStub.restore();
    t.end();
  });
});

tape('Updates if update available and moves the hooks', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onCall(0).returns('latest: 1.0.0'); // latest
  execStub.onCall(1).returns('{"version": "0.3.5"}'); // current
  execStub.onCall(2).returns();
  execStub.onCall(3).returns('/foo/bar/config/hooks');
  execStub.onCall(4).returns();


  update('/foo/bar/config/hooks/pre-commit').then(() => {
    t.ok('does not error');
    t.equal(execStub.callCount, 5, 'called five times');
    t.equal(execStub.getCall(2).args[0], 'npm install -g @mapbox/secret-shield@latest', 'called the update');
    t.equal(execStub.getCall(3).args[0], 'git config --global core.hooksPath', 'checked hooks path');
    t.equal(execStub.getCall(4).args[0], 'secret-shield --add-hooks global >/dev/null 2>&1', 'called secret-shield to update hooks');
  }).catch((err) => {
    t.fail('should not have errored: ' + err);
  }).then(() => {
    execStub.restore();
    t.end();
  });
});

tape('Updates if update available and moves the hooks with proper handling of trailing slashes', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onCall(0).returns('latest: 1.0.0'); // latest
  execStub.onCall(1).returns('{"version": "0.3.5"}'); // current
  execStub.onCall(2).returns();
  execStub.onCall(3).returns('/foo/bar/config/hooks/');
  execStub.onCall(4).returns();


  update('/foo/bar/config/hooks/pre-commit').then(() => {
    t.ok('does not error');
    t.equal(execStub.callCount, 5, 'called five times');
    t.equal(execStub.getCall(2).args[0], 'npm install -g @mapbox/secret-shield@latest', 'called the update');
    t.equal(execStub.getCall(3).args[0], 'git config --global core.hooksPath', 'checked hooks path');
    t.equal(execStub.getCall(4).args[0], 'secret-shield --add-hooks global >/dev/null 2>&1', 'called secret-shield to update hooks');
  }).catch((err) => {
    t.fail('should not have errored: ' + err);
  }).then(() => {
    execStub.restore();
    t.end();
  });
});

tape('Correctly errors if hooks path cannot be updated', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onCall(0).returns('latest: 1.0.0'); // latest
  execStub.onCall(1).returns('{"version": "0.3.5"}'); // current
  execStub.onCall(2).returns();
  execStub.onCall(3).returns('/foo/bar/config/hooks/');
  execStub.onCall(4).throws();

  update('/foo/bar/config/hooks/pre-commit').then(() => {
    t.fail('should have errored');
  }).catch((err) => {
    t.ok('should error');
    t.equal(err.numCode, 112, 'should error with correct code');
    t.equal(execStub.callCount, 5, 'called five times');
    t.equal(execStub.getCall(2).args[0], 'npm install -g @mapbox/secret-shield@latest', 'called the update');
    t.equal(execStub.getCall(3).args[0], 'git config --global core.hooksPath', 'checked hooks path');
    t.equal(execStub.getCall(4).args[0], 'secret-shield --add-hooks global >/dev/null 2>&1', 'called secret-shield to update hooks');
  }).then(() => {
    execStub.restore();
    t.end();
  });
});

tape('Correctly catches if no hooks currently configured', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onCall(0).returns('latest: 1.0.0'); // latest
  execStub.onCall(1).returns('{"version": "0.3.5"}'); // current
  execStub.onCall(2).returns();
  execStub.onCall(3).throws();

  update('/foo/bar/config/hooks/pre-commit').then(() => {
    t.ok('does not error');
    t.equal(execStub.callCount, 4, 'called four times');
    t.equal(execStub.getCall(2).args[0], 'npm install -g @mapbox/secret-shield@latest', 'called the update');
    t.equal(execStub.getCall(3).args[0], 'git config --global core.hooksPath', 'checked hooks path');
  }).catch((err) => {
    t.fail('should not error: ' + err);
  }).then(() => {
    execStub.restore();
    t.end();
  });
});

tape('Correctly errors if npm update failed', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onCall(0).returns('latest: 1.0.0'); // latest
  execStub.onCall(1).returns('{"version": "0.3.5"}'); // current
  execStub.onCall(2).throws();

  update('/foo/bar/config/hooks/pre-commit').then(() => {
    t.fail('should have errored');
  }).catch((err) => {
    t.ok('should error');
    t.equal(err.numCode, 111, 'should error with correct code');
    t.equal(execStub.callCount, 3, 'called three times');
    t.equal(execStub.getCall(2).args[0], 'npm install -g @mapbox/secret-shield@latest', 'called the update');
  }).then(() => {
    execStub.restore();
    t.end();
  });
});