const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const EXPECTED_FIELDS = [
  'bot-field', 'email', 'form-name', 'interest', 'membership', 'message',
  'name', 'organisation', 'size', 'space', 'when',
];

function enquiryFieldNames(file) {
  const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const form = html.match(/<form[^>]*\sname="enquiry"[\s\S]*?<\/form>/);
  assert.ok(form, `${file} contains the enquiry form`);
  const names = [...form[0].matchAll(/\sname="([^"]+)"/g)].map((m) => m[1]).filter((n) => n !== 'enquiry');
  return [...new Set(names)].sort();
}

test('spaces.html enquiry form has exactly the agreed fields', () => {
  assert.deepEqual(enquiryFieldNames('spaces.html'), EXPECTED_FIELDS);
});

test('spaces.html publishes no prices', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'spaces.html'), 'utf8');
  assert.doesNotMatch(html, /€|EUR\b|\d+\s?euro/i);
});

test('index.html dialog form has exactly the same fields as spaces.html', () => {
  assert.deepEqual(enquiryFieldNames('index.html'), enquiryFieldNames('spaces.html'));
});

test('index.html publishes no prices', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.doesNotMatch(html, /€|EUR\b|\d+\s?euro/i);
});
