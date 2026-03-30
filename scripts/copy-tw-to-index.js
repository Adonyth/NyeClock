#!/usr/bin/env node
/** 用 tw_.html 覆盖 index.html（二者应保持一致，供 npm run build 使用）。 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = path.join(root, 'tw_.html');
const dst = path.join(root, 'index.html');
fs.writeFileSync(dst, fs.readFileSync(src));
console.log('OK: index.html <- tw_.html (' + fs.statSync(dst).size + ' bytes)');
