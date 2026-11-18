// ── Proposal questionnaire — DOM wiring ─────────────────────────────────────
// Unlocks the prices with the access code, shows the questions for the chosen
// path, keeps a live proposal beside the form, and on send posts a copy to
// Netlify Forms ("proposal") and opens the print dialog to save it as a PDF.
// Everything a visitor typed is written with textContent, never as HTML.
(function () {
  const core = window.MedullaProposal;
  const payload = window.MEDULLA_PROPOSAL_DATA;
  const $ = (sel, root = document) => root.querySelector(sel);
  const gate = $('#gate');
  const form = $('#q');
  const out = $('#proposal');
  let pricing = null;

  // ── 1. access code ──
  const gateMsg = $('#gate-msg');
  if (!core || !payload) { gateMsg.textContent = 'This page could not load. Please try again later.'; return; }
  if (!(window.crypto && crypto.subtle && window.TextDecoder)) {
    gateMsg.textContent = "This browser can't open the page. Try Safari, Chrome, Firefox or Edge, not inside another app.";
    $('#open').disabled = true;
    return;
  }

  async function unlock(code) {
    const button = $('#open');
    button.disabled = true; button.textContent = 'Opening…'; gateMsg.textContent = '';
    try {
      pricing = await core.decryptPricing(payload, code, crypto.subtle);
      gate.hidden = true;
      $('#app').hidden = false;
      renderRooms();
      refresh();
      $('#f-name').focus();
    } catch (error) {
      button.disabled = false; button.textContent = 'Open';
      gateMsg.textContent = error && error.name === 'OperationError'
        ? 'That code did not open it. Check it and try again.'
        : 'The page could not open in this browser. Try Safari, Chrome, Firefox or Edge.';
      $('#code').select();
    }
  }

  gate.addEventListener('submit', (e) => { e.preventDefault(); unlock($('#code').value); });
  // A link can carry the code after # (never sent to a server): /proposal#code=…
  const fromHash = new URLSearchParams(location.hash.slice(1)).get('code');
  if (fromHash) { $('#code').value = fromHash; history.replaceState(null, '', location.pathname); unlock(fromHash); }

  // ── 2. answers and visibility ──
  function renderRooms() {
    const box = $('#rooms');
    box.replaceChildren(...pricing.events.rooms.map((r) => {
      const label = el('label', 'choice');
      const input = el('input'); input.type = 'radio'; input.name = 'room'; input.value = r.id;
      const span = el('span', null, r.name);
      span.append(el('small', null, `${r.area} m²`));
      label.append(input, span);
      return label;
    }));
  }

  function answers() {
    const d = new FormData(form);
    const v = (k) => (d.get(k) || '').toString().trim();
    return {
      name: v('name'), email: v('email'), organisation: v('organisation'), path: v('path'),
      payer: v('payer'), people: Number(v('people')) || 1, days: v('days'),
      guest: d.has('guest'), hostEvents: d.has('hostEvents'), start: v('start'),
      member: v('member'), educational: v('educational'), format: v('format'), slot: v('slot'),
      room: v('room'), length: v('length'), hours: Number(v('hours')) || 0,
      guests: v('guests'), date: v('date'), idea: v('idea'),
    };
  }

  function show(selector, on) {
    document.querySelectorAll(selector).forEach((node) => {
      node.hidden = !on;
      node.querySelectorAll('input, select, textarea').forEach((f) => { f.disabled = !on; });
    });
  }

  function refresh() {
    // Re-enabling a block brings back its answers, which can open the next block: one pass per nesting level.
    for (let level = 0; level < 4; level += 1) applyVisibility();
    render(build(answers()));
  }

  function applyVisibility() {
    const a = answers();
    ['join', 'host', 'partner'].forEach((p) => show(`[data-path="${p}"]`, a.path === p));
    // Nested blocks after their parents: a hidden block's fields are disabled, so they drop out of the answers.
    show('[data-when="org"]', a.path === 'join' && Boolean(a.payer) && a.payer !== 'individual');
    const edu = a.path === 'host' && a.educational === 'yes';
    show('[data-when="educational"]', edu);
    show('[data-when="hire"]', edu && a.slot === 'hire');
    show('[data-when="hours"]', edu && a.slot === 'hire' && a.length === 'hours');
  }
  form.addEventListener('input', refresh);
  form.addEventListener('change', refresh);

  // ── 3. the proposal, as plain data ──
  const monthName = (ym) => (ym ? new Date(`${ym}-01T12:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '');
  const dayName = (ymd) => (ymd ? new Date(`${ymd}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '');

  function build(a) {
    const p = { a, rows: [], price: null, list: [], notes: [], title: '', missing: null };
    if (a.path === 'join') {
      p.title = 'Joining the community';
      const q = core.membershipQuote({ payer: a.payer, people: a.people, days: a.days }, pricing);
      if (!q) { p.missing = 'Choose who is contributing and how many days a week.'; return p; }
      p.rows.push(['Who contributes', core.PAYERS[q.payer]], ['Days', core.DAYS[q.days]]);
      if (q.payer !== 'individual') p.rows.push(['People', String(q.people)]);
      if (a.start) p.rows.push(['Start', monthName(a.start)]);
      p.price = {
        label: 'Suggested contribution', amount: `${core.euro(q.monthly)} a month`,
        detail: q.people > 1 ? `${core.euro(q.perPerson)} a person a month, for ${q.people} people` : 'a person a month',
      };
      p.list = q.includes;
      if (a.guest) p.notes.push("We'll agree together how your intern or guest joins.");
      if (a.hostEvents) p.notes.push('Members pay half for event hire.');
    } else if (a.path === 'host') {
      p.title = 'Hosting a gathering';
      if (!a.member || !a.educational) { p.missing = 'Tell us if you are a member and what kind of event it is.'; return p; }
      if (a.educational === 'no') {
        p.notes.push('Medulla hosts learning events: talks, workshops and sessions open beyond your own team. Tell us more about your idea and we will see together whether there is a fit.');
        return p;
      }
      if (a.format) p.rows.push(['Kind of event', a.format]);
      p.rows.push(['Member', core.MEMBER[a.member]]);
      if (a.guests) p.rows.push(['People', a.guests]);
      if (a.date) p.rows.push(['Preferred date', dayName(a.date)]);
      if (a.slot === 'programme') {
        p.rows.push(['Format', "Medulla's public programme, 18:00 to 21:30"]);
        p.notes.push("We plan the public programme together with you. We'll agree the details when we talk.");
        return p;
      }
      if (a.slot !== 'hire') { p.missing = "Choose whether it is part of Medulla's programme or your own event."; return p; }
      const duration = a.length === 'day' ? { kind: 'day' } : a.length === 'hours' ? { kind: 'hours', hours: a.hours } : null;
      const q = core.eventQuote({ room: a.room, member: a.member, duration }, pricing);
      if (!q) { p.missing = 'Choose a space and how long you need it.'; return p; }
      p.rows.push(['Space', `${q.room.name}, ${q.room.area} m²`],
        ['Time', q.dayRate ? 'Full day' : `${q.billedHours} hours${q.billedHours > a.hours ? ` (${q.room.minHours}-hour minimum)` : ''}`]);
      p.price = {
        label: 'Contribution for the space', amount: core.euro(q.total),
        detail: q.memberDiscount ? `Members pay half of ${core.euro(q.base)}` : (q.dayRate && a.length === 'hours' ? 'Capped at the full-day rate' : ''),
      };
      if (q.includedEvent) p.notes.push('Your membership includes one event a month, so this may already be covered.');
      p.list = ['Learning events only, open beyond your own team', 'No sale of alcohol', 'Leave the space as you found it', 'VAT is confirmed on booking'];
    } else if (a.path === 'partner') {
      p.title = 'Partnering with us';
      p.notes.push("Partnerships don't have a fixed price. We'll set up a conversation about what we could build together.");
      if (a.idea) p.rows.push(['Your idea', a.idea]);
    } else {
      p.missing = 'Choose how you would like to be part of Medulla.';
    }
    return p;
  }

  // ── 4. render ──
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function render(p) {
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const head = el('header', 'p-head');
    const logo = el('img'); logo.src = '/assets/logos/medulla-wordmark-wide.svg'; logo.alt = 'Medulla'; logo.width = 150; logo.height = 37;
    head.append(logo, el('p', 'p-meta', `Proposal · ${today}`));
    const who = [p.a.name || 'Your name', p.a.organisation].filter(Boolean).join(', ');
    const nodes = [head, el('h2', 'p-for', `For ${who}`),
      el('p', 'p-intro', 'Medulla is a collaborative space, learning node and community in Berlin, in a quiet courtyard between Mitte and Kreuzberg. People from public institutions, research, civic initiatives, the arts and technology work here on problems no one can solve alone.')];

    if (p.title) nodes.push(el('h3', 'p-title', p.title));
    if (p.missing) nodes.push(el('p', 'p-missing', p.missing));
    if (p.rows.length) {
      const dl = el('dl', 'p-rows');
      p.rows.forEach(([k, v]) => dl.append(el('dt', null, k), el('dd', null, v)));
      nodes.push(dl);
    }
    if (p.price) {
      const box = el('div', 'p-price');
      box.append(el('p', 'p-price__label', p.price.label), el('p', 'p-price__amount', p.price.amount));
      if (p.price.detail) box.append(el('p', 'p-price__detail', p.price.detail));
      nodes.push(box);
    }
    if (p.list.length) {
      const ul = el('ul', 'p-list');
      p.list.forEach((item) => ul.append(el('li', null, item)));
      nodes.push(ul);
    }
    p.notes.forEach((n) => nodes.push(el('p', 'p-note', n)));
    if (!p.missing) {
      nodes.push(el('h3', 'p-title', 'Next step'),
        el('p', null, 'Reply to the person you have been talking to, or write to hello@medulla.city with this proposal. Nothing is booked until we confirm it together.'));
    }
    nodes.push(el('p', 'p-foot', `Suggested contributions from Medulla's contribution model, ${pricing.updated}. A contribution to a space with an educational purpose, not rent. This proposal is for you; please don't publish it.`));
    out.replaceChildren(...nodes);
  }

  // ── 5. send a copy, then print ──
  function problem(a) {
    if (!a.name) return ['#f-name', 'Please add your name.'];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) return ['#f-email', 'Please add a valid email address.'];
    const p = build(a);
    if (p.missing) return [null, p.missing];
    return null;
  }

  function summary(p) {
    const lines = [p.title, ...p.rows.map(([k, v]) => `${k}: ${v}`)];
    if (p.price) lines.push(`${p.price.label}: ${p.price.amount}${p.price.detail ? ` (${p.price.detail})` : ''}`);
    return lines.concat(p.notes).join('\n');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#send-msg');
    const a = answers();
    const issue = problem(a);
    if (issue) {
      msg.textContent = issue[1];
      if (issue[0]) $(issue[0]).focus();
      return;
    }
    const p = build(a);
    const button = $('#send');
    button.disabled = true; button.textContent = 'Sending…'; msg.textContent = '';
    const body = new URLSearchParams({
      'form-name': 'proposal', name: a.name, email: a.email, organisation: a.organisation,
      path: a.path, total: p.price ? p.price.amount : '', summary: summary(p),
    });
    try {
      const response = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
      if (!response.ok) throw new Error(`Netlify Forms responded ${response.status}`);
      msg.textContent = 'Sent. We have a copy and will be in touch. Save your PDF from the print window.';
    } catch (error) {
      console.error('Proposal copy failed:', error);
      msg.textContent = "We couldn't send our copy. Your PDF still works: please email it to hello@medulla.city.";
    } finally {
      button.disabled = false; button.textContent = 'Send to Medulla and save as PDF';
    }
    window.print();
  });
})();
