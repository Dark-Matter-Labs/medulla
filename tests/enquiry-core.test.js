const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../scripts/enquiry-core.js');

test('parsePrefill reads an interest and an option', () => {
  assert.deepEqual(core.parsePrefill('membership:dedicated'), { interest: 'membership', option: 'dedicated' });
  assert.deepEqual(core.parsePrefill('hire:meeting-room'), { interest: 'hire', option: 'meeting-room' });
});

test('parsePrefill accepts an interest on its own', () => {
  assert.deepEqual(core.parsePrefill('host'), { interest: 'host', option: null });
});

test('parsePrefill returns nulls for empty or unknown tokens', () => {
  const none = { interest: null, option: null };
  assert.deepEqual(core.parsePrefill(''), none);
  assert.deepEqual(core.parsePrefill(undefined), none);
  assert.deepEqual(core.parsePrefill('banana:split'), none);
});

test('parsePrefill drops options that do not belong to the interest', () => {
  assert.deepEqual(core.parsePrefill('membership:meeting-room'), { interest: 'membership', option: null });
  assert.deepEqual(core.parsePrefill('visit:dedicated'), { interest: 'visit', option: null });
});

test('prefillFromSearch reads ?interest= and ?option=', () => {
  assert.deepEqual(core.prefillFromSearch('?interest=hire&option=meeting-room'), { interest: 'hire', option: 'meeting-room' });
  assert.deepEqual(core.prefillFromSearch('?interest=membership'), { interest: 'membership', option: null });
  assert.deepEqual(core.prefillFromSearch(''), { interest: null, option: null });
});

test('visibleFieldsFor shows only the groups each interest needs', () => {
  assert.deepEqual(core.visibleFieldsFor('membership'), { membership: true, space: false, extras: false });
  assert.deepEqual(core.visibleFieldsFor('hire'), { membership: false, space: true, extras: true });
  assert.deepEqual(core.visibleFieldsFor('host'), { membership: false, space: false, extras: true });
  assert.deepEqual(core.visibleFieldsFor('visit'), { membership: false, space: false, extras: false });
  assert.deepEqual(core.visibleFieldsFor(null), { membership: false, space: false, extras: false });
});

test('promptFor gives an interest-specific placeholder with a default', () => {
  assert.equal(core.promptFor('membership'), "What you work on, and when you'd like to start");
  assert.equal(core.promptFor('host'), "What the event is, and who it's for");
  assert.equal(core.promptFor(null), 'Say hello, or ask us anything');
});

test('encodeBody url-encodes form pairs for Netlify', () => {
  assert.equal(
    core.encodeBody([['form-name', 'enquiry'], ['name', 'Ana Lima'], ['message', 'a&b=c']]),
    'form-name=enquiry&name=Ana+Lima&message=a%26b%3Dc'
  );
});

test('buildMailto builds subject and body from the filled fields only', () => {
  const href = core.buildMailto({
    interest: 'membership', membership: 'dedicated',
    name: 'Ana', email: 'ana@example.org', organisation: '  ', message: 'Hi there',
  });
  assert.ok(href.startsWith('mailto:hello@medulla.city?'));
  const url = new URL(href);
  assert.equal(url.searchParams.get('subject'), 'Enquiry: Membership · Dedicated desk');
  assert.equal(url.searchParams.get('body'), 'Name: Ana\nEmail: ana@example.org\n\nHi there');
});

test('buildMailto includes timing and size for hires, and copes with no message', () => {
  const url = new URL(core.buildMailto({
    interest: 'hire', space: 'ground-floor', name: 'Ben', email: 'ben@example.org',
    when: 'November', size: '40',
  }));
  assert.equal(url.searchParams.get('subject'), 'Enquiry: Hiring a space · Ground floor · 120 m²');
  assert.equal(url.searchParams.get('body'), 'Name: Ben\nEmail: ben@example.org\nDate or timeframe: November\nGroup size: 40');
});

test('buildMailto falls back to a plain subject without an interest', () => {
  const url = new URL(core.buildMailto({ name: 'Cy', email: 'cy@example.org' }));
  assert.equal(url.searchParams.get('subject'), 'Enquiry');
});
