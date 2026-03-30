#!/usr/bin/env node
/**
 * Copies Cloud-related sections from tw_.html into index.html (default Pages entry).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const twPath = path.join(root, 'tw_.html');
const indexPath = path.join(root, 'index.html');

const tw = fs.readFileSync(twPath, 'utf8');
let idx = fs.readFileSync(indexPath, 'utf8');

function replaceRange(hay, startNeedle, endNeedle, replacement) {
  const a = hay.indexOf(startNeedle);
  if (a < 0) throw new Error('start not found: ' + startNeedle.slice(0, 80));
  const b = hay.indexOf(endNeedle, a);
  if (b < 0) throw new Error('end not found after start');
  return hay.slice(0, a) + replacement + hay.slice(b + endNeedle.length);
}

// 1) Cloud panel HTML
const cloudStart = '      <div id="accountPaneCloud"';
const navMarker = '\n\n  <nav class="bottom-dock"';
const twCloudA = tw.indexOf(cloudStart);
const twNav = tw.indexOf(navMarker, twCloudA);
if (twCloudA < 0 || twNav < 0) throw new Error('tw cloud/nav markers');
const cloudReplacement = tw.slice(twCloudA, twNav);
idx = replaceRange(idx, cloudStart, navMarker, cloudReplacement);

// 2) CSS: .nye-cloud-email … before .hero-panel
const cssStart = '    .nye-cloud-email {';
const cssEnd = '    .hero-panel {';
const twCssA = tw.indexOf(cssStart);
const twCssB = tw.indexOf(cssEnd, twCssA);
if (twCssA < 0 || twCssB < 0) throw new Error('tw css markers');
const cssReplacement = tw.slice(twCssA, twCssB);
idx = replaceRange(idx, cssStart, cssEnd, cssReplacement);

// 3) initNyeCloudSync
const jsStart = '    (function initNyeCloudSync() {';
const jsEnd = '    })();\n    initLocale();';
const twJsA = tw.indexOf(jsStart);
const twJsB = tw.indexOf(jsEnd, twJsA);
if (twJsA < 0 || twJsB < 0) throw new Error('tw initNyeCloudSync');
const jsReplacement = tw.slice(twJsA, twJsB + jsEnd.length);
idx = replaceRange(idx, jsStart, jsEnd, jsReplacement);

// 4) I18N en — account block
const enAccStart = "      account: {\n        hubTitle: 'My account',";
const enAccEnd = "      },\n      lang: {\n        groupAria: 'Language'";
const twEnA = tw.indexOf(enAccStart);
const twEnB = tw.indexOf(enAccEnd, twEnA);
if (twEnA < 0 || twEnB < 0) throw new Error('tw en account');
const enReplacement = tw.slice(twEnA, twEnB);
idx = replaceRange(idx, enAccStart, enAccEnd, enReplacement);

// 5) I18N zh — account block (Object.assign branch)
const zhAccStart = "      account: {\n        hubTitle: '我的账户',";
const zhAccEnd = "      },\n      lang: {\n        groupAria: '语言'";
const twZhA = tw.indexOf(zhAccStart);
const twZhB = tw.indexOf(zhAccEnd, twZhA);
if (twZhA < 0 || twZhB < 0) throw new Error('tw zh account');
const zhReplacement = tw.slice(twZhA, twZhB);
idx = replaceRange(idx, zhAccStart, zhAccEnd, zhReplacement);

fs.writeFileSync(indexPath, idx);
console.log('OK: synced Cloud UI, CSS, JS, I18N from tw_.html → index.html');
