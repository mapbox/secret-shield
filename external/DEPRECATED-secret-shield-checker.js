#!/usr/bin/env node
'use strict';
const secretShield = require('@mapbox/secret-shield');
process.exit(secretShield.checkAndRun('2018-07-01'));
