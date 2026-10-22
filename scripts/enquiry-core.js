// ── Enquiry form — pure logic (no DOM) ──────────────────────────────────────
// Shared by the Spaces page form and the home-page dialog (via enquiry.js) and
// unit-tested in Node (tests/enquiry-core.test.js). Exposed as
// window.MedullaEnquiry in the browser and module.exports in Node.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MedullaEnquiry = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const CONTACT_EMAIL = 'hello@medulla.city';
  const DEFAULT_PROMPT = 'Tell us what you have in mind';
  const DEFAULT_NOTE = 'Choose what you’re interested in. We’ll only ask what we need.';

  const INTERESTS = Object.freeze([
    { value: 'membership', label: 'Membership', optionField: 'membership', extras: false,
      prompt: "What you work on, and when you'd like to start" },
    { value: 'host', label: 'Hosting an event', optionField: null, extras: true,
      prompt: "What the event is, and who it's for" },
    { value: 'partner', label: 'Partner with us', optionField: null, extras: false,
      prompt: 'What you have in mind, and how we might work on it together',
      note: 'No extra questions: tell us below what you’d like to build together.' },
  ]);

  const OPTIONS = Object.freeze({
    membership: [
      { value: 'two-days', label: 'Up to 2 days a week' },
      { value: 'three-plus', label: '3 or more days a week' },
      { value: 'not-sure', label: 'Not sure yet' },
    ],
  });

  const NO_PREFILL = Object.freeze({ interest: null, option: null });

  function getInterest(value) {
    return INTERESTS.find((i) => i.value === value) || null;
  }

  function findOption(field, value) {
    return (OPTIONS[field] || []).find((o) => o.value === value) || null;
  }

  function parsePrefill(token) {
    const [interestValue, optionValue] = String(token || '').split(':');
    const interest = getInterest(interestValue);
    if (!interest) return { ...NO_PREFILL };
    const option = interest.optionField ? findOption(interest.optionField, optionValue) : null;
    return { interest: interest.value, option: option ? option.value : null };
  }

  function prefillFromSearch(search) {
    const params = new URLSearchParams(search || '');
    return parsePrefill(`${params.get('interest') || ''}:${params.get('option') || ''}`);
  }

  function visibleFieldsFor(interestValue) {
    const interest = getInterest(interestValue);
    return {
      membership: Boolean(interest && interest.optionField === 'membership'),
      extras: Boolean(interest && interest.extras),
    };
  }

  // Shown in the follow-up slot when an interest has no follow-up questions.
  function noteFor(interestValue) {
    const interest = getInterest(interestValue);
    return interest ? interest.note || '' : DEFAULT_NOTE;
  }

  function promptFor(interestValue) {
    const interest = getInterest(interestValue);
    return interest ? interest.prompt : DEFAULT_PROMPT;
  }

  function encodeBody(pairs) {
    return new URLSearchParams(pairs).toString();
  }

  function buildMailto(data) {
    const interest = getInterest(data.interest);
    const option = interest && interest.optionField
      ? findOption(interest.optionField, data[interest.optionField])
      : null;
    const subject = interest
      ? `Enquiry: ${interest.label}${option ? ` · ${option.label}` : ''}`
      : 'Enquiry';
    const details = [
      ['Name', data.name],
      ['Email', data.email],
      ['Organisation', data.organisation],
      ['Date or timeframe', data.when],
      ['Group size', data.size],
    ]
      .map(([label, value]) => [label, String(value || '').trim()])
      .filter(([, value]) => value !== '')
      .map(([label, value]) => `${label}: ${value}`);
    const message = String(data.message || '').trim();
    const body = message ? `${details.join('\n')}\n\n${message}` : details.join('\n');
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return Object.freeze({
    CONTACT_EMAIL, INTERESTS, OPTIONS,
    getInterest, parsePrefill, prefillFromSearch, visibleFieldsFor, noteFor, promptFor, encodeBody, buildMailto,
  });
});
