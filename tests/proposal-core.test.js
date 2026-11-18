const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const core = require('../scripts/proposal-core.js');

// Fixture numbers only: the real ones live outside the repo.
const pricing = () => ({
  updated: 'test',
  membership: {
    individual: { upTo2: 10, threePlus: 20 },
    nonprofit: { upTo2: 30, threePlus: 40 },
    forprofit: { upTo2: 50, threePlus: 60 },
  },
  events: {
    memberShare: 0.5,
    rooms: [{ id: 'big', name: 'Big room', area: 100, hourly: 15, minHours: 3, day: 100 }],
  },
});

test('validatePricing accepts a complete file and rejects gaps', () => {
  assert.ok(core.validatePricing(pricing()));
  const broken = pricing();
  delete broken.membership.nonprofit;
  assert.throws(() => core.validatePricing(broken), /membership.nonprofit/);
  assert.throws(() => core.validatePricing({ ...pricing(), events: { memberShare: 2, rooms: [] } }), /memberShare/);
});

test('membership: organisations pay per person, individuals count as one', () => {
  const org = core.membershipQuote({ payer: 'nonprofit', people: 3, days: 'threePlus' }, pricing());
  assert.equal(org.perPerson, 40);
  assert.equal(org.monthly, 120);
  const solo = core.membershipQuote({ payer: 'individual', people: 5, days: 'upTo2' }, pricing());
  assert.equal(solo.people, 1);
  assert.equal(solo.monthly, 10);
  assert.equal(core.membershipQuote({ payer: 'nope', days: 'upTo2' }, pricing()), null);
});

test('event: minimum hours apply, then the day rate caps the price', () => {
  const short = core.eventQuote({ room: 'big', member: 'no', duration: { kind: 'hours', hours: 2 } }, pricing());
  assert.equal(short.billedHours, 3);
  assert.equal(short.total, 45);
  const long = core.eventQuote({ room: 'big', member: 'no', duration: { kind: 'hours', hours: 9 } }, pricing());
  assert.equal(long.dayRate, true);
  assert.equal(long.total, 100);
});

test('event: members pay their share, 3-day members get the included event flag', () => {
  const q = core.eventQuote({ room: 'big', member: 'threePlus', duration: { kind: 'hours', hours: 3 } }, pricing());
  assert.equal(q.total, 22.5);
  assert.equal(q.memberDiscount, true);
  assert.equal(q.includedEvent, true);
  assert.equal(core.eventQuote({ room: 'big', member: 'no', duration: { kind: 'hours', hours: 0 } }, pricing()), null);
});

test('euro shows cents only when needed', () => {
  assert.equal(core.euro(490), '€490');
  assert.equal(core.euro(1200), '€1,200');
  assert.equal(core.euro(22.5), '€22.50');
});

test('prices survive an encrypt/decrypt round trip and a wrong code fails', async () => {
  const payload = await core.encryptPricing(pricing(), ' right-code ', webcrypto, 1000);
  assert.deepEqual(await core.decryptPricing(payload, 'right-code', webcrypto.subtle), pricing());
  await assert.rejects(core.decryptPricing(payload, 'wrong-code', webcrypto.subtle));
});

test('the public files carry no prices in plain text', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  for (const file of ['proposal.html', 'scripts/proposal.js', 'scripts/proposal-core.js', 'scripts/proposal-data.js']) {
    const text = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.doesNotMatch(text, /€\s?\d/, `${file} shows a price`);
    assert.doesNotMatch(text, /"upTo2"\s*:\s*\d/, `${file} holds plain pricing data`);
  }
});
