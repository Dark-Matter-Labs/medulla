# Readability, Spaces page & enquiry form — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the site's body text readable, add a Spaces page that explains Medulla's offerings (without prices), list the organisations in the space, and replace email and Typeform with one on-site enquiry form.

**Architecture:** This is a static site with no build step. HTML pages share `styles/main.css`. Fonts become self-hosted WOFF2 files. The enquiry form is plain HTML posted to Netlify Forms. Its logic sits in a small pure module (`scripts/enquiry-core.js`, unit-tested with `node --test`) and a DOM wiring file (`scripts/enquiry.js`). The home page opens the same form in a native `<dialog>`, and the scroll-deck engine is untouched apart from pausing Lenis while the dialog is open.

**Tech Stack:** HTML, CSS, vanilla JS (classic scripts, no modules). Lenis (already vendored). Netlify Forms. Node 24 built-in test runner. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-23-readability-spaces-enquiry-design.md`

## Global Constraints

- No new runtime or dev dependencies. No `package.json`. Tests run with `node --test tests/`.
- No prices anywhere on the site. Offerings say "Rates on request".
- Fonts are self-hosted from `assets/fonts/`. No request to fonts.googleapis.com or fonts.gstatic.com from any page.
- Display face `--font-display` is `'Instrument Serif'`. Text face `--font-text` is `'Instrument Sans'`.
- Deck engine: 9 cards, `data-card` 0–8, the geometry in `main.js` and the per-card CSS are unchanged.
- Every deck content card (data-card 0, 2, 4, 6) must fit without clipping at 1440×900, 1280×720 and 390×844.
- The contact address is `hello@medulla.city`. The Netlify form name is `enquiry`.
- Enquiry field names, exactly: `form-name`, `bot-field`, `interest`, `membership`, `space`, `when`, `size`, `name`, `email`, `organisation`, `message`.
- Interest values: `membership`, `hire`, `host`, `visit`. Membership values: `flexible`, `dedicated`, `team`, `day-pass`, `virtual`, `not-sure`. Space values: `ground-floor`, `ground-floor-half`, `meeting-room`, `not-sure`.
- Clean URLs: link to `/spaces`, `/datenschutz`, `/thanks`. Netlify serves `x.html` at `/x`, and so does the `medulla` preview (`npx serve`). Existing `/impressum.html` links stay as they are.
- Commit messages follow `<type>: <description>` and end with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. PR bodies end with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- Verification: screenshots of the scrolled deck come out blank in headless capture, because the deck cards are moved with GPU transforms. Use DOM measurement (below) for fit checks. Screenshots are fine at scroll position 0 and on normal pages.

**Fit-check snippet** (used in several tasks; run with `mcp__Claude_Browser__javascript_tool` on the home page):

```js
[...document.querySelectorAll('.card--content:not(.card--events) .card__inner')].map((el) => {
  const card = el.closest('.card').dataset.card;
  const body = el.querySelector('.card__body');
  const label = el.querySelector('.card__label-row');
  return {
    card,
    overflow: Math.round(el.scrollHeight - el.clientHeight),
    gap: Math.round(label.getBoundingClientRect().top - body.getBoundingClientRect().bottom),
    innerH: Math.round(el.clientHeight),
  };
});
```

A pass means `overflow <= 0` and `gap >= 8` for every card. If `innerH` reads 0, the Browser pane is hidden. Bring the tab forward with `mcp__Claude_Browser__tabs_select` and run it again.

**Branches:** Task 1 is **PR A** on the current branch `claude/vigilant-hypatia-e8624a`. Tasks 2–7 are **PR B** on a new branch `claude/spaces-enquiry`, created from the end of Task 1.

---

### Task 1: Readable typography with self-hosted fonts (PR A)

**Files:**
- Create: `assets/fonts/instrument-serif-latin-400-normal.woff2`, `assets/fonts/instrument-serif-latin-400-italic.woff2`, `assets/fonts/instrument-sans-latin-400-normal.woff2`, `assets/fonts/instrument-sans-latin-500-normal.woff2`, `assets/fonts/OFL-instrument-serif.txt`, `assets/fonts/OFL-instrument-sans.txt`
- Modify: `index.html` (the Google Fonts `<link>` block, around lines 56–58), `impressum.html:16-18`, `styles/main.css` (tokens at lines 26–34, base at 45–47, skip link at 67, sidebar at 82–85, labels at 156–160, events at 223/230, legal at 266–268, mobile tokens at 288–289, reduced-motion tokens at 331)

**Interfaces:**
- Produces: the CSS custom properties `--font-display`, `--font-text` and `--err` (used by Tasks 3–6). `--font` is removed.

- [ ] **Step 1: Download the fonts and licences**

```bash
cd /Users/gurden/Documents/code/medulla/.claude/worktrees/vigilant-hypatia-e8624a
mkdir -p assets/fonts
B=https://cdn.jsdelivr.net/npm/@fontsource
curl -fsSL "$B/instrument-serif@5/files/instrument-serif-latin-400-normal.woff2" -o assets/fonts/instrument-serif-latin-400-normal.woff2
curl -fsSL "$B/instrument-serif@5/files/instrument-serif-latin-400-italic.woff2" -o assets/fonts/instrument-serif-latin-400-italic.woff2
curl -fsSL "$B/instrument-sans@5/files/instrument-sans-latin-400-normal.woff2" -o assets/fonts/instrument-sans-latin-400-normal.woff2
curl -fsSL "$B/instrument-sans@5/files/instrument-sans-latin-500-normal.woff2" -o assets/fonts/instrument-sans-latin-500-normal.woff2
curl -fsSL "$B/instrument-serif@5/LICENSE" -o assets/fonts/OFL-instrument-serif.txt
curl -fsSL "$B/instrument-sans@5/LICENSE" -o assets/fonts/OFL-instrument-sans.txt
file assets/fonts/*.woff2
```

Expected: four lines, each ending `Web Open Font Format (Version 2)`. Each licence file starts with the copyright line and contains "SIL Open Font License".

- [ ] **Step 2: Replace the Google Fonts links in `index.html` and `impressum.html`**

In both files, delete these three lines:

```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
```

and put these in their place:

```html
  <link rel="preload" href="assets/fonts/instrument-sans-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="assets/fonts/instrument-serif-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin />
```

- [ ] **Step 3: Add `@font-face` rules and the new tokens in `styles/main.css`**

Insert directly after the reset line `*, *::before, *::after { ... }` (line 2):

```css

/* ── Fonts (self-hosted, SIL OFL — see assets/fonts/OFL-*.txt) ──────────── */
@font-face {
  font-family: 'Instrument Serif'; font-style: normal; font-weight: 400; font-display: swap;
  src: url('../assets/fonts/instrument-serif-latin-400-normal.woff2') format('woff2');
}
@font-face {
  font-family: 'Instrument Serif'; font-style: italic; font-weight: 400; font-display: swap;
  src: url('../assets/fonts/instrument-serif-latin-400-italic.woff2') format('woff2');
}
@font-face {
  font-family: 'Instrument Sans'; font-style: normal; font-weight: 400; font-display: swap;
  src: url('../assets/fonts/instrument-sans-latin-400-normal.woff2') format('woff2');
}
@font-face {
  font-family: 'Instrument Sans'; font-style: normal; font-weight: 500; font-display: swap;
  src: url('../assets/fonts/instrument-sans-latin-500-normal.woff2') format('woff2');
}
```

In `:root`, replace:

```css
  --font: 'Instrument Serif', Georgia, 'Times New Roman', serif;
```

with:

```css
  --err:      #B3261E;         /* form errors — 5.5:1 on --bg */

  /* Display serif for labels, titles and the tagline; text sans for reading */
  --font-display: 'Instrument Serif', Georgia, 'Times New Roman', serif;
  --font-text:    'Instrument Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
```

Replace the two body lines of the type ramp:

```css
  --b1: clamp(18px, 2.22vh, 24px);  --b1-lh: 1.3;   /* body */
  --b2: clamp(15px, 1.85vh, 20px);  --b2-lh: 1.3;   /* small body / sidebar */
```

with:

```css
  --b1: clamp(16px, 1.95vh, 21px);  --b1-lh: 1.5;   /* body (Instrument Sans) */
  --b2: clamp(14px, 1.6vh, 17px);   --b2-lh: 1.5;   /* small body / sidebar */
```

- [ ] **Step 4: Point each element at the right face**

In `styles/main.css`, make these exact replacements:

1. In `body { ... }`: `font-family: var(--font);` → `font-family: var(--font-text);`
2. In `.skip-link { ... }`: `font-family: var(--font); font-size: 16px;` → `font-family: var(--font-text); font-size: 16px;`
3. Replace the whole `.sidebar__tagline` rule with:

```css
.sidebar__tagline {
  font-family: var(--font-display);
  font-size: clamp(17px, 2.05vh, 22px); line-height: 1.2;
  max-width: 226px;
}
```

4. In `.card__label { ... }` add the first line `font-family: var(--font-display);`
5. Directly after the rule `.card__body--intro { max-width: min(553px, 100%); }` add:

```css
/* the brand name keeps its serif italic inside the sans intro text */
.card__body--intro em { font-family: var(--font-display); font-size: 1.15em; line-height: 1; }
```

6. `.event__more { font-size: var(--h1); ...` → `.event__more { font-family: var(--font-display); font-size: var(--h1); ...` (the rest of the line is unchanged)
7. `.event__title { font-size: clamp(26px, 3.5vh, 44px); ...` → `.event__title { font-family: var(--font-display); font-size: clamp(26px, 3.5vh, 44px); ...`
8. On each of `.legal h1`, `.legal h2` and `.legal h3`, add `font-family: var(--font-display);` at the start of the declaration block.
9. In the `@media (max-width: 820px)` `:root` block, replace the `--b1` and `--b2` lines with:

```css
    --b1: clamp(15px, 4vw, 17px);
    --b2: clamp(13px, 3.4vw, 15px);
```

10. In the `@media (prefers-reduced-motion: reduce)` block, replace `:root { --h1: 40px; --h2: 40px; --b1: 20px; --b2: 17px; }` with `:root { --h1: 40px; --h2: 40px; --b1: 19px; --b2: 16px; }`

Then confirm nothing still uses the old token:

```bash
grep -n "var(--font)" styles/main.css; grep -rn "fonts.googleapis\|fonts.gstatic" --include=*.html . | grep -v .superpowers
```

Expected: no output.

- [ ] **Step 5: Start the preview and run the fit check at three sizes**

Start the `medulla` preview with `mcp__Claude_Browser__preview_start {name: "medulla"}`. Then, for each size, resize with `mcp__Claude_Browser__resize_window`, reload, and run the **fit-check snippet**:
- `{width: 1440, height: 900}`
- `{width: 1280, height: 720}`
- `{preset: "mobile"}` (375×812), then `{width: 390, height: 844}`

Expected: every card has `overflow <= 0` and `gap >= 8`.

If a card fails at 1280×720, change `--b1` in `:root` to `clamp(16px, 1.85vh, 21px)` and check again. If it still fails, stop and report to the owner which card fails and by how many px. Trimming copy needs their approval.

Also check that no request goes to Google: run `mcp__Claude_Browser__read_network_requests {urlPattern: "fonts.g"}`. Expected: none. Run `mcp__Claude_Browser__read_network_requests {urlPattern: ".woff2"}`. Expected: 200 responses from `/assets/fonts/`.

Finish with `mcp__Claude_Browser__resize_window {preset: "desktop"}`.

- [ ] **Step 6: Screenshot proof**

At scroll position 0 on the home page, take `mcp__Claude_Browser__computer {action: "screenshot"}`. The intro card body should be in Instrument Sans with *Medulla* in serif italic, and the sidebar tagline in serif. Navigate to `/impressum.html` and screenshot it: headings in serif, body in sans.

- [ ] **Step 7: Commit, push and open PR A**

```bash
git add assets/fonts index.html impressum.html styles/main.css docs/superpowers
git commit -F - <<'EOF'
style: readable body type — Instrument Sans text, self-hosted fonts

Body copy, event details, sidebar links and UI move to Instrument Sans with
1.5 line-height; Instrument Serif stays for labels, titles and the tagline.
Both faces are now self-hosted (OFL) instead of loaded from Google Fonts.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
git push
gh pr create --base main --head claude/vigilant-hypatia-e8624a \
  --title "style: readable body type (Instrument Sans) + self-hosted fonts" \
  --body "$(cat <<'EOF'
Visitors reported that the body font was hard to read. Every paragraph was set in Instrument Serif, a condensed display face.

## Changes
- Body copy, event dates and details, sidebar links, buttons and legal body text are now **Instrument Sans** (the companion face to Instrument Serif), with line-height going from 1.3 to 1.5. Sizes are tuned so every deck card still fits.
- **Instrument Serif** stays for section labels, event titles, the sidebar tagline, legal headings and *Medulla* in the intro.
- Fonts are **self-hosted** from `assets/fonts/` (SIL OFL, licences included). The site no longer contacts Google Fonts. This avoids the GDPR issue from LG München I, 20.01.2022, and loads slightly faster.
- Adds the design spec and implementation plan for the Spaces page and enquiry form (`docs/superpowers/`).

## Test plan
- [x] Fit check: no clipped deck cards at 1440×900, 1280×720, 390×844
- [x] No requests to fonts.googleapis.com / fonts.gstatic.com; WOFF2 served locally
- [x] Screenshots: home (intro card) and Impressum
- [ ] Owner: skim the deploy preview on a laptop and a phone

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: the command prints the PR URL. Report it to the user wrapped in `<pr-created>…</pr-created>`.

---

### Task 2: Enquiry logic module, test-first (PR B starts)

**Files:**
- Create: `scripts/enquiry-core.js`, `tests/enquiry-core.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: in the browser, `window.MedullaEnquiry`. In Node, `module.exports` of the same object:
  - `CONTACT_EMAIL: string` (`'hello@medulla.city'`)
  - `INTERESTS: Array<{ value, label, optionField: 'membership'|'space'|null, extras: boolean, prompt }>`
  - `OPTIONS: { membership: Array<{value,label}>, space: Array<{value,label}> }`
  - `getInterest(value: string|null) → interest | null`
  - `parsePrefill(token: string|undefined) → { interest: string|null, option: string|null }`
  - `prefillFromSearch(search: string) → { interest, option }`
  - `visibleFieldsFor(interest: string|null) → { membership: boolean, space: boolean, extras: boolean }`
  - `promptFor(interest: string|null) → string`
  - `encodeBody(pairs: Array<[string, string]>) → string`
  - `buildMailto(data: object) → string` (a `mailto:` href)

- [ ] **Step 1: Create the branch for PR B**

```bash
git switch -c claude/spaces-enquiry
```

- [ ] **Step 2: Write the failing tests**

Create `tests/enquiry-core.test.js`:

```js
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
```

- [ ] **Step 3: Run the tests to confirm they fail**

Run: `node --test tests/`
Expected: FAIL with `Cannot find module '../scripts/enquiry-core.js'`.

- [ ] **Step 4: Implement `scripts/enquiry-core.js`**

```js
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
  const DEFAULT_PROMPT = 'Say hello, or ask us anything';

  const INTERESTS = Object.freeze([
    { value: 'membership', label: 'Membership', optionField: 'membership', extras: false,
      prompt: "What you work on, and when you'd like to start" },
    { value: 'hire', label: 'Hiring a space', optionField: 'space', extras: true,
      prompt: "What you're planning: a meeting, workshop, screening…" },
    { value: 'host', label: 'Hosting an event', optionField: null, extras: true,
      prompt: "What the event is, and who it's for" },
    { value: 'visit', label: 'Visiting / saying hello', optionField: null, extras: false,
      prompt: DEFAULT_PROMPT },
  ]);

  const OPTIONS = Object.freeze({
    membership: [
      { value: 'flexible', label: 'Flexible desk' },
      { value: 'dedicated', label: 'Dedicated desk' },
      { value: 'team', label: 'Team desks' },
      { value: 'day-pass', label: 'Day pass' },
      { value: 'virtual', label: 'Virtual' },
      { value: 'not-sure', label: 'Not sure yet' },
    ],
    space: [
      { value: 'ground-floor', label: 'Ground floor · 120 m²' },
      { value: 'ground-floor-half', label: 'Half · 46 m²' },
      { value: 'meeting-room', label: 'Meeting room · 16.5 m²' },
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
      space: Boolean(interest && interest.optionField === 'space'),
      extras: Boolean(interest && interest.extras),
    };
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
    getInterest, parsePrefill, prefillFromSearch, visibleFieldsFor, promptFor, encodeBody, buildMailto,
  });
});
```

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `node --test tests/`
Expected: `# pass 11`, `# fail 0`.

- [ ] **Step 6: Commit**

```bash
git add scripts/enquiry-core.js tests/enquiry-core.test.js
git commit -F - <<'EOF'
feat: add enquiry form logic module with tests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 3: Spaces page, thank-you page and form styles

**Files:**
- Create: `spaces.html`, `thanks.html`, `tests/forms.test.js`
- Modify: `styles/main.css` (the sidebar rules at lines 86–92; new sections appended before `/* ── Mobile deck (≤820px)`)

**Interfaces:**
- Consumes: `--font-display`, `--font-text` and `--err` from Task 1. `scripts/enquiry-core.js` from Task 2 (loaded, but not wired until Task 4).
- Produces:
  - The form markup contract used by Task 4. A wrapper `[data-enquiry]` contains `form[data-enquiry-form]` and `.enquiry__done`.
  - Toggleable fieldsets carry `data-group="membership" | "space" | "extras"`.
  - Error elements have ids `enq-interest-error`, `enq-name-error`, `enq-email-error`.
  - The status line is `.enquiry__status`. Success text goes in `.enquiry__done-title` and `.enquiry__done-text`.
  - The section anchor is `#enquire`.
  - Prefill triggers use the attribute `data-enquire="<interest>[:<option>]"`.
  - The sidebar link markup used by Task 5.

- [ ] **Step 1: Write the failing form test**

Create `tests/forms.test.js`:

```js
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
```

Run: `node --test tests/`
Expected: FAIL on both new tests with `ENOENT … spaces.html`.

- [ ] **Step 2: Create `spaces.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>Spaces — Medulla, Kreuzberg</title>
  <meta name="description" content="Desks, a meeting room and event space in a Kreuzberg courtyard. Memberships for individuals and teams, rooms by the hour or day, and a ground floor for events. Dresdener Str. 113B, Berlin." />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://medulla.city/spaces" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Medulla" />
  <meta property="og:locale" content="en_GB" />
  <meta property="og:url" content="https://medulla.city/spaces" />
  <meta property="og:title" content="Spaces at Medulla — work, meet and gather in Kreuzberg" />
  <meta property="og:description" content="Memberships for individuals and teams, rooms by the hour or day, and a ground floor for events. Dresdener Str. 113B, Berlin." />
  <meta property="og:image" content="https://medulla.city/assets/icons/medulla-share.png" />
  <meta name="twitter:card" content="summary_large_image" />

  <meta name="theme-color" content="#E5E5E5" />
  <link rel="icon" type="image/png" sizes="32x32" href="assets/icons/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="192x192" href="assets/icons/favicon-192.png" />
  <link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png" />

  <link rel="preload" href="assets/fonts/instrument-sans-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="assets/fonts/instrument-serif-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="styles/main.css" />
</head>
<body class="page-spaces">

  <a class="skip-link" href="#main-content">Skip to main content</a>

  <aside class="sidebar" aria-label="Medulla">
    <div class="sidebar__top">
      <a class="sidebar__logo" href="/" aria-label="Medulla home">
        <img src="assets/logos/medulla-wordmark.svg" alt="Medulla" width="153" height="68" />
      </a>
      <p class="sidebar__tagline">Medulla is a physical space for turning shared urgency into collective resilience</p>
    </div>
    <nav class="sidebar__links" aria-label="Links">
      <a href="/spaces" aria-current="page">Spaces</a>
      <a href="https://luma.com/medulla" target="_blank" rel="noopener">Events</a>
      <a href="/spaces#enquire" data-enquire="">Get in touch</a>
      <a href="https://www.linkedin.com/company/medulla-space" target="_blank" rel="noopener">LinkedIn</a>
      <a href="https://www.instagram.com/medulla.space/" target="_blank" rel="noopener">Instagram</a>
      <a href="mailto:hello@medulla.city">hello@medulla.city</a>
      <span class="sidebar__addr">Dresdener Str. 113B, Berlin</span>
      <span class="sidebar__legal"><a href="/impressum.html">Impressum</a> · <a href="/datenschutz">Datenschutz</a></span>
    </nav>
  </aside>

  <main id="main-content" class="spaces">

    <section class="spaces__card" aria-labelledby="spaces-title">
      <h1 class="spaces__label" id="spaces-title">spaces</h1>
      <p class="spaces__lede">A courtyard building in Kreuzberg for working, meeting and gathering. Work here as a member, hire a room by the hour or day, or bring your event to the ground floor.</p>
      <nav class="spaces__jump" aria-label="On this page">
        <a class="btn-pill" href="#work">Work here</a>
        <a class="btn-pill" href="#hire">Hire a space</a>
        <a class="btn-pill" href="#host">Host an event</a>
        <a class="btn-pill btn-pill--solid" href="#enquire" data-enquire="">Get in touch</a>
      </nav>
    </section>

    <section class="spaces__card" id="work" aria-labelledby="work-title">
      <div class="spaces__head">
        <h2 class="spaces__label" id="work-title">work here</h2>
        <p>Memberships for individuals and teams. The ground floor is shared and social; the first floor is for focused work.</p>
      </div>
      <ul class="offers">
        <li class="offer">
          <h3 class="offer__name">Flexible desk</h3>
          <div><p class="offer__what">8, 10 or 14 days a month</p>
            <ul class="offer__tags"><li>Ground floor</li><li>Phone booth</li><li>First floor when free</li></ul></div>
          <a class="btn-pill" href="/spaces?interest=membership&amp;option=flexible#enquire" data-enquire="membership:flexible">Enquire</a>
        </li>
        <li class="offer">
          <h3 class="offer__name">Dedicated desk</h3>
          <div><p class="offer__what">Your own seat on the first floor, any day</p>
            <ul class="offer__tags"><li>First floor</li><li>Phone booth</li><li>Event space evenings &amp; weekends, when free</li></ul></div>
          <a class="btn-pill" href="/spaces?interest=membership&amp;option=dedicated#enquire" data-enquire="membership:dedicated">Enquire</a>
        </li>
        <li class="offer">
          <h3 class="offer__name">Team desks</h3>
          <div><p class="offer__what">A dedicated table for your organisation or group</p>
            <ul class="offer__tags"><li>First floor</li><li>Phone booth</li><li>Event space evenings &amp; weekends, when free</li></ul></div>
          <a class="btn-pill" href="/spaces?interest=membership&amp;option=team#enquire" data-enquire="membership:team">Enquire</a>
        </li>
        <li class="offer">
          <h3 class="offer__name">Day pass</h3>
          <div><p class="offer__what">10 days to use across 3 months</p>
            <ul class="offer__tags"><li>Ground floor</li><li>Phone booth</li></ul></div>
          <a class="btn-pill" href="/spaces?interest=membership&amp;option=day-pass#enquire" data-enquire="membership:day-pass">Enquire</a>
        </li>
        <li class="offer">
          <h3 class="offer__name">Virtual</h3>
          <div><p class="offer__what">Part of the community and programme, without a desk</p></div>
          <a class="btn-pill" href="/spaces?interest=membership&amp;option=virtual#enquire" data-enquire="membership:virtual">Enquire</a>
        </li>
      </ul>
      <p class="spaces__rates">Rates on request. We'll send them with our reply.</p>
    </section>

    <section class="spaces__card" id="hire" aria-labelledby="hire-title">
      <div class="spaces__head">
        <h2 class="spaces__label" id="hire-title">hire a space</h2>
        <p>By the hour or full day, for members and non-members.</p>
      </div>
      <ul class="rooms">
        <li class="room">
          <img class="room__photo" src="assets/images/figma/card-stair.webp" alt="The ground-floor lounge: a long mustard banquette under a spiral staircase, with windows onto the courtyard" loading="lazy" style="object-position: 30% 60%" />
          <h3 class="room__name">Ground floor</h3>
          <p class="room__meta">120 m² · from 3 hours or full day</p>
          <p class="room__text">The whole room, for events, salons, screenings and gatherings.</p>
          <a class="btn-pill" href="/spaces?interest=hire&amp;option=ground-floor#enquire" data-enquire="hire:ground-floor">Enquire</a>
        </li>
        <li class="room">
          <img class="room__photo" src="assets/images/figma/card-stair.webp" alt="Part of the ground floor beside the spiral staircase" loading="lazy" style="object-position: 85% 50%" />
          <h3 class="room__name">Ground floor, half</h3>
          <p class="room__meta">46 m² · from 4 hours or full day</p>
          <p class="room__text">For workshops, trainings and smaller groups.</p>
          <a class="btn-pill" href="/spaces?interest=hire&amp;option=ground-floor-half#enquire" data-enquire="hire:ground-floor-half">Enquire</a>
        </li>
        <li class="room">
          <img class="room__photo" src="assets/images/figma/card-conference.webp" alt="The meeting room: a long table with mesh chairs beside floor-to-ceiling windows onto trees" loading="lazy" />
          <h3 class="room__name">Meeting room</h3>
          <p class="room__meta">16.5 m² · from 4 hours or full day</p>
          <p class="room__text">For meetings, interviews and focused sessions.</p>
          <a class="btn-pill" href="/spaces?interest=hire&amp;option=meeting-room#enquire" data-enquire="hire:meeting-room">Enquire</a>
        </li>
      </ul>
      <p class="spaces__rates">Rates on request.</p>
    </section>

    <section class="spaces__card" id="host" aria-labelledby="host-title">
      <div class="spaces__head">
        <h2 class="spaces__label" id="host-title">host an event</h2>
        <p>Salons, lectures, workshops and gatherings on the ground floor.</p>
      </div>
      <div class="host">
        <div>
          <p>Events at Medulla should connect to its purpose: turning shared urgency into collective resilience. If your work resonates with that, it belongs here.</p>
          <ul class="host__rules">
            <li>The standard event window is <strong>18:00–21:30</strong>.</li>
            <li>We're in a residential courtyard, so no loud music, and doors stay closed.</li>
            <li>Each event has one named Event Lead, from setup to lock-up.</li>
            <li>Shoes off inside, and the space is left as you found it.</li>
          </ul>
        </div>
        <ol class="host__steps">
          <li>Tell us about your event: what it is, the date, and roughly how many people.</li>
          <li>We check the calendar and confirm with you.</li>
          <li>Once it's confirmed, you can start promoting it. We can list it on Medulla's events too.</li>
        </ol>
      </div>
      <a class="btn-pill btn-pill--solid host__cta" href="/spaces?interest=host#enquire" data-enquire="host">Tell us about your event</a>
    </section>

    <section class="spaces__card" id="enquire" aria-labelledby="enquire-title">
      <div class="spaces__head">
        <h2 class="spaces__label" id="enquire-title">get in touch</h2>
        <p>One short form for everything. We usually reply within a few days.</p>
      </div>
      <!-- ENQUIRY FORM — keep identical to the copy in index.html (tests/forms.test.js checks it) -->
      <div class="enquiry-wrap" data-enquiry>
        <form class="enquiry" name="enquiry" method="POST" action="/thanks" data-netlify="true" netlify-honeypot="bot-field" data-enquiry-form novalidate>
          <input type="hidden" name="form-name" value="enquiry" />
          <p class="enquiry__trap" aria-hidden="true">
            <label>Leave this empty <input name="bot-field" tabindex="-1" autocomplete="off" /></label>
          </p>

          <fieldset class="enquiry__group" aria-describedby="enq-interest-error">
            <legend class="enquiry__legend">What are you interested in?</legend>
            <div class="enquiry__pills">
              <label class="pill"><input type="radio" name="interest" value="membership" required /><span>Membership</span></label>
              <label class="pill"><input type="radio" name="interest" value="hire" /><span>Hiring a space</span></label>
              <label class="pill"><input type="radio" name="interest" value="host" /><span>Hosting an event</span></label>
              <label class="pill"><input type="radio" name="interest" value="visit" /><span>Visiting / saying hello</span></label>
            </div>
            <p class="enquiry__error" id="enq-interest-error" hidden>Choose what you're interested in.</p>
          </fieldset>

          <fieldset class="enquiry__group" data-group="membership">
            <legend class="enquiry__legend">Which membership? <span class="enquiry__opt">(optional)</span></legend>
            <div class="enquiry__pills enquiry__pills--small">
              <label class="pill"><input type="radio" name="membership" value="flexible" /><span>Flexible desk</span></label>
              <label class="pill"><input type="radio" name="membership" value="dedicated" /><span>Dedicated desk</span></label>
              <label class="pill"><input type="radio" name="membership" value="team" /><span>Team desks</span></label>
              <label class="pill"><input type="radio" name="membership" value="day-pass" /><span>Day pass</span></label>
              <label class="pill"><input type="radio" name="membership" value="virtual" /><span>Virtual</span></label>
              <label class="pill"><input type="radio" name="membership" value="not-sure" /><span>Not sure yet</span></label>
            </div>
          </fieldset>

          <fieldset class="enquiry__group" data-group="space">
            <legend class="enquiry__legend">Which space? <span class="enquiry__opt">(optional)</span></legend>
            <div class="enquiry__pills enquiry__pills--small">
              <label class="pill"><input type="radio" name="space" value="ground-floor" /><span>Ground floor · 120 m²</span></label>
              <label class="pill"><input type="radio" name="space" value="ground-floor-half" /><span>Half · 46 m²</span></label>
              <label class="pill"><input type="radio" name="space" value="meeting-room" /><span>Meeting room · 16.5 m²</span></label>
              <label class="pill"><input type="radio" name="space" value="not-sure" /><span>Not sure yet</span></label>
            </div>
          </fieldset>

          <fieldset class="enquiry__row" data-group="extras">
            <legend class="visually-hidden">Timing and group size</legend>
            <div class="enquiry__field">
              <label for="enq-when">Date or timeframe <span class="enquiry__opt">(optional)</span></label>
              <input id="enq-when" name="when" type="text" placeholder="e.g. a Thursday evening in November" />
            </div>
            <div class="enquiry__field">
              <label for="enq-size">Roughly how many people? <span class="enquiry__opt">(optional)</span></label>
              <input id="enq-size" name="size" type="text" inputmode="numeric" placeholder="e.g. 40" />
            </div>
          </fieldset>

          <div class="enquiry__row">
            <div class="enquiry__field">
              <label for="enq-name">Name</label>
              <input id="enq-name" name="name" type="text" autocomplete="name" required aria-describedby="enq-name-error" />
              <p class="enquiry__error" id="enq-name-error" hidden>Please add your name.</p>
            </div>
            <div class="enquiry__field">
              <label for="enq-email">Email</label>
              <input id="enq-email" name="email" type="email" autocomplete="email" required aria-describedby="enq-email-error" />
              <p class="enquiry__error" id="enq-email-error" hidden>Please add an email address we can reply to.</p>
            </div>
          </div>
          <div class="enquiry__field">
            <label for="enq-org">Organisation <span class="enquiry__opt">(optional)</span></label>
            <input id="enq-org" name="organisation" type="text" autocomplete="organization" />
          </div>
          <div class="enquiry__field">
            <label for="enq-message">Anything we should know? <span class="enquiry__opt">(optional)</span></label>
            <textarea id="enq-message" name="message" rows="4" placeholder="Say hello, or ask us anything"></textarea>
          </div>

          <div class="enquiry__send">
            <button class="enquiry__submit" type="submit">Send</button>
            <p class="enquiry__fine">We only use your details to reply. See our <a href="/datenschutz">privacy notice</a>.</p>
          </div>
          <p class="enquiry__status" role="alert" hidden></p>
        </form>
        <div class="enquiry__done" tabindex="-1" hidden>
          <p class="enquiry__done-title"></p>
          <p class="enquiry__done-text"></p>
        </div>
      </div>
      <!-- /ENQUIRY FORM -->
    </section>

  </main>

  <script src="scripts/enquiry-core.js"></script>
  <script src="scripts/enquiry.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create `thanks.html`** (the landing page when JavaScript is off)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Thanks — Medulla</title>
  <meta name="robots" content="noindex, follow" />
  <meta name="theme-color" content="#E5E5E5" />
  <link rel="icon" type="image/png" sizes="32x32" href="assets/icons/favicon-32.png" />
  <link rel="stylesheet" href="styles/main.css" />
</head>
<body class="page-legal">
  <main class="legal">
    <a class="legal__logo" href="/" aria-label="Medulla home">
      <img src="assets/logos/medulla-wordmark.svg" alt="Medulla" width="153" height="68" />
    </a>
    <h1>Thanks, we've got it</h1>
    <p>Your message has reached us. We usually reply within a few days.</p>
    <p>In the meantime, see what's coming up on <a href="https://luma.com/medulla">our events page</a>.</p>
    <a class="legal__back" href="/">← Back to Medulla</a>
  </main>
</body>
</html>
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `node --test tests/`
Expected: `# pass 13`, `# fail 0`.

- [ ] **Step 5: Update the sidebar styles in `styles/main.css`**

Replace the line `.sidebar__impressum { margin-top: 10px; opacity: 0.6; }` with:

```css
.sidebar__legal { margin-top: 10px; opacity: 0.6; }
.sidebar__links [aria-current="page"] { text-decoration: underline; text-underline-offset: 3px; }
```

- [ ] **Step 6: Add the Spaces page and form styles**

Insert the following into `styles/main.css` directly before the line `/* ── Mobile deck (≤820px): full-width portrait deck, brand pinned bottom ── */`:

```css
/* ── Shared UI: pill buttons, visually-hidden ──────────────────────────── */
.btn-pill {
  display: inline-block; border: 1px solid var(--ink); border-radius: 999px;
  padding: 0.45em 1.1em; font-size: 15px; line-height: 1.2; white-space: nowrap;
  transition: background 0.2s var(--ease), color 0.2s var(--ease);
}
.btn-pill:hover { background: var(--ink); color: var(--bg); opacity: 1; }
.btn-pill--solid { background: var(--ink); color: var(--bg); }
.btn-pill--solid:hover { opacity: 0.8; }
.visually-hidden, .enquiry__trap {
  position: absolute !important; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap;
}

/* ── Spaces page — plain scrolling page in the deck's visual language ──── */
.page-spaces .spaces {
  margin-left: var(--sidebar);
  padding: var(--module) var(--module) 96px 0;
  display: flex; flex-direction: column; gap: 20px;
}
.spaces > * { max-width: 1180px; }
.spaces__card {
  background: var(--bg); box-shadow: var(--shadow-content); border-radius: var(--radius);
  padding: clamp(24px, 3.2vw, 40px); scroll-margin-top: 16px;
}
.spaces__label {
  font-family: var(--font-display); font-weight: 400;
  font-size: var(--h1); line-height: 0.8; text-transform: uppercase;
}
.spaces__lede { font-size: clamp(19px, 1.6vw, 23px); line-height: 1.45; max-width: 46ch; margin-top: 22px; }
.spaces__jump { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
.spaces__head {
  display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end;
  gap: 16px 24px; margin-bottom: 22px;
}
.spaces__head p { max-width: 44ch; font-size: 15px; opacity: 0.75; }
.spaces__rates { margin-top: 18px; font-size: 15px; opacity: 0.75; }

.offers { list-style: none; }
.offer {
  display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.6fr) auto;
  gap: 8px 24px; align-items: center; padding: 16px 0; border-top: 1px solid rgba(0, 0, 0, 0.12);
}
.offer__name, .room__name {
  font-family: var(--font-display); font-weight: 400;
  font-size: clamp(26px, 2.2vw, 32px); line-height: 1.05;
}
.offer__what { font-size: 16px; }
.offer__tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; list-style: none; }
.offer__tags li { font-size: 12px; letter-spacing: 0.03em; background: rgba(0, 0, 0, 0.06); border-radius: 3px; padding: 2px 8px; }

.rooms { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; list-style: none; }
.room__photo { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 3px; }
.room__name { margin: 14px 0 4px; }
.room__meta { font-size: 14px; opacity: 0.75; }
.room__text { font-size: 16px; margin: 8px 0 14px; }

.host { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 36px; }
.host p, .host li { font-size: 16px; }
.host__rules { margin: 14px 0 0 18px; }
.host__rules li + li { margin-top: 6px; }
.host__steps { list-style: none; counter-reset: step; }
.host__steps li {
  counter-increment: step; position: relative;
  padding: 10px 0 10px 44px; border-top: 1px solid rgba(0, 0, 0, 0.12);
}
.host__steps li::before {
  content: counter(step); position: absolute; left: 0; top: 9px;
  width: 28px; height: 28px; display: grid; place-items: center;
  border: 1px solid var(--ink); border-radius: 50%;
  font-family: var(--font-display); font-size: 17px;
}
.host__cta { margin-top: 24px; }

@media (max-width: 1100px) { .rooms { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

/* ── Enquiry form (Spaces page + home-page dialog) ─────────────────────── */
.enquiry { display: flex; flex-direction: column; gap: 18px; max-width: 640px; }
.enquiry__group, .enquiry__row { border: 0; min-width: 0; }
.enquiry__group[hidden], .enquiry__row[hidden] { display: none; }
.enquiry__legend, .enquiry__field label { display: block; font-size: 15px; font-weight: 500; margin-bottom: 8px; }
.enquiry__opt { font-weight: 400; opacity: 0.65; }
.enquiry__pills { display: flex; flex-wrap: wrap; gap: 8px; }
.pill { position: relative; cursor: pointer; }
.pill input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.pill span {
  display: inline-block; border: 1px solid var(--ink); border-radius: 999px;
  padding: 8px 16px; font-size: 15px; line-height: 1.2;
  transition: background 0.15s var(--ease), color 0.15s var(--ease);
}
.enquiry__pills--small .pill span { padding: 5px 13px; font-size: 14px; border-color: rgba(0, 0, 0, 0.45); }
.pill input:checked + span { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.pill input:focus-visible + span { outline: 2px solid var(--ink); outline-offset: 2px; }
.enquiry__row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.enquiry__field input, .enquiry__field textarea {
  width: 100%; font: inherit; font-size: 16px; line-height: 1.4; color: var(--ink);
  padding: 11px 13px; background: #fff; border: 1px solid rgba(0, 0, 0, 0.3); border-radius: var(--radius);
}
.enquiry__field textarea { resize: vertical; min-height: 110px; }
.enquiry__field input:focus, .enquiry__field textarea:focus { outline: 2px solid var(--ink); outline-offset: 1px; }
.enquiry__field [aria-invalid="true"] { border-color: var(--err); }
.enquiry__error { color: var(--err); font-size: 14px; margin-top: 6px; }
.enquiry__send { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; }
.enquiry__submit {
  font: inherit; font-size: 16px; color: var(--bg); background: var(--ink);
  border: 0; border-radius: 999px; padding: 12px 28px; cursor: pointer;
}
.enquiry__submit:disabled { opacity: 0.5; cursor: progress; }
.enquiry__fine { font-size: 13px; opacity: 0.75; }
.enquiry__fine a, .enquiry__status a { text-decoration: underline; text-underline-offset: 2px; }
.enquiry__status { color: var(--err); font-size: 15px; }
.enquiry__done { max-width: 640px; padding: 20px 22px; background: #fff; border-radius: var(--radius); }
.enquiry__done:focus { outline: none; }
.enquiry__done-title { font-family: var(--font-display); font-size: 30px; line-height: 1.1; margin-bottom: 6px; }
@media (max-width: 560px) { .enquiry__row { grid-template-columns: 1fr; } }
```

Inside the existing `@media (max-width: 820px) { ... }` block, add before its closing `}`:

```css

  /* Spaces page: full width, clear the fixed bottom brand bar */
  .page-spaces .spaces { margin-left: 0; padding: 16px 16px calc(var(--bar-h) + 32px); }
  .offer { grid-template-columns: 1fr; }
  .offer .btn-pill { justify-self: start; }
  .rooms, .host { grid-template-columns: 1fr; }
```

Inside the existing `@media (prefers-reduced-motion: reduce) { ... }` block, add before its closing `}`:

```css
  .page-spaces .spaces { margin-left: 0; padding-left: var(--module); }
```

- [ ] **Step 7: Check the page in the browser**

In the `medulla` preview, navigate to `http://localhost:3456/spaces`.
- `mcp__Claude_Browser__read_console_messages {onlyErrors: true}`: expect only a 404 for `scripts/enquiry.js`, which is created in Task 4.
- Screenshot at 1440×900: the sidebar sits at left with "Spaces" underlined, and five cards stack on the right. All form fields are visible for now, because the JavaScript comes in Task 4.
- Screenshot at `{preset: "mobile"}`: one column, the bottom brand bar doesn't cover content, and the room cards stack.
- Measure the mobile bar: `document.querySelector('.sidebar').getBoundingClientRect().height`. If it's over 92, set `--bar-h` in the `@media (max-width: 820px)` `:root` block to the measured height rounded up to the next multiple of 4 (for example 104px). Then check the home deck still fits by running the fit-check snippet at 390×844.
- Reset with `{preset: "desktop"}`.

- [ ] **Step 8: Commit**

```bash
git add spaces.html thanks.html styles/main.css tests/forms.test.js
git commit -F - <<'EOF'
feat: add Spaces page with memberships, rooms, hosting guide and enquiry form markup

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 4: Wire up the enquiry form

**Files:**
- Create: `scripts/enquiry.js`

**Interfaces:**
- Consumes: `window.MedullaEnquiry` (Task 2) and the markup contract (Task 3). On the home page (Task 5) it also looks for `dialog[data-enquiry-dialog]` and `[data-enquiry-close]`.
- Produces: `CustomEvent`s dispatched on `document`: `enquiry:open` when the dialog opens and `enquiry:close` when it closes. Task 5's `main.js` listens for them.

- [ ] **Step 1: Implement `scripts/enquiry.js`**

```js
// ── Enquiry form — DOM wiring ───────────────────────────────────────────────
// One short form for every kind of enquiry, on the Spaces page and in the
// home-page dialog. Logic lives in enquiry-core.js; this file shows/hides the
// follow-up questions, applies prefills from [data-enquire] triggers and the
// URL, validates, and posts to Netlify Forms. On failure the visitor keeps
// their input and gets a prefilled email link, so nothing is lost.
(function () {
  const core = window.MedullaEnquiry;
  if (!core) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function currentInterest(form) {
    const checked = form.querySelector('[name="interest"]:checked');
    return checked ? checked.value : null;
  }

  function setGroupVisibility(form, interest) {
    const visible = core.visibleFieldsFor(interest);
    form.querySelectorAll('[data-group]').forEach((group) => {
      const show = Boolean(visible[group.dataset.group]);
      group.hidden = !show;
      group.disabled = !show; // disabled fields are left out of the submission
    });
    const message = form.querySelector('[name="message"]');
    if (message) message.placeholder = core.promptFor(interest);
  }

  function toggleError(form, id, show) {
    const el = form.querySelector(`#${id}`);
    if (el) el.hidden = !show;
  }

  function applyPrefill(form, prefill) {
    if (!prefill.interest) return;
    const radio = form.querySelector(`[name="interest"][value="${prefill.interest}"]`);
    if (radio) radio.checked = true;
    const field = core.getInterest(prefill.interest).optionField;
    if (field && prefill.option) {
      const option = form.querySelector(`[name="${field}"][value="${prefill.option}"]`);
      if (option) option.checked = true;
    }
    toggleError(form, 'enq-interest-error', false);
    setGroupVisibility(form, prefill.interest);
  }

  function focusStart(form) {
    const target = currentInterest(form)
      ? form.querySelector('[name="name"]')
      : form.querySelector('[name="interest"]');
    if (target) target.focus({ preventScroll: true });
  }

  function validate(form) {
    const problems = [];
    const hasInterest = Boolean(currentInterest(form));
    toggleError(form, 'enq-interest-error', !hasInterest);
    if (!hasInterest) problems.push(form.querySelector('[name="interest"]'));
    ['name', 'email'].forEach((fieldName) => {
      const input = form.querySelector(`[name="${fieldName}"]`);
      const ok = input.value.trim() !== '' && input.checkValidity();
      input.setAttribute('aria-invalid', String(!ok));
      toggleError(form, `enq-${fieldName}-error`, !ok);
      if (!ok) problems.push(input);
    });
    if (problems.length) problems[0].focus();
    return problems.length === 0;
  }

  function showDone(root, data) {
    const form = root.querySelector('form');
    const done = root.querySelector('.enquiry__done');
    const firstName = String(data.get('name') || '').trim().split(/\s+/)[0];
    done.querySelector('.enquiry__done-title').textContent = `Thanks, ${firstName}, we've got it.`;
    done.querySelector('.enquiry__done-text').textContent =
      `We'll reply to ${String(data.get('email') || '').trim()} within a few days.`;
    form.hidden = true;
    done.hidden = false;
    done.focus();
  }

  function showFailure(form, data) {
    const status = form.querySelector('.enquiry__status');
    const link = document.createElement('a');
    link.href = core.buildMailto(Object.fromEntries(data.entries()));
    link.textContent = 'email it to us';
    status.replaceChildren(
      'Something went wrong on our side. Your message is still here. Try again, or ',
      link,
      '.'
    );
    status.hidden = false;
  }

  async function submit(form, root) {
    const button = form.querySelector('[type="submit"]');
    const status = form.querySelector('.enquiry__status');
    const data = new FormData(form);
    button.disabled = true;
    button.textContent = 'Sending…';
    status.hidden = true;
    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: core.encodeBody([...data.entries()]),
      });
      if (!response.ok) throw new Error(`Netlify Forms responded ${response.status}`);
      showDone(root, data);
    } catch (error) {
      console.error('Enquiry submission failed:', error);
      showFailure(form, data);
    } finally {
      button.disabled = false;
      button.textContent = 'Send';
    }
  }

  function resetIfDone(root) {
    const form = root.querySelector('form');
    const done = root.querySelector('.enquiry__done');
    if (!done.hidden) {
      form.reset();
      form.hidden = false;
      done.hidden = true;
      setGroupVisibility(form, null);
    }
  }

  function initForm(root) {
    const form = root.querySelector('form[data-enquiry-form]');
    if (!form) return null;
    form.addEventListener('change', (event) => {
      if (event.target.name === 'interest') {
        toggleError(form, 'enq-interest-error', false);
        setGroupVisibility(form, event.target.value);
      }
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (validate(form)) submit(form, root);
    });
    setGroupVisibility(form, currentInterest(form));
    return form;
  }

  // ── Page setup ────────────────────────────────────────────────────────────
  const root = document.querySelector('[data-enquiry]');
  const form = root && initForm(root);
  if (!form) return;

  const dialog = document.querySelector('dialog[data-enquiry-dialog]');
  let opener = null;

  function openDialog(trigger) {
    opener = trigger;
    resetIfDone(root);
    dialog.showModal();
    document.dispatchEvent(new CustomEvent('enquiry:open'));
    focusStart(form);
  }

  if (dialog) {
    dialog.addEventListener('close', () => {
      document.dispatchEvent(new CustomEvent('enquiry:close'));
      if (opener) opener.focus();
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close(); // click on the backdrop
    });
    dialog.querySelectorAll('[data-enquiry-close]').forEach((button) => {
      button.addEventListener('click', () => dialog.close());
    });
  } else {
    applyPrefill(form, core.prefillFromSearch(window.location.search));
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-enquire]');
    if (!trigger) return;
    event.preventDefault();
    applyPrefill(form, core.parsePrefill(trigger.dataset.enquire));
    if (dialog) {
      openDialog(trigger);
    } else {
      const section = document.getElementById('enquire') || root;
      section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      focusStart(form);
    }
  });
})();
```

- [ ] **Step 2: Check it in the browser on the Spaces page**

Reload `http://localhost:3456/spaces` and work through these in order, reading state with `mcp__Claude_Browser__read_page` or `javascript_tool`:

1. On load, only the interest pills, the name, email, organisation and message fields, and Send are visible. The `[data-group]` fieldsets are all `hidden`.
2. Click the "Hiring a space" pill. The "Which space?" group and the date and size fields appear, and the message placeholder reads "What you're planning: a meeting, workshop, screening…".
3. Click "Enquire" on *Dedicated desk*. The page scrolls to `#enquire`, Membership and Dedicated desk are checked, and focus is on Name.
4. Navigate to `/spaces?interest=hire&option=meeting-room`. Hiring a space and Meeting room are pre-selected.
5. Click Send with the fields empty. "Please add your name." and the email error appear, focus goes to Name, and both inputs have `aria-invalid="true"`.
6. Fill in the name and email and click Send. The local server can't take a POST, so the red status line appears with an "email it to us" link. Check its `href` starts `mailto:hello@medulla.city?subject=Enquiry%3A%20`. The inputs keep their values.
7. Test the success state by stubbing fetch, then click Send again:

```js
window.fetch = async () => new Response('', { status: 200 });
```

Expected: the form is replaced by "Thanks, <first name>, we've got it." and focus is on `.enquiry__done`.

8. `read_console_messages {onlyErrors: true}`: expect only the one intentional "Enquiry submission failed" from item 6.

- [ ] **Step 3: Commit**

```bash
git add scripts/enquiry.js
git commit -F - <<'EOF'
feat: wire enquiry form — adaptive fields, prefill, Netlify submit, email fallback

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 5: Home page — organisation list, "work with us", sidebar and dialog

**Files:**
- Modify: `index.html` (sidebar nav at lines 74–82, Members card data-card 4, Contacts card data-card 6, a new `<dialog>` before `<main id="main-content">`, the `#members` and `#contacts` sections of `.a11y-content`, and the script tags at the end of the file), `scripts/main.js` (the "Click a peeking card" block), `styles/main.css`, `tests/forms.test.js`

**Interfaces:**
- Consumes: `enquiry:open` and `enquiry:close` (Task 4), the form markup (Task 3), `.btn-pill` and the form styles (Task 3).
- Produces: nothing new for later tasks.

- [ ] **Step 1: Add the failing check that both forms match**

Append to `tests/forms.test.js`:

```js
test('index.html dialog form has exactly the same fields as spaces.html', () => {
  assert.deepEqual(enquiryFieldNames('index.html'), enquiryFieldNames('spaces.html'));
});

test('index.html publishes no prices', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.doesNotMatch(html, /€|EUR\b|\d+\s?euro/i);
});
```

Run: `node --test tests/`
Expected: FAIL with `index.html contains the enquiry form`.

- [ ] **Step 2: Look up and confirm the organisation websites**

Candidates: nextlearning → `https://www.nextlearning.earth`, Dark Matter Labs → `https://darkmatterlabs.org`, One Resilient Earth → `https://oneresilientearth.org`. For VVSSL, WissDem and CommunAid, search the web (`WebSearch "<name> Berlin"`) for each one's official site.

Check each URL:

```bash
for u in https://www.nextlearning.earth https://darkmatterlabs.org https://oneresilientearth.org; do
  printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' -L "$u")" "$u"; done
```

Link a name only if the site returns 200 **and** is clearly that organisation, meaning the page title or an about text matches. Leave any other name as plain `<span>` text. Record the confirmed and unconfirmed list for the PR body.

- [ ] **Step 3: Replace the sidebar nav in `index.html`**

Replace the whole `<nav class="sidebar__links" aria-label="Links"> … </nav>` block with:

```html
    <nav class="sidebar__links" aria-label="Links">
      <a href="/spaces">Spaces</a>
      <a href="https://luma.com/medulla" target="_blank" rel="noopener">Events</a>
      <a href="/spaces#enquire" data-enquire="">Get in touch</a>
      <a href="https://www.linkedin.com/company/medulla-space" target="_blank" rel="noopener">LinkedIn</a>
      <a href="https://www.instagram.com/medulla.space/" target="_blank" rel="noopener">Instagram</a>
      <a href="mailto:hello@medulla.city">hello@medulla.city</a>
      <span class="sidebar__addr">Dresdener Str. 113B, Berlin</span>
      <span class="sidebar__legal"><a href="/impressum.html">Impressum</a> · <a href="/datenschutz">Datenschutz</a></span>
    </nav>
```

- [ ] **Step 4: Replace the Members card's `.card__body` (data-card 4)**

Replace everything inside `<div class="card__body"> … </div>` of the Members card with the following. For every organisation that Step 2 could **not** confirm, change its `<a …>…</a>` to `<span>…</span>`.

```html
          <div class="card__body">
            <p>Medulla is made up of organizations and individuals working toward resilience in their own ways, across different fields, communities, and practices, connected by a shared commitment to the capacities, relationships, and infrastructures needed to navigate crisis and create more liveable futures.</p>
            <p>We are assembling our first cohort of members and welcome applications from organizations and individuals who want to join on a permanent basis: a community of practice, more than a shared office.</p>
            <div class="roster">
              <p class="roster__title" id="roster-title">In the space</p>
              <ul class="roster__list" aria-labelledby="roster-title">
                <li><a href="https://www.nextlearning.earth" target="_blank" rel="noopener">nextlearning</a></li>
                <li><a href="https://darkmatterlabs.org" target="_blank" rel="noopener">Dark Matter Labs</a></li>
                <li><a href="https://oneresilientearth.org" target="_blank" rel="noopener">One Resilient Earth</a></li>
                <li><span>VVSSL</span></li>
                <li><span>WissDem</span></li>
                <li><span>CommunAid</span></li>
              </ul>
              <p class="roster__more">and independent practitioners</p>
            </div>
            <a class="card__cta" href="/spaces?interest=membership#enquire" data-enquire="membership">Become a member</a>
          </div>
```

- [ ] **Step 5: Replace the Contacts card (data-card 6) with "work with us"**

Replace the whole `<article class="card card--content" data-card="6" aria-label="Contacts"> … </article>` block with:

```html
      <!-- Card 6 — Work with us -->
      <article class="card card--content" data-card="6" aria-label="Work with us">
        <div class="card__inner">
          <div class="card__body">
            <p>Medulla is open to people, organizations, and initiatives working toward collective resilience, civic imagination, and new models for shared prosperity. There are three ways to be part of the space:</p>
            <ul class="doors">
              <li><a class="door" href="/spaces#work"><span class="door__name">Work here</span><span class="door__text">Flexible, dedicated and team desks, day passes</span></a></li>
              <li><a class="door" href="/spaces#hire"><span class="door__name">Hire a space</span><span class="door__text">Ground floor (120 m²), half (46 m²), meeting room (16.5 m²)</span></a></li>
              <li><a class="door" href="/spaces#host"><span class="door__name">Host an event</span><span class="door__text">Evenings 18:00–21:30, for work that fits Medulla's purpose</span></a></li>
            </ul>
            <a class="card__cta" href="/spaces#enquire" data-enquire="">Get in touch</a>
          </div>
          <div class="card__label-row"><span class="card__label">work with us</span></div>
        </div>
      </article>
```

- [ ] **Step 6: Add the dialog to `index.html`**

Insert directly before `  <!-- Accessible content for screen readers -->`:

```html
  <!-- Enquiry dialog — opened by any [data-enquire] trigger on this page -->
  <dialog class="enquiry-dialog" data-enquiry-dialog aria-labelledby="enquiry-dialog-title" data-lenis-prevent>
    <div class="enquiry-dialog__inner">
      <div class="enquiry-dialog__head">
        <div>
          <h2 class="enquiry-dialog__title" id="enquiry-dialog-title">get in touch</h2>
          <p class="enquiry-dialog__sub">One short form for everything. We usually reply within a few days.</p>
        </div>
        <button type="button" class="enquiry-dialog__close" data-enquiry-close>Close</button>
      </div>
      <!-- ENQUIRY FORM — paste the block between the ENQUIRY FORM comments in spaces.html, unchanged -->
    </div>
  </dialog>
```

Then replace the comment line `<!-- ENQUIRY FORM — paste … -->` with the entire block from `spaces.html`: everything from `<!-- ENQUIRY FORM — keep identical …` through `<!-- /ENQUIRY FORM -->`, copied unchanged.

- [ ] **Step 7: Update the screen-reader content and the scripts**

In `.a11y-content`, replace the `<section id="members"> … </section>` and `<section id="contacts"> … </section>` blocks with:

```html
    <section id="members">
      <h2>Members</h2>
      <p>Medulla is made up of organizations and individuals working toward resilience in their own ways. In the space: nextlearning, Dark Matter Labs, One Resilient Earth, VVSSL, WissDem, CommunAid, and independent practitioners. We are assembling our first cohort of members and welcome applications.</p>
    </section>
    <section id="work-with-us">
      <h2>Work with us</h2>
      <p>Work here with a flexible, dedicated or team desk or a day pass; hire the ground floor (120 m²), half the ground floor (46 m²) or the meeting room (16.5 m²); or host an event on weekday evenings 18:00–21:30. See <a href="/spaces">Spaces</a> for details, or get in touch through the enquiry form at <a href="/spaces#enquire">medulla.city/spaces</a> or at <a href="mailto:hello@medulla.city">hello@medulla.city</a>. Dresdener Str. 113B, Berlin.</p>
    </section>
```

Replace the two script tags at the end of the file:

```html
  <script src="scripts/lib/lenis.min.js"></script>
  <script src="scripts/main.js"></script>
```

with:

```html
  <script src="scripts/lib/lenis.min.js"></script>
  <script src="scripts/enquiry-core.js"></script>
  <script src="scripts/enquiry.js"></script>
  <script src="scripts/main.js"></script>
```

- [ ] **Step 8: Pause the deck's smooth scroll while the dialog is open (`scripts/main.js`)**

Directly after the block that ends with the `driver.addEventListener('click', …);` handler, insert:

```js

// ── Enquiry dialog: freeze the deck behind it (see enquiry.js) ──────────────
document.addEventListener('enquiry:open', () => { if (lenis) lenis.stop(); });
document.addEventListener('enquiry:close', () => { if (lenis) lenis.start(); });
```

- [ ] **Step 9: Add the home-page styles**

Insert into `styles/main.css` directly after the `.card__cta:hover { … }` rule:

```css

/* Members → "In the space" roster */
.roster { margin-top: clamp(14px, 2.2vh, 26px); }
.roster .roster__title, .roster .roster__more { font-size: var(--b2); line-height: 1.4; opacity: 0.7; margin: 0; }
.roster__list { list-style: none; display: flex; flex-wrap: wrap; font-size: var(--b1); line-height: 1.45; margin: 4px 0; }
.roster__list li:not(:last-child)::after { content: '·'; margin: 0 0.45em; opacity: 0.5; }
.roster__list a { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; text-decoration-color: rgba(0, 0, 0, 0.35); }

/* Work with us → three doors to /spaces */
.doors { list-style: none; margin-top: clamp(12px, 2vh, 22px); border-bottom: 1px solid rgba(0, 0, 0, 0.14); }
.door {
  display: grid; grid-template-columns: minmax(8.5em, auto) 1fr auto; align-items: baseline;
  gap: 2px 16px; padding: clamp(8px, 1.2vh, 14px) 0; border-top: 1px solid rgba(0, 0, 0, 0.14);
}
.door::after { content: '→'; }
.door__name { font-family: var(--font-display); font-size: clamp(22px, 2.8vh, 30px); line-height: 1.05; }
.door__text { font-size: var(--b2); line-height: 1.4; }
```

Insert directly after the enquiry form block from Task 3 (the line `@media (max-width: 560px) { .enquiry__row { grid-template-columns: 1fr; } }`):

```css

/* ── Home: enquiry dialog ──────────────────────────────────────────────── */
.enquiry-dialog {
  width: min(720px, calc(100vw - 32px)); max-height: calc(100dvh - 32px);
  margin: auto; padding: 0; border: 0; border-radius: var(--radius);
  background: var(--bg); color: var(--ink);
  box-shadow: 0 10px 40px rgba(31, 33, 52, 0.35);
  overflow-y: auto; overscroll-behavior: contain;
}
.enquiry-dialog::backdrop { background: rgba(20, 20, 24, 0.45); }
.enquiry-dialog[open] { animation: enquiry-in 0.28s var(--ease); }
@keyframes enquiry-in { from { opacity: 0; transform: translateY(8px) scale(0.985); } }
.enquiry-dialog__inner { padding: clamp(24px, 3vw, 36px); }
.enquiry-dialog__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
.enquiry-dialog__title {
  font-family: var(--font-display); font-weight: 400;
  font-size: clamp(40px, 5vh, 56px); line-height: 0.8; text-transform: uppercase;
}
.enquiry-dialog__sub { font-size: 15px; opacity: 0.75; margin-top: 10px; }
.enquiry-dialog__close {
  font: inherit; font-size: 15px; background: none; cursor: pointer;
  border: 1px solid var(--ink); border-radius: 999px; padding: 6px 14px;
}
```

Inside `@media (max-width: 820px) { … }`, add:

```css
  .door { grid-template-columns: 1fr auto; }
  .door__text { grid-column: 1; }
```

Inside `@media (prefers-reduced-motion: reduce) { … }`, add:

```css
  .enquiry-dialog[open] { animation: none; }
```

- [ ] **Step 10: Run the tests**

Run: `node --test tests/`
Expected: `# pass 15`, `# fail 0`.

- [ ] **Step 11: Fit check and dialog check in the browser**

Reload `http://localhost:3456/`:
1. Run the **fit-check snippet** at 1440×900, 1280×720 and 390×844. Cards 4 (members) and 6 (work with us) are the ones at risk. If either fails, first set `.doors` to `margin-top: clamp(8px, 1.4vh, 18px)` and `.roster` to `margin-top: clamp(10px, 1.6vh, 20px)`, then check again. If it still fails, stop and report the card and the px overflow to the owner, since the copy needs trimming.
2. At scroll position 0, click the sidebar's "Get in touch". The dialog opens and focus lands on the first interest radio. Run `document.documentElement.classList.contains('lenis-stopped')`: expect `true`.
3. Press Escape. The dialog closes, focus returns to "Get in touch", and `lenis-stopped` is `false`.
4. Scroll the deck to the Members card (use `mcp__Claude_Browser__computer {action: "scroll", scroll_direction: "down"}` repeatedly) and click "Become a member". The dialog opens with Membership checked, and focus is on Name.
5. Click the backdrop outside the dialog. It closes.
6. Screenshot at scroll 0 with the dialog open. The dialog is top layer, so it captures normally.
7. `read_console_messages {onlyErrors: true}`: expect none.
8. Reset with `{preset: "desktop"}`.

- [ ] **Step 12: Commit**

```bash
git add index.html scripts/main.js styles/main.css tests/forms.test.js
git commit -F - <<'EOF'
feat: home — org roster, "work with us" card, new sidebar, enquiry dialog

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 6: Privacy notice (Datenschutzerklärung)

**Files:**
- Create: `datenschutz.html`
- Modify: `impressum.html` (add a link to the privacy notice next to the back link)

**Interfaces:**
- Consumes: the `.legal` styles (existing) and `--font-display` (Task 1).
- Produces: `/datenschutz`, which the sidebar and the form link to.

- [ ] **Step 1: Create `datenschutz.html`**

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Datenschutz — Medulla</title>
  <meta name="description" content="Datenschutzerklärung für medulla.city." />
  <meta name="robots" content="noindex, follow" />
  <meta name="theme-color" content="#E5E5E5" />
  <link rel="icon" type="image/png" sizes="32x32" href="assets/icons/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="192x192" href="assets/icons/favicon-192.png" />
  <link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png" />
  <link rel="preload" href="assets/fonts/instrument-sans-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="styles/main.css" />
</head>
<body class="page-legal">
  <main class="legal">
    <a class="legal__logo" href="/" aria-label="Medulla — Startseite">
      <img src="assets/logos/medulla-wordmark.svg" alt="Medulla" width="153" height="68" />
    </a>

    <h1>Datenschutz&shy;erklärung</h1>

    <h2>1. Verantwortlicher</h2>
    <address>
      nextlearning e. V.<br>
      Dresdener Straße 119<br>
      10999 Berlin<br>
      Telefon: <a href="tel:+493022397795">+49 30 22397795</a><br>
      E-Mail: <a href="mailto:hello@nextlearning.earth">hello@nextlearning.earth</a>
    </address>
    <p>Für Anfragen zu Medulla erreichen Sie uns auch unter <a href="mailto:hello@medulla.city">hello@medulla.city</a>.</p>

    <h2>2. Hosting und Server-Logfiles</h2>
    <p>Diese Website wird bei Netlify, Inc. (USA) gehostet. Beim Aufruf der Website verarbeitet Netlify technisch notwendige Daten in Server-Logfiles: IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite, Referrer-URL sowie Browser- und Betriebssystem­angaben. Die Verarbeitung erfolgt, um die Website sicher und stabil bereitzustellen (Art. 6 Abs. 1 lit. f DSGVO; unser berechtigtes Interesse liegt im sicheren Betrieb der Website).</p>
    <p>Mit Netlify besteht ein Vertrag zur Auftragsverarbeitung (Art. 28 DSGVO). Soweit Daten in die USA übermittelt werden, erfolgt dies auf Grundlage der Standardvertrags­klauseln der EU-Kommission (Art. 46 Abs. 2 lit. c DSGVO). Weitere Informationen: <a href="https://www.netlify.com/privacy/">netlify.com/privacy</a>.</p>

    <h2>3. Kontaktformular und E-Mail</h2>
    <p>Wenn Sie uns über das Kontaktformular oder per E-Mail schreiben, verarbeiten wir die Angaben, die Sie uns machen: Ihr Anliegen (z. B. Mitgliedschaft, Raumanfrage oder Veranstaltung), Name, E-Mail-Adresse sowie freiwillig Organisation, gewünschter Zeitraum, Gruppengröße und Ihre Nachricht. Wir nutzen diese Daten ausschließlich, um Ihre Anfrage zu beantworten.</p>
    <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, soweit Ihre Anfrage auf einen Vertrag (z. B. eine Mitgliedschaft oder Raumbuchung) gerichtet ist, im Übrigen Art. 6 Abs. 1 lit. f DSGVO (unser berechtigtes Interesse an der Beantwortung von Anfragen).</p>
    <p>Formulareingaben werden über den Dienst Netlify Forms entgegengenommen und per E-Mail an uns weitergeleitet; Netlify handelt dabei als Auftragsverarbeiter (siehe Abschnitt 2). Wir löschen Ihre Anfrage, sobald sie abschließend bearbeitet ist, spätestens zwölf Monate nach dem letzten Kontakt, sofern keine gesetzlichen Aufbewahrungs­pflichten entgegenstehen.</p>

    <h2>4. Keine Cookies, kein Tracking</h2>
    <p>Diese Website setzt keine Cookies und verwendet keine Analyse-, Werbe- oder Tracking-Dienste. Schriftarten werden von unserem eigenen Server geladen; es werden dabei keine Daten an Dritte übertragen.</p>

    <h2>5. Externe Links</h2>
    <p>Unsere Website verlinkt auf Angebote Dritter, etwa Luma (Veranstaltungen), LinkedIn und Instagram. Erst wenn Sie einen solchen Link anklicken, werden Daten an den jeweiligen Anbieter übertragen; dort gelten dessen Datenschutz­bestimmungen.</p>

    <h2>6. Ihre Rechte</h2>
    <p>Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (Art. 21). Wenden Sie sich dafür an die oben genannten Kontaktdaten.</p>
    <p>Sie haben außerdem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77 DSGVO), zum Beispiel bei der Berliner Beauftragten für Datenschutz und Informationsfreiheit, Alt-Moabit 59–61, 10555 Berlin.</p>

    <p><em>Stand: September 2026</em></p>

    <a class="legal__back" href="/">← Zurück zur Startseite</a>
  </main>
</body>
</html>
```

- [ ] **Step 2: Link it from the Impressum**

In `impressum.html`, replace:

```html
    <a class="legal__back" href="/">← Zurück zur Startseite</a>
```

with:

```html
    <p>Informationen zur Verarbeitung personenbezogener Daten finden Sie in unserer <a href="/datenschutz">Datenschutzerklärung</a>.</p>

    <a class="legal__back" href="/">← Zurück zur Startseite</a>
```

- [ ] **Step 3: Check both pages**

Navigate to `http://localhost:3456/datenschutz` and screenshot it. Headings should be in serif, body in sans, and there should be no console errors. Follow the Impressum's new link and confirm it opens `/datenschutz`. Then find every link to the privacy notice and check that each one resolves:

```bash
grep -rn 'href="/datenschutz"' --include=*.html . | grep -v .superpowers
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3456/datenschutz
```

Expected: links found in index.html (sidebar and form), spaces.html (sidebar and form) and impressum.html. The curl prints `200`.

- [ ] **Step 4: Commit**

```bash
git add datenschutz.html impressum.html
git commit -F - <<'EOF'
docs: add Datenschutzerklärung (draft — needs review before merge)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 7: Full check and PR B

**Files:**
- No new files. Fixes found here go into the file they belong to.

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Automated tests**

Run: `node --test tests/`
Expected: `# pass 15`, `# fail 0`.

- [ ] **Step 2: Keyboard-only pass**

On `/spaces`, use `mcp__Claude_Browser__computer {action: "key", text: "Tab"}` repeatedly from the top. Focus must visibly move through: skip link → sidebar links → jump pills → each Enquire → the interest radios (arrow keys move between pills, each showing a focus ring) → the fields → Send. Nothing may be focusable in the honeypot. Check: `document.activeElement.name !== 'bot-field'` after tabbing past the interest group.

On `/`, press Tab until "Get in touch" is focused and press Enter. The dialog opens. Tab cycles only inside the dialog, and Escape closes it, returning focus to the trigger.

- [ ] **Step 3: Contrast and labels**

Run in `javascript_tool` on `/spaces`:

```js
[...document.querySelectorAll('.enquiry input:not([type=hidden]):not([name=bot-field]), .enquiry textarea')]
  .map((el) => ({ name: el.name, label: el.labels && el.labels[0] ? el.labels[0].textContent.trim() : null }))
  .filter((f) => !f.label);
```

Expected: `[]`, meaning every field has a label. The colour pairs are black on #E5E5E5 (about 16:1), #B3261E on #E5E5E5 (about 5.5:1), and white on black for the solid pills and Send button. All pass WCAG AA.

- [ ] **Step 4: Push and open PR B**

```bash
git push -u origin claude/spaces-enquiry
gh pr create --base main --head claude/spaces-enquiry \
  --title "feat: Spaces page, org roster, and one-step enquiry form" \
  --body "$(cat <<'EOF'
Makes Medulla easy to understand and easy to contact. Implements `docs/superpowers/specs/2026-09-23-readability-spaces-enquiry-design.md`. Stacked on the typography PR, and its commits drop out of this diff once that one is merged.

## Changes
- **`/spaces`**: memberships (flexible, dedicated, team, day pass, virtual), rooms for hire (ground floor 120 m², half 46 m², meeting room 16.5 m²), a hosting guide drawn from Event Protocol v1, and the enquiry form. **No prices.** Everything says "Rates on request".
- **Home**: the Members card lists the organisations in the space. Contacts becomes **"work with us"**, with three doors to /spaces. The new sidebar has Spaces · Events · Get in touch. "Get in touch" and "Become a member" open the form as an overlay, and the deck pauses behind it.
- **Enquiry form**: one tap to pick an interest, then only name and email are required. Follow-up questions adapt to the choice, and every Enquire button fills in its option. Submissions go to Netlify Forms. If sending fails, the input is kept and there's a prefilled email link. A honeypot catches spam, with no CAPTCHA. Without JavaScript the form posts normally and lands on `/thanks`.
- **Typeform removed** from the site.
- **`/datenschutz`**: a new privacy notice, needed now that the site collects names and emails. It's linked from the sidebar, the form and the Impressum.

## Before merging (owner)
- [ ] **Privacy notice reviewed** by nextlearning or legal counsel (drafted, not legal advice)
- [ ] **Netlify → Site configuration → Forms → Enable form detection**, then **Form notifications → Add notification → Email notification** → form `enquiry` → `hello@medulla.city`
- [ ] Confirm the **Virtual** membership wording
- [ ] Confirm the organisation links (see below)
- [ ] Optional: room capacities, and a real photo of the half ground floor (it currently reuses the lounge photo, cropped)

## Organisation links
<list here which names are linked, with URLs, and which are plain text pending confirmation>

## Test plan
- [x] `node --test tests/`: logic helpers, both forms have identical fields, no prices in the HTML
- [x] Fit check: no clipped deck cards at 1440×900, 1280×720, 390×844
- [x] Form: adaptive fields, prefill from buttons and URL, validation, failure → mailto, success state
- [x] Dialog: focus in and out, Escape, backdrop click, deck paused
- [x] Keyboard-only pass; every field labelled; contrast AA
- [ ] One real submission on the deploy preview, after the owner OKs it (see below)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Before running it, replace the "Organisation links" placeholder line with the actual confirmed and unconfirmed list from Task 5 Step 2.

Expected: the command prints the PR URL. Report it to the user wrapped in `<pr-created>…</pr-created>`.

- [ ] **Step 5: Real submission on the deploy preview (ask first)**

Submitting sends an email to hello@medulla.city and creates an entry in the Netlify dashboard. **Ask the user for explicit permission before submitting.** It only works after they have switched on form detection and a new deploy has run.

Once they say yes, open `https://deploy-preview-<PR number>--medulla-city.netlify.app/spaces` in the Browser pane. Choose "Visiting / saying hello", enter the name `Test (Claude)`, the email the user gives, and the message `Test submission — please delete`, then Send. Expected: the "Thanks, Test, we've got it." state. Tell the user where to find the entry (Netlify → Forms → enquiry) so they can delete it.
