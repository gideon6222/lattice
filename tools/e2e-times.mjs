/* The slowest e2e tests, from a JSON run: `npm run e2e -- --reporter=json > test-results/e2e-times.json`
   then `studio run e2e-times`. Prints the count, the total seconds, the slowest 35 and every test
   that did not pass, so a slow tier is chosen from measurements and never from memory. */
import { readFileSync } from 'node:fs';

const text = readFileSync('e2e-times.json', 'utf8');
const report = JSON.parse(text.slice(text.indexOf('{')));
const rows = [];
(function walk(suite) {
  for (const spec of suite.specs || []) {
    for (const t of spec.tests) {
      const secs = Math.round(t.results.reduce((a, r) => a + r.duration, 0) / 1000);
      rows.push({ secs, status: t.status, title: spec.title.slice(0, 80), line: spec.line });
    }
  }
  for (const s of suite.suites || []) walk(s);
})(report.suites[0]);
rows.sort((a, b) => b.secs - a.secs);
console.log(rows.length + ' tests, ' + rows.reduce((a, r) => a + r.secs, 0) + ' s in all');
for (const r of rows.slice(0, 35)) console.log(String(r.secs).padStart(4) + ' s  ' + r.status.padEnd(10) + ' :' + r.line + '  ' + r.title);
console.log('not passing:');
for (const r of rows.filter((x) => x.status !== 'expected')) console.log('  ' + r.status + ' :' + r.line + '  ' + r.title);
