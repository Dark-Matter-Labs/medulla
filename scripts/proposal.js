// ── Proposal questionnaire — DOM wiring ─────────────────────────────────────
// Unlocks the prices with the access code, then walks the visitor through one
// fork at a time. Each answer becomes a node on the trail above the current
// question (with faint stubs for the branches not taken), and any node can be
// tapped to go back to that fork. A live proposal sits beside the journey
// (a price bar on phones). On send, the print dialog opens to save a PDF while
// a copy is posted to Netlify Forms ("proposal"). Everything a visitor typed is
// written with textContent, never as HTML.
(function () {
  const core = window.MedullaProposal;
  const payload = window.MEDULLA_PROPOSAL_DATA;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const gate = $('#gate');
  const form = $('#q');
  const out = $('#proposal');
  const ADDRESS = 'Medulla · Dresdener Str. 113B, 10179 Berlin · medulla.city · hello@medulla.city';
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const ADVANCE_MS = 380; // a beat to see the choice land before the next fork
  let pricing = null;
  let lastAmount = null;
  let current = 'about';
  let grown = null; // id of the step whose node was just added, for the grow animation

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
      addNav();
      goTo('about', { focus: false });
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

  // ── 2. answers ──
  // shortcut: homepage photos stand in for each space; swap in real room photos when there are some.
  const ROOM_PHOTOS = { full: 'card-stair', part: 'card-garden', meeting: 'card-conference' };

  function renderRooms() {
    $('#rooms').replaceChildren(...pricing.events.rooms.map((r) => {
      const label = el('label', ROOM_PHOTOS[r.id] ? 'choice choice--photo' : 'choice');
      if (ROOM_PHOTOS[r.id]) {
        const img = el('img'); img.src = `/assets/images/figma/${ROOM_PHOTOS[r.id]}-800.webp`; img.alt = ''; img.loading = 'lazy'; img.width = 800; img.height = 533;
        label.append(img);
      }
      const input = el('input'); input.type = 'radio'; input.name = 'room'; input.value = r.id;
      const span = el('span', null, r.name);
      span.append(el('small', null, `${r.area} m² · from ${r.minHours} hours`));
      label.append(input, span);
      return label;
    }));
    // With a single space there is nothing to choose: the space step is skipped and its minimum shows on 'Some hours'.
    if (pricing.events.rooms.length === 1) {
      const only = pricing.events.rooms[0];
      $('#hours-min').textContent = `The whole event space, ${only.area}\u00a0m², from ${only.minHours}\u00a0hours`;
      $('#f-hours').value = String(only.minHours);
    }
  }

  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const num = (s) => Number(String(s).replace(',', '.'));

  function answers() {
    const d = new FormData(form);
    const v = (k) => (d.get(k) || '').toString().trim();
    const hours = num(v('hours'));
    const path = v('path');
    return {
      name: v('name'), email: v('email'), organisation: v('organisation'), path,
      payer: v('payer'), people: clamp(Math.round(num(v('people'))) || 1, 1, 30), days: v('days'),
      guest: d.has('guest'), hostEvents: d.has('hostEvents'), start: v('start'),
      member: v('member'), educational: v('educational'), format: v('format'), slot: v('slot'),
      room: v('room') || (pricing && pricing.events.rooms.length === 1 ? pricing.events.rooms[0].id : ''), length: v('length'), hours: hours > 0 ? clamp(hours, 0.5, 12) : 0,
      guests: v('guests'), date: v('date'), idea: path === 'partner' ? v('idea') : v('hostIdea'),
      contact: v('contact'), contactName: v('contactName'), about: v('about'),
    };
  }

  // ── 3. the forks: which steps apply, what each needs, how it reads on the trail ──
  const monthName = (ym) => (/^\d{4}-\d{2}$/.test(ym) ? new Date(`${ym}-01T12:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : ym);
  const dayName = (ymd) => (/^\d{4}-\d{2}-\d{2}$/.test(ymd) ? new Date(`${ymd}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ymd);
  const shortDay = (ymd) => (/^\d{4}-\d{2}-\d{2}$/.test(ymd) ? new Date(`${ymd}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ymd);
  const join = (a) => a.path === 'join';
  const host = (a) => a.path === 'host';
  const learning = (a) => host(a) && a.educational === 'yes';
  const hire = (a) => learning(a) && a.slot === 'hire';
  const need = (key, message) => (a) => (a[key] ? null : message);

  const STEPS = [
    { id: 'about', when: () => true, name: 'You', label: (a) => a.organisation || a.name,
      check: (a) => (!a.name ? 'Please add your name.' : !EMAIL.test(a.email) ? 'Please add a valid email address.' : null) },
    { id: 'path', when: () => true, name: 'Path', check: need('path', 'Choose a path to continue.'),
      label: (a) => ({ join: 'Join the community', host: 'Host a gathering', partner: 'Partner with us' })[a.path] },
    // Who at Medulla takes this on: a name gives the team a lead straight away; 'not yet' asks the team to assign one.
    { id: 'contact', when: () => true, name: 'Contact',
      check: (a) => (!a.contact ? 'Choose one to continue.' : a.contact === 'yes' && !a.contactName ? 'Add who you’re in touch with.' : null),
      label: (a) => (a.contact === 'yes' ? a.contactName || 'Someone at Medulla' : 'Please connect me') },
    { id: 'payer', when: join, name: 'Contributing', check: need('payer', 'Choose who is contributing.'),
      label: (a) => ({ individual: 'From my own pocket', nonprofit: 'A non-profit', forprofit: 'A for-profit' })[a.payer] },
    { id: 'people', when: (a) => join(a) && Boolean(a.payer) && a.payer !== 'individual', name: 'People',
      label: (a) => `${a.people} ${a.people === 1 ? 'person' : 'people'}` },
    { id: 'days', when: join, name: 'Days', check: need('days', 'Choose how often you’ll be here.'),
      label: (a) => core.DAYS[a.days] },
    { id: 'extras', when: join, name: 'Extras',
      label: (a) => [a.guest && 'A guest', a.hostEvents && 'Events', a.start && monthName(a.start)].filter(Boolean).join(' · ') || 'Nothing else' },
    { id: 'member', when: host, name: 'Member', check: need('member', 'Tell us whether you are a member.'),
      label: (a) => core.MEMBER[a.member] },
    { id: 'educational', when: host, name: 'Learning', check: need('educational', 'Choose one to continue.'),
      label: (a) => (a.educational === 'yes' ? 'A learning event' : 'Not quite a learning event') },
    { id: 'hostIdea', when: (a) => host(a) && a.educational === 'no', name: 'Idea', label: (a) => (a.idea ? 'Your idea' : 'We’ll talk') },
    { id: 'format', when: learning, name: 'Shape', label: (a) => a.format || 'Open shape' },
    { id: 'slot', when: learning, name: 'How', check: need('slot', 'Choose one to continue.'),
      label: (a) => (a.slot === 'hire' ? 'My own event' : 'Medulla’s public programme') },
    { id: 'room', when: (a) => hire(a) && pricing.events.rooms.length > 1, name: 'Space', check: need('room', 'Choose a space.'),
      label: (a) => (pricing.events.rooms.find((r) => r.id === a.room) || {}).name },
    { id: 'length', when: hire, name: 'Time',
      check: (a) => (!a.length ? 'Choose how long you need it.' : a.length === 'hours' && !a.hours ? 'Add how many hours.' : null),
      label: (a) => (a.length === 'day' ? 'A full day' : `${a.hours} hours`) },
    { id: 'details', when: learning, name: 'Details',
      label: (a) => [a.about && 'About it', a.guests && `${a.guests} people`, a.date && shortDay(a.date)].filter(Boolean).join(' · ') || 'Details later' },
    { id: 'idea', when: (a) => a.path === 'partner', name: 'Idea', label: (a) => (a.idea ? 'Your idea' : 'We’ll talk') },
    { id: 'send', when: () => true, name: 'Proposal', label: () => '' },
  ];
  const byId = (id) => STEPS.find((s) => s.id === id);
  const route = (a) => STEPS.filter((s) => s.when(a));
  const stepEl = (id) => form.querySelector(`[data-step="${id}"]`);

  function addNav() {
    STEPS.forEach((s, i) => {
      if (s.id === 'send') return;
      const nav = el('div', 'step__nav');
      const err = el('p', 'step__err'); err.id = `err-${s.id}`; err.setAttribute('role', 'alert');
      if (i > 0) { const back = el('button', 'link step__back', '← Back'); back.type = 'button'; back.dataset.back = ''; nav.append(back); }
      const next = el('button', 'step__next', 'Next'); next.type = 'button'; next.dataset.next = '';
      nav.append(next);
      stepEl(s.id).append(err, nav);
    });
    const back = el('button', 'link step__back', '← Back'); back.type = 'button'; back.dataset.back = '';
    stepEl('send').prepend(back);
  }

  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // `flyFrom`: the chosen answer's card, which morphs into its new node on the trail.
  // View Transitions do the motion where supported; elsewhere the card's own keyframe runs.
  function goTo(id, { focus = true, dir = 'forward', flyFrom = null } = {}) {
    current = id; // set now, not in the transition callback, so a quick tap during the animation lands on the right step
    const swap = () => {
      STEPS.forEach((s) => { stepEl(s.id).hidden = s.id !== id; });
      refresh();
      if (flyFrom) {
        flyFrom.style.viewTransitionName = '';
        const node = $('#trail .is-new .trail__node');
        if (node) node.style.viewTransitionName = 'answer';
      }
      if (id === 'send') bloom();
    };
    const land = () => {
      if (!focus) return;
      const target = stepEl(id);
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'nearest', behavior: calm() ? 'auto' : 'smooth' });
    };
    if (!document.startViewTransition || calm() || !focus) { swap(); land(); return; }
    document.documentElement.dataset.dir = dir;
    if (flyFrom) flyFrom.style.viewTransitionName = 'answer';
    const transition = document.startViewTransition(swap);
    transition.updateCallbackDone.then(land, land);
    transition.finished.finally(() => {
      $$('[style*="view-transition-name"]').forEach((n) => { n.style.viewTransitionName = ''; });
    });
  }

  // Arriving at the end: a few leaves drift up from the card, once.
  function bloom() {
    if (calm()) return;
    const card = stepEl('send');
    $$('.leaf', card).forEach((n) => n.remove());
    for (let i = 0; i < 7; i += 1) {
      const leaf = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      leaf.setAttribute('class', 'leaf'); leaf.setAttribute('aria-hidden', 'true');
      leaf.innerHTML = '<use href="#i-leaf"/>';
      leaf.style.setProperty('--x', `${8 + i * 13}%`);
      leaf.style.setProperty('--drift', `${(i % 2 ? 1 : -1) * (10 + i * 4)}px`);
      leaf.style.setProperty('--spin', `${(i % 2 ? 1 : -1) * (40 + i * 15)}deg`);
      leaf.style.animationDelay = `${120 + i * 70}ms`;
      card.append(leaf);
    }
  }

  function showError(id, message) {
    const err = $(`#err-${id}`);
    if (err) err.textContent = message || '';
    stepEl(id).toggleAttribute('aria-invalid', Boolean(message));
  }

  function next() {
    const a = answers();
    const r = route(a);
    const step = byId(current);
    const problem = step.check ? step.check(a) : null;
    showError(current, problem);
    if (problem) return;
    const i = r.findIndex((s) => s.id === current);
    grown = current;
    const checked = stepEl(current).querySelector('.choice input:checked');
    const chosen = checked ? checked.closest('.choice') : null;
    goTo(r[Math.min(i + 1, r.length - 1)].id, { flyFrom: chosen });
  }

  function back() {
    const r = route(answers());
    const i = r.findIndex((s) => s.id === current);
    if (i > 0) goTo(r[i - 1].id, { dir: 'back' });
  }

  form.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) next();
    else if (e.target.closest('[data-back]')) back();
    else if (e.target.closest('[data-nudge]')) {
      const field = $('#f-people');
      field.value = clamp((Number(field.value) || 1) + Number(e.target.closest('[data-nudge]').dataset.nudge), 1, 30);
      refresh();
    } else if (e.target.matches('.choice input[type=radio]') && e.detail > 0) {
      // A tap or click on an answer moves on by itself; keyboard users press Next (arrow keys also "click").
      // An answer that opens a follow-up field (e.g. "Some hours") stays and focuses it instead.
      const then = e.target.dataset.then;
      if (then) { refresh(); $(then).focus(); $(then).select(); return; }
      const from = current;
      setTimeout(() => { if (current === from) next(); }, ADVANCE_MS);
    }
  });

  // Enter in a single-line field moves to the next fork instead of sending anything.
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('input:not([type=radio]):not([type=checkbox])')) { e.preventDefault(); next(); }
  });
  form.addEventListener('input', () => { showError(current, ''); refresh(); });
  form.addEventListener('change', () => { showError(current, ''); refresh(); });

  // ── 4. the trail: answered forks above the current one ──
  function renderTrail(a) {
    const r = route(a);
    const upTo = r.findIndex((s) => s.id === current);
    const items = r.slice(0, Math.max(upTo, 0)).map((s) => {
      const li = el('li', `trail__item${s.id === grown ? ' is-new' : ''}`);
      const options = $$('input[type=radio]', stepEl(s.id));
      const chosen = options.find((o) => o.checked);
      const others = options.filter((o) => o !== chosen).slice(0, 3);
      if (others.length) {
        const stubs = el('span', 'trail__stubs'); stubs.setAttribute('aria-hidden', 'true');
        others.forEach(() => stubs.append(el('i')));
        li.append(stubs);
      }
      const button = el('button', 'trail__node'); button.type = 'button'; button.dataset.go = s.id;
      button.setAttribute('aria-label', `${s.name}: ${s.label(a) || '—'}. Change`);
      if (others.length) button.title = `Other branches: ${others.map((o) => o.closest('label').querySelector('span').firstChild.textContent.trim()).join(', ')}`;
      button.append(el('span', 'trail__name', s.name), el('span', 'trail__label', s.label(a) || '—'));
      li.append(button);
      return li;
    });
    $('#trail').replaceChildren(...items);
    grown = null;
  }
  $('#trail').addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) goTo(b.dataset.go, { dir: 'back' }); });

  function refresh() {
    const a = answers();
    $('[data-hours]').hidden = a.length !== 'hours';
    $('[data-contact]').hidden = a.contact !== 'yes';
    stepEl(current).querySelector('[data-next]')?.replaceChildren(document.createTextNode(nextLabel(a)));
    renderTrail(a);
    render(build(a));
  }

  function nextLabel(a) {
    const r = route(a);
    const i = r.findIndex((s) => s.id === current);
    return r[i + 1] && r[i + 1].id === 'send' ? 'See my proposal' : 'Next';
  }

  // ── 5. the proposal, as plain data ──
  function build(a) {
    const p = { a, rows: [], price: null, list: [], shared: [], notes: [], title: '', missing: null };
    const missing = (message) => { p.missing = message; return p; };
    if (a.path === 'join') {
      p.title = 'Joining the community';
      if (!a.payer || !a.days) return missing('Your proposal appears here as you answer.');
      const q = core.membershipQuote({ payer: a.payer, people: a.people, days: a.days }, pricing);
      p.rows.push(['Who contributes', core.PAYERS[q.payer]], ['Days', core.DAYS[q.days]]);
      if (q.payer !== 'individual') p.rows.push(['People', String(q.people)]);
      if (a.start) p.rows.push(['Start', monthName(a.start)]);
      p.price = {
        label: 'Suggested contribution', amount: `${core.euro(q.monthly)} a month`,
        detail: q.people > 1 ? `${core.euro(q.perPerson)} a person a month, for ${q.people} people` : '',
      };
      p.list = q.includes;
      p.shared = q.shared;
      p.notes.push(`Membership runs for at least ${q.minMonths} months.`);
      if (a.guest) p.notes.push('We’ll agree how your intern or guest can join.');
      if (a.hostEvents) {
        p.notes.push(q.days === 'threePlus'
          ? 'You’d like to host events: one a month is included, and further events are half price. We’ll plan them with you.'
          : 'You’d like to host events: one a quarter is included, when the space is free (full-time members have priority), and further events are half price. We’ll plan them with you.');
      }
      p.notes.push('We confirm invoicing and the start date when we talk.');
    } else if (a.path === 'host') {
      p.title = 'Hosting a gathering';
      if (!a.member || !a.educational) return missing('Your proposal appears here as you answer.');
      if (a.educational === 'no') {
        if (a.idea) p.rows.push(['Your idea', a.idea]);
        p.notes.push('Medulla hosts learning events: talks, workshops and sessions open to people beyond your own team. Tell us more and we’ll see if there’s a fit.');
        return p;
      }
      if (a.format) p.rows.push(['Kind of event', a.format]);
      if (a.about) p.rows.push(['About the event', a.about]);
      p.rows.push(['Member', core.MEMBER[a.member]]);
      if (a.guests) p.rows.push(['People', a.guests]);
      if (a.date) p.rows.push(['Preferred date', dayName(a.date)]);
      if (!a.slot) return missing('Your proposal appears here as you answer.');
      p.plan = `Ground floor: the shaded area is the event space, ${pricing.events.rooms[0].area}\u00a0m².`;
      if (a.slot === 'programme') {
        p.rows.push(['Format', 'Part of Medulla’s public programme, 18:00 to 21:30']);
        p.notes.push('Your event becomes part of Medulla’s public programme: we plan it with you, list it on our Luma page and co-host the evening. We’ll agree the details when we talk.');
        return p;
      }
      const duration = a.length === 'day' ? { kind: 'day' } : a.length === 'hours' ? { kind: 'hours', hours: a.hours } : null;
      const q = a.room && duration ? core.eventQuote({ room: a.room, member: a.member, duration }, pricing) : null;
      if (!q) return missing('Choose how long you need the space to see the contribution.');
      p.rows.push(['Space', `${q.room.name}, ${q.room.area} m²`],
        ['Time', q.dayRate ? 'Full day' : `${q.billedHours} hours${q.billedHours > a.hours ? ` (${q.room.minHours}-hour minimum)` : ''}`]);
      // Members have one event included (a month on 3+ days, a quarter on up to 2 days): lead with that, then the half price for any further event.
      p.price = q.includedEvent
        ? { label: 'Contribution for the space', amount: 'Included in your membership',
            detail: `One event a ${q.includedPer} is part of your membership${q.includedPer === 'quarter' ? ', when the space is free (full-time members have priority)' : ''}. Once you’ve used it, members pay half: ${core.euro(q.total)} instead of ${core.euro(q.base)}.` }
        : { label: 'Contribution for the space', amount: core.euro(q.total),
            detail: q.memberDiscount ? `Members pay half of ${core.euro(q.base)}` : (q.dayRate && a.length === 'hours' ? 'Capped at the full-day rate' : '') };
      p.list = ['Learning events only, open beyond your own team', 'No sale of alcohol', 'Leave the space as you found it', 'VAT is confirmed on booking'];
    } else if (a.path === 'partner') {
      p.title = 'Partnering with us';
      p.notes.push('Partnerships don’t have a fixed price. We’ll find a time to talk it through.');
      if (a.idea) p.rows.push(['Your idea', a.idea]);
    } else {
      return missing('Your proposal appears here as you answer.');
    }
    return p;
  }

  // ── 6. render the sheet ──
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  // The same next step for everyone; who at Medulla follows up is decided from the copy we receive.
  function nextStep() {
    return 'Someone from the Medulla team will get in touch to take this further. You can also write to hello@medulla.city with this proposal. Nothing is booked until we confirm it together.';
  }

  function render(p) {
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const head = el('header', 'p-head');
    const logo = el('img'); logo.src = '/assets/logos/medulla-wordmark-wide.svg'; logo.alt = 'Medulla'; logo.width = 150; logo.height = 37;
    head.append(logo, el('p', 'p-meta', `Proposal · ${today}`));
    const who = [p.a.name, p.a.organisation].filter(Boolean).join(', ') || 'you';
    if (p.a.name || p.a.path) head.append(resetButton());
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
    if (p.shared.length) {
      nodes.push(el('p', 'p-sub', 'Shared with every member'));
      const ul = el('ul', 'p-list p-list--shared');
      p.shared.forEach((item) => ul.append(el('li', null, item)));
      nodes.push(ul);
    }
    p.notes.forEach((n) => nodes.push(el('p', 'p-note', n)));
    if (p.plan) {
      const fig = el('figure', 'p-plan');
      const img = el('img'); img.src = '/assets/images/figma/floor-plan-ground-800.webp';
      img.srcset = '/assets/images/figma/floor-plan-ground-800.webp 800w, /assets/images/figma/floor-plan-ground-1600.webp 1600w';
      img.sizes = '(max-width: 900px) 90vw, 480px'; img.width = 800; img.height = 559; img.alt = 'Drawing of Medulla’s ground floor with the event space shaded';
      fig.append(img, el('figcaption', null, p.plan));
      nodes.push(fig);
    }
    if (!p.missing) {
      nodes.push(el('h3', 'p-title', 'Next step'),
        el('p', null, nextStep()));
    }
    const prepared = `Prepared for ${who.replace(/\.+$/, '')}.`; // "Example e.V." must not end in ".."
    const basis = p.price
      ? ` Suggested contributions from Medulla’s contribution model, ${pricing.updated}: a contribution to a space with an educational purpose, not rent.`
      : '';
    nodes.push(el('p', 'p-foot', `${prepared}${basis} Share it within your organisation, but please don’t publish it.`),
      el('p', 'p-address', ADDRESS));
    out.replaceChildren(...nodes);

    // Phone price bar and the screen-reader line follow the price, not every keystroke.
    $('#peek-amount').textContent = amount;
    $('#peek').hidden = !amount;
    if (amount !== lastAmount) $('#price-live').textContent = amount ? `${p.price.label}: ${amount}` : '';
    lastAmount = amount;
  }

  // "Start again" on the sheet: first press asks, second press clears. It disarms after a few seconds.
  let resetArmed = false;
  let resetTimer = null;
  function resetButton() {
    const button = el('button', `p-reset${resetArmed ? ' is-armed' : ''}`); button.type = 'button';
    button.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-restart"/></svg>'; // fixed markup, no user text
    button.append(el('span', null, resetArmed ? 'Clear all answers?' : 'Start again'));
    return button;
  }
  out.addEventListener('click', (e) => {
    if (!e.target.closest('.p-reset')) return;
    clearTimeout(resetTimer);
    if (!resetArmed) {
      resetArmed = true; refresh(); $('.p-reset').focus();
      resetTimer = setTimeout(() => { resetArmed = false; refresh(); }, 4000);
      return;
    }
    resetArmed = false;
    form.reset();
    lastAmount = null;
    say('');
    goTo('about', { dir: 'back' });
    $('#f-name').focus();
  });

  // On phones the price bar shows only while the proposal itself is off screen.
  function watchPeek() {
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(([entry]) => $('#peek').toggleAttribute('data-off', entry.isIntersecting), { threshold: 0.1 }).observe(out);
  }

  // ── 7. send: print first (inside the click), then confirm our copy ──
  const msg = $('#send-msg');
  function say(text, tone) { msg.textContent = text; if (tone) msg.dataset.tone = tone; else delete msg.dataset.tone; }

  // The copy we receive by email: one field per detail, so it reads top to bottom.
  function copyFields(a, p) {
    const who = a.organisation || a.name;
    const amount = p.price ? p.price.amount.replace(/ /g, ' ') : '';
    const rows = p.rows.map(([k, v]) => `${k}: ${v}`.replace(/ /g, ' '));
    if (a.path === 'join') {
      if (a.guest) rows.push('Intern or guest: yes');
      if (a.hostEvents) rows.push('Would like to host events: yes');
    }
    const notes = [...p.notes];
    if (p.shared.length) notes.unshift(`Shared with every member: ${p.shared.join('; ')}.`);
    if (p.list.length) notes.unshift(`Included: ${p.list.join('; ')}.`);
    return {
      subject: `Proposal from ${who} · ${p.title}${amount ? ` · ${amount}` : ''}${a.contact === 'yes' ? ` · with ${a.contactName}` : ' · needs a contact'}`,
      Name: a.name, Email: a.email, Organisation: a.organisation || '—', Path: p.title,
      Contribution: p.price ? `${amount}${p.price.detail ? ` (${p.price.detail})` : ''}` : 'No fixed price: we talk it through',
      Answers: rows.join('\n') || '—', Notes: notes.join('\n\n') || '—', 'Prices dated': pricing.updated,
      'Medulla contact': a.contact === 'yes' ? a.contactName : 'Not in touch yet: please assign someone',
    };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const a = answers();
    // Every fork on the route must be answered; take the person back to the first that isn't.
    const gap = route(a).find((s) => s.check && s.check(a));
    if (gap) { goTo(gap.id); showError(gap.id, gap.check(a)); return; }
    const p = build(a);
    const button = $('#send');
    button.disabled = true; form.setAttribute('aria-busy', 'true'); say('');
    const body = new URLSearchParams({ 'form-name': 'proposal', ...copyFields(a, p) });
    try {
      const response = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
      if (!response.ok) throw new Error(`Netlify Forms responded ${response.status}`);
      say('Sent. We have a copy of your proposal and will be in touch.', 'ok');
    } catch (error) {
      console.error('Proposal copy failed:', error);
      say('We couldn’t send our copy. Please email your PDF to hello@medulla.city instead.', 'error');
    } finally {
      button.disabled = false; form.removeAttribute('aria-busy');
    }
  });

  // Step 1 of the last card: the person looks at and saves their PDF before sending anything.
  // Printing is its own button (not after a send), so every browser opens the dialog from the click.
  $('#save-pdf').addEventListener('click', () => {
    const a = answers();
    const title = document.title; // the saved PDF takes its file name from the page title
    document.title = `Medulla proposal – ${a.organisation || a.name || 'Medulla'}`;
    window.addEventListener('afterprint', () => { document.title = title; }, { once: true });
    window.print();
  });
})();
