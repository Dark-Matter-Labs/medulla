// ── Proposal questionnaire — DOM wiring ─────────────────────────────────────
// Unlocks the prices with the access code, shows the questions for the chosen
// path, keeps a live proposal beside the form (plus a price bar on phones),
// and on send opens the print dialog to save a PDF while a copy is posted to
// Netlify Forms ("proposal"). Everything a visitor typed is written with
// textContent, never as HTML.
(function () {
  const core = window.MedullaProposal;
  const payload = window.MEDULLA_PROPOSAL_DATA;
  const $ = (sel, root = document) => root.querySelector(sel);
  const gate = $('#gate');
  const form = $('#q');
  const out = $('#proposal');
  const ADDRESS = 'Medulla · Dresdener Str. 113B, 10179 Berlin · medulla.city · hello@medulla.city';
  let pricing = null;
  let lastAmount = null;

  // ── 1. access code ──
  const gateMsg = $('#gate-msg');
  if (!core || !payload) { gateMsg.textContent = 'This page could not load. Please try again later.'; return; }
  if (!(window.crypto && crypto.subtle && window.TextDecoder)) {
    gateMsg.textContent = 'This browser can’t open the page. Try Safari, Chrome, Firefox or Edge, not inside another app.';
    $('#open').disabled = true;
    return;
  }

  async function unlock(code) {
    const button = $('#open');
    const field = $('#code');
    button.disabled = true; button.textContent = 'Opening…'; gateMsg.textContent = '';
    try {
      pricing = await core.decryptPricing(payload, code, crypto.subtle);
      gate.hidden = true;
      $('#app').hidden = false;
      renderRooms();
      refresh();
      watchPeek();
      $('#f-name').focus();
    } catch (error) {
      button.disabled = false; button.textContent = 'Open';
      field.setAttribute('aria-invalid', 'true');
      gateMsg.textContent = error && error.name === 'OperationError'
        ? 'That code did not open it. Check it and try again.'
        : 'The page could not open in this browser. Try Safari, Chrome, Firefox or Edge.';
      field.select();
    }
  }

  gate.addEventListener('submit', (e) => { e.preventDefault(); unlock($('#code').value); });
  $('#code').addEventListener('input', () => $('#code').removeAttribute('aria-invalid'));
  // A link can carry the code after # (never sent to a server): /proposal#code=…
  const fromHash = new URLSearchParams(location.hash.slice(1)).get('code');
  if (fromHash) { $('#code').value = fromHash; history.replaceState(null, '', location.pathname); unlock(fromHash); }

  // ── 2. answers and visibility ──
  function renderRooms() {
    $('#rooms').replaceChildren(...pricing.events.rooms.map((r) => {
      const label = el('label', 'choice');
      const input = el('input'); input.type = 'radio'; input.name = 'room'; input.value = r.id;
      const span = el('span', null, r.name);
      span.append(el('small', null, `${r.area} m² · from ${r.minHours} hours`));
      label.append(input, span);
      return label;
    }));
  }

  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const num = (s) => Number(String(s).replace(',', '.'));

  function answers() {
    const d = new FormData(form);
    const v = (k) => (d.get(k) || '').toString().trim();
    const hours = num(v('hours'));
    return {
      name: v('name'), email: v('email'), organisation: v('organisation'), path: v('path'),
      payer: v('payer'), people: clamp(Math.round(num(v('people'))) || 1, 1, 30), days: v('days'),
      guest: d.has('guest'), hostEvents: d.has('hostEvents'), start: v('start'),
      member: v('member'), educational: v('educational'), format: v('format'), slot: v('slot'),
      room: v('room'), length: v('length'), hours: hours > 0 ? clamp(hours, 0.5, 12) : 0,
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
    const host = a.path === 'host';
    const edu = host && a.educational === 'yes';
    show('[data-when="notEdu"]', host && a.educational === 'no');
    show('[data-when="educational"]', edu);
    show('[data-when="hire"]', edu && a.slot === 'hire');
    show('[data-when="hours"]', edu && a.slot === 'hire' && a.length === 'hours');
  }

  form.addEventListener('input', (e) => { clearError(e.target); refresh(); });
  form.addEventListener('change', (e) => { clearError(e.target); refresh(); });
  // Enter in a single-line field must not send the whole questionnaire.
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('input:not([type=radio]):not([type=checkbox])')) e.preventDefault();
  });

  // ── 3. the proposal, as plain data ──
  const monthName = (ym) => (/^\d{4}-\d{2}$/.test(ym) ? new Date(`${ym}-01T12:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : ym);
  const dayName = (ymd) => (/^\d{4}-\d{2}-\d{2}$/.test(ymd) ? new Date(`${ymd}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ymd);

  // `focus` names the first unanswered question, so a send can take the person there.
  function build(a) {
    const p = { a, rows: [], price: null, list: [], notes: [], title: '', missing: null, focus: null };
    const need = (message, focus) => { p.missing = message; p.focus = focus; return p; };
    if (a.path === 'join') {
      p.title = 'Joining the community';
      if (!a.payer) return need('Choose who is contributing.', '[name=payer]');
      if (!a.days) return need('Choose how many days a week.', '[name=days]');
      const q = core.membershipQuote({ payer: a.payer, people: a.people, days: a.days }, pricing);
      p.rows.push(['Who contributes', core.PAYERS[q.payer]], ['Days', core.DAYS[q.days]]);
      if (q.payer !== 'individual') p.rows.push(['People', String(q.people)]);
      if (a.start) p.rows.push(['Start', monthName(a.start)]);
      p.price = {
        label: 'Suggested contribution', amount: `${core.euro(q.monthly)} a month`,
        detail: q.people > 1 ? `${core.euro(q.perPerson)} a person a month, for ${q.people} people` : '',
      };
      p.list = q.includes;
      if (a.guest) p.notes.push('We’ll agree together how your intern or guest joins.');
      if (a.hostEvents) {
        p.notes.push(q.days === 'threePlus'
          ? 'You’d like to host events: one a month is part of your contribution, and further hires are half price. We’ll plan them together.'
          : 'You’d like to host events: as members you pay half for event hire. We’ll plan them together.');
      }
      p.notes.push('We confirm invoicing and the start date when we talk.');
    } else if (a.path === 'host') {
      p.title = 'Hosting a gathering';
      if (!a.member) return need('Tell us whether you are a member.', '[name=member]');
      if (!a.educational) return need('Tell us whether it is a learning event.', '[name=educational]');
      if (a.educational === 'no') {
        if (a.idea) p.rows.push(['Your idea', a.idea]);
        p.notes.push('Medulla hosts learning events: talks, workshops and sessions open beyond your own team. Tell us more about your idea and we’ll see together whether there is a fit.');
        return p;
      }
      if (a.format) p.rows.push(['Kind of event', a.format]);
      p.rows.push(['Member', core.MEMBER[a.member]]);
      if (a.guests) p.rows.push(['People', a.guests]);
      if (a.date) p.rows.push(['Preferred date', dayName(a.date)]);
      if (!a.slot) return need('Choose whether it is part of Medulla’s programme or your own event.', '[name=slot]');
      if (a.slot === 'programme') {
        p.rows.push(['Format', 'Medulla’s public programme, 18:00 to 21:30']);
        p.notes.push('We plan the public programme together with you, and agree the details when we talk.');
        return p;
      }
      if (!a.room) return need('Choose a space.', '[name=room]');
      if (!a.length) return need('Choose how long you need it.', '[name=length]');
      const duration = a.length === 'day' ? { kind: 'day' } : { kind: 'hours', hours: a.hours };
      const q = core.eventQuote({ room: a.room, member: a.member, duration }, pricing);
      if (!q) return need('Add how many hours you need.', '#f-hours');
      p.rows.push(['Space', `${q.room.name}, ${q.room.area} m²`],
        ['Time', q.dayRate ? 'Full day' : `${q.billedHours} hours${q.billedHours > a.hours ? ` (${q.room.minHours}-hour minimum)` : ''}`]);
      p.price = {
        label: 'Contribution for the space', amount: core.euro(q.total),
        detail: q.memberDiscount ? `Members pay half of ${core.euro(q.base)}` : (q.dayRate && a.length === 'hours' ? 'Capped at the full-day rate' : ''),
      };
      if (q.includedEvent) p.notes.push('Your membership includes one event a month, so this may already be covered.');
      p.list = ['Learning events only, open beyond your own team', 'No sale of alcohol', 'Leave the space as you found it', 'VAT is confirmed on booking'];
    } else if (a.path === 'partner') {
      p.title = 'Partnering with us';
      p.notes.push('Partnerships don’t have a fixed price. We’ll set up a conversation about what we could build together.');
      if (a.idea) p.rows.push(['Your idea', a.idea]);
    } else {
      return need('Choose how you would like to be part of Medulla.', '[name=path]');
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
    const who = [p.a.name, p.a.organisation].filter(Boolean).join(', ') || 'you';
    const nodes = [head, el('h2', 'p-for', `For ${who}`),
      el('p', 'p-intro', 'A collaborative space and learning community in Berlin, in a quiet courtyard between Mitte and Kreuzberg.')];

    if (p.title) nodes.push(el('h3', 'p-title', p.title));
    if (p.missing) nodes.push(el('p', 'p-missing', p.missing));
    if (p.rows.length) {
      const dl = el('dl', 'p-rows');
      p.rows.forEach(([k, v]) => dl.append(el('dt', null, k), el('dd', null, v)));
      nodes.push(dl);
    }
    const amount = p.price ? p.price.amount : '';
    if (p.price) {
      const box = el('div', 'p-price');
      box.append(el('p', 'p-price__label', p.price.label), el('p', 'p-price__amount', p.price.amount));
      if (p.price.detail) box.append(el('p', 'p-price__detail', p.price.detail));
      if (lastAmount !== null && amount !== lastAmount) box.classList.add('is-new');
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
    nodes.push(el('p', 'p-foot', `Prepared for ${who}. Suggested contributions from Medulla’s contribution model, ${pricing.updated}: a contribution to a space with an educational purpose, not rent. Share it within your organisation, but please don’t publish it.`),
      el('p', 'p-address', ADDRESS));
    out.replaceChildren(...nodes);

    // Phone price bar and the screen-reader line follow the price, not every keystroke.
    $('#peek-amount').textContent = amount;
    $('#peek').hidden = !amount;
    if (amount !== lastAmount) $('#price-live').textContent = amount ? `${p.price.label}: ${amount}` : '';
    lastAmount = amount;
  }

  // On phones the price bar shows only while the proposal itself is off screen.
  function watchPeek() {
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(([entry]) => $('#peek').toggleAttribute('data-off', entry.isIntersecting), { threshold: 0.1 }).observe(out);
  }

  // ── 5. send: print first (inside the click), then confirm our copy ──
  const msg = $('#send-msg');
  function say(text, tone) { msg.textContent = text; if (tone) msg.dataset.tone = tone; else delete msg.dataset.tone; }

  function clearError(target) {
    const holder = target.closest('[aria-invalid]');
    if (holder) holder.removeAttribute('aria-invalid');
  }

  function flag(selector) {
    const first = form.querySelector(`${selector}:not(:disabled)`) || form.querySelector(selector);
    if (!first) return;
    const holder = first.type === 'radio' ? first.closest('fieldset') : first;
    holder.setAttribute('aria-invalid', 'true');
    holder.setAttribute('aria-describedby', 'send-msg');
    first.scrollIntoView({ block: 'center' });
    first.focus({ preventScroll: true });
  }

  function problem(a) {
    if (!a.name) return ['#f-name', 'Please add your name.'];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) return ['#f-email', 'Please add a valid email address.'];
    const p = build(a);
    return p.missing ? [p.focus, p.missing] : null;
  }

  function summary(p) {
    const lines = [p.title, ...p.rows.map(([k, v]) => `${k}: ${v}`)];
    if (p.price) lines.push(`${p.price.label}: ${p.price.amount}${p.price.detail ? ` (${p.price.detail})` : ''}`);
    return lines.concat(p.notes).join('\n');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const a = answers();
    const issue = problem(a);
    if (issue) {
      say(`Error: ${issue[1]}`, 'error');
      if (issue[0]) flag(issue[0]);
      return;
    }
    const p = build(a);
    const button = $('#send');
    button.disabled = true; form.setAttribute('aria-busy', 'true'); say('');
    const body = new URLSearchParams({
      'form-name': 'proposal', name: a.name, email: a.email, organisation: a.organisation,
      path: a.path, total: p.price ? p.price.amount : '', summary: summary(p),
    });
    const sending = fetch('/', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
    // The file name of the saved PDF comes from the page title.
    const title = document.title;
    document.title = `Medulla proposal – ${a.organisation || a.name}`;
    window.addEventListener('afterprint', () => { document.title = title; }, { once: true });
    window.print(); // still inside the click, so Safari allows it
    try {
      const response = await sending;
      if (!response.ok) throw new Error(`Netlify Forms responded ${response.status}`);
      say('Sent. We have a copy of your proposal and will be in touch.', 'ok');
    } catch (error) {
      console.error('Proposal copy failed:', error);
      say('We couldn’t send our copy. Your PDF still works: please email it to hello@medulla.city.', 'error');
    } finally {
      button.disabled = false; form.removeAttribute('aria-busy');
    }
  });

  $('#print-again').addEventListener('click', () => window.print());
})();
