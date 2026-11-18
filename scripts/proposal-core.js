// ── Proposal questionnaire — pure logic (no DOM) ────────────────────────────
// Prices are never public: they ship only as ciphertext (scripts/proposal-data.js)
// and are decrypted in the browser with the access code we send after a first
// conversation. This file validates the decrypted numbers, works out quotes,
// and holds the crypto shared by the browser page and tools/encrypt-pricing.mjs.
// Unit-tested in Node (tests/proposal-core.test.js).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MedullaProposal = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const PAYERS = Object.freeze({
    individual: 'Personal, paying from your own pocket',
    nonprofit: 'Non-profit organisation',
    forprofit: 'For-profit organisation',
  });
  const DAYS = Object.freeze({ upTo2: 'Up to 2 days a week', threePlus: '3 or more days a week' });
  const MEMBER = Object.freeze({ no: 'Not a member', upTo2: 'Member, up to 2 days a week', threePlus: 'Member, 3 or more days a week' });
  const ROUNDS = 600000;

  const isAmount = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0;

  // Throws with a plain message if the decrypted file is not what the page expects.
  function validatePricing(p) {
    const fail = (what) => { throw new Error(`Pricing file: ${what}`); };
    if (!p || typeof p !== 'object') fail('not an object');
    if (typeof p.updated !== 'string' || !p.updated) fail('missing "updated"');
    for (const payer of Object.keys(PAYERS)) {
      const row = p.membership && p.membership[payer];
      if (!row || !isAmount(row.upTo2) || !isAmount(row.threePlus)) fail(`membership.${payer} needs upTo2 and threePlus`);
    }
    const ev = p.events;
    if (!ev || !isAmount(ev.memberShare) || ev.memberShare > 1) fail('events.memberShare must be between 0 and 1');
    if (!Array.isArray(ev.rooms) || ev.rooms.length === 0) fail('events.rooms must list at least one room');
    ev.rooms.forEach((r, i) => {
      if (!r || typeof r.id !== 'string' || typeof r.name !== 'string') fail(`room ${i} needs id and name`);
      if (!isAmount(r.area) || !isAmount(r.hourly) || !isAmount(r.minHours) || !isAmount(r.day)) fail(`room ${r.id} needs area, hourly, minHours, day`);
    });
    return p;
  }

  function membershipQuote({ payer, people, days }, pricing) {
    const row = pricing.membership[payer];
    if (!row || !(days in DAYS)) return null;
    const count = payer === 'individual' ? 1 : Math.max(1, Math.floor(Number(people) || 1));
    const perPerson = row[days];
    const includes = days === 'threePlus'
      ? ['A fixed place upstairs', 'The right to host one event a month', 'Half price on further event hire']
      : ['A place at the shared tables, and the ground floor when upstairs is full', 'Half price on event hire'];
    return { payer, days, people: count, perPerson, monthly: perPerson * count, includes };
  }

  // duration: { kind: 'day' } or { kind: 'hours', hours }
  function eventQuote({ room, member, duration }, pricing) {
    const r = pricing.events.rooms.find((x) => x.id === room);
    if (!r || !(member in MEMBER) || !duration) return null;
    let billedHours = null;
    let base;
    let dayRate = duration.kind === 'day';
    if (dayRate) base = r.day;
    else {
      const hours = Number(duration.hours);
      if (!(hours > 0)) return null;
      billedHours = Math.max(hours, r.minHours);
      base = billedHours * r.hourly;
      if (base > r.day) { base = r.day; dayRate = true; billedHours = null; }
    }
    const share = member === 'no' ? 1 : pricing.events.memberShare;
    return {
      room: r, member, billedHours, dayRate, base, total: round2(base * share),
      memberDiscount: share < 1, includedEvent: member === 'threePlus',
    };
  }

  const round2 = (n) => Math.round(n * 100) / 100;

  function euro(n) {
    const whole = Number.isInteger(n);
    return '€' + n.toLocaleString('en-GB', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 });
  }

  // ── crypto: PBKDF2-SHA256 → AES-GCM-256, same scheme as /contribution ──────
  const b64 = {
    enc: (u8) => (typeof Buffer !== 'undefined' ? Buffer.from(u8).toString('base64') : btoa(String.fromCharCode(...u8))),
    dec: (s) => (typeof Buffer !== 'undefined' ? new Uint8Array(Buffer.from(s, 'base64')) : Uint8Array.from(atob(s), (c) => c.charCodeAt(0))),
  };

  async function deriveKey(subtle, code, salt, rounds, usage) {
    const base = await subtle.importKey('raw', new TextEncoder().encode(code.trim()), 'PBKDF2', false, ['deriveKey']);
    return subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: rounds }, base, { name: 'AES-GCM', length: 256 }, false, [usage]);
  }

  async function encryptPricing(pricing, code, cryptoImpl, rounds = ROUNDS) {
    validatePricing(pricing);
    const salt = cryptoImpl.getRandomValues(new Uint8Array(16));
    const iv = cryptoImpl.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(cryptoImpl.subtle, code, salt, rounds, 'encrypt');
    const ct = await cryptoImpl.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(pricing)));
    return { rounds, salt: b64.enc(salt), iv: b64.enc(iv), ct: b64.enc(new Uint8Array(ct)) };
  }

  // Rejects with an OperationError when the code is wrong.
  async function decryptPricing(payload, code, subtle) {
    const key = await deriveKey(subtle, code, b64.dec(payload.salt), payload.rounds, 'decrypt');
    const plain = await subtle.decrypt({ name: 'AES-GCM', iv: b64.dec(payload.iv) }, key, b64.dec(payload.ct));
    return validatePricing(JSON.parse(new TextDecoder().decode(plain)));
  }

  return { PAYERS, DAYS, MEMBER, validatePricing, membershipQuote, eventQuote, euro, encryptPricing, decryptPricing };
});
