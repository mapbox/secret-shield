'use strict';

const tape = require('tape');
const sinon = require('sinon');

const fs = require('fs');
const cp = require('child_process');
const os = require('os');
const { commandJoin } = require('command-join');

const checkInstalled = require('../checkInstalled');

////////////////////////////////////////
// checkInstalled

tape('checkInstalled no secret-shield inside grace period', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onFirstCall().throws();

  t.equal(checkInstalled.checkInstalled('3199-12-31', '/bin:/usr/bin'), 255);

  execStub.restore();
  t.end();
});

tape('checkInstalled no secret-shield outside of grace period', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onFirstCall().throws();

  t.equal(checkInstalled.checkInstalled('1970-01-01', '/bin:/usr/bin'), 10);

  execStub.restore();
  t.end();
});

tape('checkInstalled wrong version', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onFirstCall().returns();
  execStub.onSecondCall().returns('{"version": "0.3.5"}');

  t.equal(checkInstalled.checkInstalled('1970-01-01', '/bin:/usr/bin'), 11);

  execStub.restore();
  t.end();
});

tape('checkInstalled wrong version grace period', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onFirstCall().returns();
  execStub.onSecondCall().returns('{"version": "0.3.5"}');

  t.equal(checkInstalled.checkInstalled('2970-01-01', '/bin:/usr/bin'), 11);

  execStub.restore();
  t.end();
});

tape('checkInstalled version ok', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onFirstCall().returns();
  execStub.onSecondCall().returns('{"version": "1.0.0-beta"}');

  t.equal(checkInstalled.checkInstalled('1970-01-01', '/bin:/usr/bin'), -1);

  execStub.restore();
  t.end();
});

tape('checkInstalled version ok grace period', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onFirstCall().returns();
  execStub.onSecondCall().returns('{"version": "1.0.0-beta"}');

  t.equal(checkInstalled.checkInstalled('2970-01-01', '/bin:/usr/bin'), -1);

  execStub.restore();
  t.end();
});

////////////////////////////////////////
// checkHooksGlobal

tape('checkHooksGlobal with empty hooks return', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onFirstCall().returns('');
  execStub.onSecondCall().returns('Successfully added global hooks!');

  t.equal(checkInstalled.checkHooksGlobal(), 0, 'should indicate success, done');

  execStub.restore();
  t.end();
});

tape('checkHooksGlobal with erorr return', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onFirstCall().throws();
  execStub.onSecondCall().returns('Successfully added global hooks!');

  t.equal(checkInstalled.checkHooksGlobal(), 0, 'should indicate continue');

  execStub.restore();

  t.end();
});

tape('checkHooksGlobal with failed to create hooks', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onFirstCall().throws();
  execStub.onSecondCall().throws();

  t.equal(checkInstalled.checkHooksGlobal(), 20, 'should indicate failure');

  execStub.restore();

  t.end();
});

tape('checkHooksGlobal with valid hooks and file exist and executable', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onFirstCall().returns('/foo/bar');
  execStub.onSecondCall().returns();

  const existsStub = sinon.stub(fs, 'existsSync');
  existsStub.onFirstCall().returns(true);

  const accessStub = sinon.stub(fs, 'accessSync');
  accessStub.onFirstCall().returns(true);

  t.equal(checkInstalled.checkHooksGlobal(), 0, 'should indicate OK');
  t.equal(existsStub.getCall(0).args[0], '/foo/bar/pre-commit', 'should have checked the correct file');

  execStub.restore();
  existsStub.restore();
  accessStub.restore();
  t.end();
});

tape('checkHooksGlobal with valid hooks and file exist and executable and trailing slash', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onFirstCall().returns('/foo/bar/');
  execStub.onSecondCall().returns();

  const existsStub = sinon.stub(fs, 'existsSync');
  existsStub.onFirstCall().returns(true);

  const accessStub = sinon.stub(fs, 'accessSync');
  accessStub.onFirstCall().returns(true);

  t.equal(checkInstalled.checkHooksGlobal(), 0, 'should indicate OK');
  t.equal(existsStub.getCall(0).args[0], '/foo/bar/pre-commit', 'should have checked the correct file');

  execStub.restore();
  existsStub.restore();
  accessStub.restore();
  t.end();
});

tape('checkHooksGlobal with valid hooks and file exist and executable and trailing slash but no shield', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onFirstCall().returns('/foo/bar/');
  execStub.onSecondCall().throws();

  const existsStub = sinon.stub(fs, 'existsSync');
  existsStub.onFirstCall().returns(true);

  const accessStub = sinon.stub(fs, 'accessSync');
  accessStub.onFirstCall().returns(true);

  t.equal(checkInstalled.checkHooksGlobal(), 24, 'should indicate not secret shield');
  t.equal(existsStub.getCall(0).args[0], '/foo/bar/pre-commit', 'should have checked the correct file');

  execStub.restore();
  existsStub.restore();
  accessStub.restore();
  t.end();
});


tape('checkHooksGlobal with valid hooks and file exist but not executable', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onFirstCall().returns('/foo/bar/');

  const existsStub = sinon.stub(fs, 'existsSync');
  existsStub.onFirstCall().returns(true);

  const accessStub = sinon.stub(fs, 'accessSync');
  accessStub.onFirstCall().throws();

  t.equal(checkInstalled.checkHooksGlobal(), 21, 'should indicate failure');
  t.equal(existsStub.getCall(0).args[0], '/foo/bar/pre-commit', 'should have checked the correct file');

  execStub.restore();
  existsStub.restore();
  accessStub.restore();
  t.end();
});

tape('checkHooksGlobal with valid hooks and file not exist and create ok', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onFirstCall().returns('/foo/bar/');
  execStub.onSecondCall().returns('{"installed_dir": "/baz"}');
  execStub.onThirdCall().returns();
  execStub.onCall(3).returns(); // fourth call

  const existsStub = sinon.stub(fs, 'existsSync');
  existsStub.onFirstCall().returns(false);

  const accessStub = sinon.stub(fs, 'accessSync');

  t.equal(checkInstalled.checkHooksGlobal('/bin:/usr/bin'), 0, 'should indicate success and done');
  t.equal(existsStub.getCall(0).args[0], '/foo/bar/pre-commit', 'should have checked the correct file');

  execStub.restore();
  existsStub.restore();
  accessStub.restore();
  t.end();
});

tape('checkHooksGlobal with valid hooks and file not exist and create fail', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onFirstCall().returns('/foo/bar/');
  execStub.onSecondCall().returns('{"installed_dir": "/baz"}');
  execStub.onThirdCall().throws();
  execStub.onCall(3).returns(); // fourth call

  const existsStub = sinon.stub(fs, 'existsSync');
  existsStub.onFirstCall().returns(false);

  const accessStub = sinon.stub(fs, 'accessSync');

  t.equal(checkInstalled.checkHooksGlobal(), 22, 'should indicate error');
  t.equal(existsStub.getCall(0).args[0], '/foo/bar/pre-commit', 'should have checked the correct file');

  execStub.restore();
  existsStub.restore();
  accessStub.restore();
  t.end();
});

tape('checkHooksGlobal with valid hooks and file not exist and create ok but exec fail', (t) => {
  const execStub = sinon.stub(cp, 'execSync');
  execStub.onFirstCall().returns('/foo/bar/');
  execStub.onSecondCall().returns('{"installed_dir": "/baz"}');
  execStub.onThirdCall().returns();
  execStub.onCall(3).throws(); // fourth call

  const existsStub = sinon.stub(fs, 'existsSync');
  existsStub.onFirstCall().returns(false);

  const accessStub = sinon.stub(fs, 'accessSync');

  t.equal(checkInstalled.checkHooksGlobal(), 23, 'should indicate error');
  t.equal(existsStub.getCall(0).args[0], '/foo/bar/pre-commit', 'should have checked the correct file');

  execStub.restore();
  existsStub.restore();
  accessStub.restore();
  t.end();
});
