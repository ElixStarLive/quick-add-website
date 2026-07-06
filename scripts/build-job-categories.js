#!/usr/bin/env node
/** Generate js/job-categories-data.js from lib/uk-trades-taxonomy.js */
const fs = require('fs');
const path = require('path');
const { UK_TRADES_TAXONOMY } = require('../lib/uk-trades-taxonomy');

const outPath = path.join(__dirname, '..', 'js', 'job-categories-data.js');
const json = JSON.stringify(UK_TRADES_TAXONOMY, null, 2);
const content = '/** Auto-generated from lib/uk-trades-taxonomy.js — run: npm run build:categories */\nconst JOB_CATEGORIES = ' + json + ';\n';

fs.writeFileSync(outPath, content, 'utf8');
const count = Object.values(UK_TRADES_TAXONOMY).reduce((n, arr) => n + arr.length, 0);
console.log('Wrote ' + count + ' job types in ' + Object.keys(UK_TRADES_TAXONOMY).length + ' groups to ' + outPath);
