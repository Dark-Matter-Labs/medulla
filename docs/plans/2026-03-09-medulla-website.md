# medulla Website Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a single-page static website for medulla — a shared Berlin resilience-practice space — with a Typeform popup application form.

**Architecture:** Single `index.html` with linked `styles/main.css` and `scripts/main.js`. No build step, no framework. Typeform loaded via their embed script and triggered as a popup on button click. Scroll-based fade-in animations via IntersectionObserver.

**Tech Stack:** Vanilla HTML5, CSS custom properties, vanilla JS, Google Fonts (DM Sans + DM Serif Display), Typeform embed SDK.

---

### Task 1: Project scaffold

**Files:**
- Create: `index.html`
- Create: `styles/main.css`
- Create: `scripts/main.js`
- Create: `assets/logos/.gitkeep`

**Step 1: Create directory structure**

```bash
mkdir -p styles scripts assets/logos
touch styles/main.css scripts/main.js assets/logos/.gitkeep
```

**Step 2: Create `index.html` shell**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>medulla — Berlin</title>
  <meta name="description" content="medulla is a shared resilience node designed to sense change early, connect different actors, and strengthen the practical capacities that keep essential urban functions alive." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles/main.css" />
</head>
<body>

  <!-- HERO -->
  <section id="hero" class="section section--dark">
  </section>

  <!-- MEDULLA -->
  <section id="medulla" class="section section--light">
  </section>

  <!-- RESILIENCE -->
  <section id="resilience" class="section section--warm">
  </section>

  <!-- APPLY -->
  <section id="apply" class="section section--dark">
  </section>

  <!-- FOOTER -->
  <footer class="footer">
  </footer>

  <script src="scripts/main.js"></script>
</body>
</html>
```

**Step 3: Verify in browser**

Open `index.html` in browser. Expected: blank page, no console errors, Google Fonts loading in network tab.

**Step 4: Commit**

```bash
git init
git add .
git commit -m "chore: project scaffold"
```

---

### Task 2: CSS design system

**Files:**
- Modify: `styles/main.css`

**Step 1: Write the full CSS design system**

```css
/* ─── Reset & Base ─────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  /* Colours */
  --color-dark:        #111111;
  --color-dark-alt:    #1A1A18;
  --color-light:       #F5F3EE;
  --color-warm:        #F0EDE6;
  --color-text:        #1A1A1A;
  --color-text-muted:  #6B6B64;
  --color-text-light:  #F5F3EE;
  --color-text-dim:    #8A8A82;
  --color-accent:      #B83225;
  --color-rule:        rgba(26,26,26,0.12);
  --color-rule-light:  rgba(245,243,238,0.15);

  /* Typography */
  --font-serif:  'DM Serif Display', Georgia, serif;
  --font-sans:   'DM Sans', system-ui, sans-serif;

  /* Spacing */
  --space-xs:   8px;
  --space-sm:   16px;
  --space-md:   32px;
  --space-lg:   64px;
  --space-xl:   96px;
  --space-2xl:  140px;

  /* Layout */
  --max-width:  1200px;
  --gutter:     48px;
}

html { scroll-behavior: smooth; }

body {
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.65;
  color: var(--color-text);
  background: var(--color-light);
  -webkit-font-smoothing: antialiased;
}

/* ─── Layout ────────────────────────────────────────────────────────── */
.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--gutter);
}

.section {
  padding: var(--space-2xl) 0;
}

.section--dark  { background: var(--color-dark); }
.section--light { background: var(--color-light); }
.section--warm  { background: var(--color-warm); }

/* ─── Typography ────────────────────────────────────────────────────── */
.serif { font-family: var(--font-serif); }

.wordmark {
  font-family: var(--font-serif);
  font-size: clamp(72px, 10vw, 128px);
  line-height: 0.9;
  letter-spacing: -0.02em;
  color: var(--color-text-light);
}

.section-label {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: var(--space-lg);
}

.section-label--light {
  color: var(--color-text-dim);
}

h2 {
  font-family: var(--font-serif);
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 400;
  line-height: 1.1;
  letter-spacing: -0.01em;
}

h3 {
  font-family: var(--font-serif);
  font-size: clamp(22px, 2.5vw, 28px);
  font-weight: 400;
  line-height: 1.15;
  margin-bottom: var(--space-sm);
}

p {
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-text-muted);
  max-width: 52ch;
}

p + p { margin-top: var(--space-sm); }

/* ─── Hero ──────────────────────────────────────────────────────────── */
#hero {
  min-height: 100vh;
  display: grid;
  grid-template-rows: 1fr auto;
  padding-top: var(--space-xl);
  padding-bottom: 0;
}

.hero__top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
  align-items: start;
}

.hero__left {}

.hero__byline {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-dim);
  margin-top: var(--space-md);
  line-height: 1.6;
  max-width: 28ch;
}

.hero__right {
  padding-top: 12px;
}

.hero__intro {
  color: rgba(245,243,238,0.65);
  max-width: 48ch;
}

.hero__intro--bold {
  color: var(--color-text-light);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.55;
  margin-top: var(--space-md);
  max-width: 44ch;
}

.hero__invite {
  margin-top: var(--space-md);
  color: rgba(245,243,238,0.7);
  font-style: italic;
  max-width: 44ch;
}

/* Hero bottom bar */
.hero__bottom {
  border-top: 1px solid var(--color-rule-light);
  margin-top: var(--space-xl);
  padding: var(--space-md) 0;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: var(--space-md);
  align-items: center;
}

.hero__meta {
  font-size: 12px;
  color: var(--color-text-dim);
  line-height: 1.6;
}

.hero__meta strong {
  display: block;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(245,243,238,0.35);
  margin-bottom: 4px;
}

.hero__cta {
  font-family: var(--font-serif);
  font-size: clamp(32px, 4vw, 48px);
  color: var(--color-accent);
  text-decoration: none;
  letter-spacing: -0.01em;
  transition: opacity 0.2s ease;
  white-space: nowrap;
}

.hero__cta:hover { opacity: 0.75; }

/* ─── Grid sections (medulla + resilience) ──────────────────────────── */
.grid-section__header {
  display: flex;
  align-items: baseline;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--color-rule);
}

.grid-section__title {
  font-family: var(--font-serif);
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
}

.card {
  padding: var(--space-lg) var(--space-md) var(--space-lg) 0;
  border-top: 1px solid var(--color-rule);
}

.card:nth-child(3n+2),
.card:nth-child(3n+3) {
  padding-left: var(--space-md);
  border-left: 1px solid var(--color-rule);
}

.card h3 {
  margin-bottom: var(--space-sm);
}

.card p {
  font-size: 14px;
  max-width: none;
}

/* ─── Apply section ──────────────────────────────────────────────────── */
#apply {
  text-align: left;
}

.apply__wordmark {
  font-family: var(--font-serif);
  font-size: clamp(80px, 14vw, 180px);
  line-height: 0.85;
  color: var(--color-accent);
  letter-spacing: -0.03em;
  margin-bottom: var(--space-lg);
}

.apply__body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
  align-items: end;
  border-top: 1px solid var(--color-rule-light);
  padding-top: var(--space-lg);
}

.apply__invite {
  font-size: 18px;
  color: rgba(245,243,238,0.7);
  line-height: 1.6;
  max-width: 44ch;
  font-style: italic;
}

.apply__details {
  text-align: right;
}

.apply__meta {
  font-size: 12px;
  color: var(--color-text-dim);
  line-height: 1.9;
}

.btn {
  display: inline-block;
  margin-top: var(--space-md);
  padding: 14px 32px;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-light);
  border: 1px solid rgba(245,243,238,0.3);
  text-decoration: none;
  cursor: pointer;
  background: transparent;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.btn:hover {
  background: rgba(245,243,238,0.08);
  border-color: rgba(245,243,238,0.6);
}

/* ─── Footer ─────────────────────────────────────────────────────────── */
.footer {
  background: var(--color-dark-alt);
  border-top: 1px solid var(--color-rule-light);
  padding: var(--space-lg) 0;
}

.footer__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.footer__logos {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.footer__logo {
  font-size: 12px;
  font-weight: 500;
  color: rgba(245,243,238,0.4);
  text-decoration: none;
  letter-spacing: 0.04em;
  transition: color 0.2s ease;
}

.footer__logo:hover { color: rgba(245,243,238,0.8); }

.footer__logo-sep {
  color: rgba(245,243,238,0.15);
}

.footer__address {
  font-size: 12px;
  color: rgba(245,243,238,0.3);
  text-align: right;
  line-height: 1.6;
}

/* ─── Scroll animation ───────────────────────────────────────────────── */
.fade-in {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}

/* ─── Responsive ─────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  :root {
    --gutter: 24px;
    --space-2xl: 96px;
  }

  .hero__top {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }

  .hero__bottom {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
  }

  .hero__cta {
    grid-column: 1 / -1;
  }

  .card-grid {
    grid-template-columns: 1fr 1fr;
  }

  .card:nth-child(3n+2),
  .card:nth-child(3n+3) {
    padding-left: 0;
    border-left: none;
  }

  .card:nth-child(2n) {
    padding-left: var(--space-md);
    border-left: 1px solid var(--color-rule);
  }

  .apply__body {
    grid-template-columns: 1fr;
  }

  .apply__details {
    text-align: left;
  }
}

@media (max-width: 600px) {
  .card-grid {
    grid-template-columns: 1fr;
  }

  .card:nth-child(2n) {
    padding-left: 0;
    border-left: none;
  }

  .hero__bottom {
    grid-template-columns: 1fr;
  }
}
```

**Step 2: Verify in browser**

Open `index.html`. Expected: no layout yet (sections are empty), but custom properties and font loading should be confirmed via DevTools.

**Step 3: Commit**

```bash
git add styles/main.css
git commit -m "feat: add CSS design system and layout"
```

---

### Task 3: Hero section HTML

**Files:**
- Modify: `index.html` (hero section only)

**Step 1: Replace the empty `<section id="hero">` with full hero content**

```html
<section id="hero" class="section section--dark">
  <div class="container">
    <div class="hero__top">
      <div class="hero__left fade-in">
        <h1 class="wordmark">medulla</h1>
        <p class="hero__byline">
          initiated by Politics for Tomorrow /<br />
          nextLearning e.V. and Dark Matter Labs
        </p>
      </div>
      <div class="hero__right fade-in" style="transition-delay:0.15s">
        <p class="hero__intro">
          Today, cities no longer experience isolated crises, but overlapping pressures: climate risks, energy and price volatility, supply chain disruptions, pandemics, geopolitical tensions, social fragmentation, and institutional overload.
        </p>
        <p class="hero__intro" style="margin-top:1.2rem">
          Many urban settings are already operating under more difficult conditions: higher volatility, fewer buffers, and growing interdependence. What matters now is whether neighborhoods and the systems around them can register changing conditions, coordinate across differences, and continue functioning under stress.
        </p>
        <p class="hero__intro--bold">
          medulla is a shared resilience node designed to sense change early, connect different actors, and strengthen the practical capacities that keep essential urban functions alive.
        </p>
        <p class="hero__invite">
          If this resonates with your work, we invite you to take part in shaping medulla as an active field station for urban readiness and collaboration.
        </p>
      </div>
    </div>

    <div class="hero__bottom fade-in" style="transition-delay:0.3s">
      <div class="hero__meta">
        <strong>Location</strong>
        Dresdener Str. 113b<br />Berlin
      </div>
      <div class="hero__meta">
        <strong>Contribution</strong>
        from 500 EUR / desk<br />depending on involvement
      </div>
      <div class="hero__meta">
        <strong>Dates</strong>
        Move-in: 1 May 2026<br />
        Deadline: 20 March 2026<br />
        Response by: 2 April 2026
      </div>
      <a href="#apply" class="hero__cta">apply →</a>
    </div>
  </div>
</section>
```

**Step 2: Verify in browser**

Expected: dark full-viewport hero with large "medulla" wordmark, two-column text layout, bottom metadata bar with red "apply →".

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add hero section"
```

---

### Task 4: medulla grid section HTML

**Files:**
- Modify: `index.html` (medulla section)

**Step 1: Replace empty `<section id="medulla">` with full content**

```html
<section id="medulla" class="section section--light">
  <div class="container">
    <div class="grid-section__header">
      <span class="section-label">medulla</span>
    </div>
    <div class="card-grid">

      <div class="card fade-in">
        <h3>purpose</h3>
        <p>medulla contributes to the living core of urban readiness: a place where signals are sensed, knowledge is translated, and actors coordinate to strengthen the robustness of everyday urban systems.</p>
      </div>

      <div class="card fade-in" style="transition-delay:0.1s">
        <h3>function</h3>
        <p>medulla is not a coworking space. It is a place where capacities, relationships, and working infrastructures are built that strengthen what cities need in order to remain responsive under pressure: <strong>shared inquiry, working sessions, public formats, collective learning, and room for experimentation.</strong></p>
      </div>

      <div class="card fade-in" style="transition-delay:0.2s">
        <h3>architecture</h3>
        <p>medulla is a two-floor space in a wooden Neubau at Dresdener Str. 113b: with an upper floor for focused work and a lower floor for exchange, gathering, and programmable formats. Situated within a shared courtyard structure, medulla is connected to a garden and outdoor area that members will share, care for, and steward together.</p>
      </div>

      <div class="card fade-in" style="transition-delay:0.3s">
        <h3>members</h3>
        <p>medulla members are not users but contributors and stewards. Members may be individuals or organisations. Participation may begin with desks and core contributions, and evolve into additional models once rent and maintenance costs are covered.</p>
      </div>

      <div class="card fade-in" style="transition-delay:0.4s">
        <h3>convergence</h3>
        <p>medulla brings together a mix of systems and practices – governance, technology, culture, business, finance, and civic initiatives – without collapsing them into a single language.</p>
      </div>

      <div class="card fade-in" style="transition-delay:0.5s">
        <h3>planetary</h3>
        <p>medulla understands itself as part of a wider ecosystem of initiatives working on long-term societal robustness and adaptive capacity, connected to similar demonstrators across cities and regions.</p>
      </div>

    </div>
  </div>
</section>
```

**Step 2: Verify in browser**

Expected: three-column card grid with serif headings and muted body text. Thin top border on each card. Correct spacing and alignment.

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add medulla grid section"
```

---

### Task 5: resilience grid section HTML

**Files:**
- Modify: `index.html` (resilience section)

**Step 1: Replace empty `<section id="resilience">` with full content**

```html
<section id="resilience" class="section section--warm">
  <div class="container">
    <div class="grid-section__header">
      <span class="section-label">resilience</span>
    </div>
    <div class="card-grid">

      <div class="card fade-in">
        <h3>urban</h3>
        <p>Urban robustness is the ability of a city to keep essential functions going under pressure. Urban resilience builds on that capacity: it is what allows a city to adapt, reorganise, and continue as conditions change.</p>
      </div>

      <div class="card fade-in" style="transition-delay:0.1s">
        <h3>infrastructural</h3>
        <p>This begins with the systems people rely on every day: energy, water, mobility, communication, housing, food, and the built environment. When these systems remain dependable under stress, they create the basis on which broader resilience can emerge.</p>
      </div>

      <div class="card fade-in" style="transition-delay:0.2s">
        <h3>technological</h3>
        <p>Digital systems matter, but readiness does not arise from technology alone. Robustness depends on whether tools, people, and institutions can work together under real conditions; resilience depends on whether those arrangements can evolve as needs and pressures shift.</p>
      </div>

      <div class="card fade-in" style="transition-delay:0.3s">
        <h3>creative</h3>
        <p>Adaptation requires imagination. Robust systems create the room to think beyond immediate response; resilient systems use that room to reframe problems, prototype responses, and make new forms of action possible.</p>
      </div>

      <div class="card fade-in" style="transition-delay:0.4s">
        <h3>economic</h3>
        <p>Robustness has an economic dimension. Cities need ways of financing continuity, maintenance, and shared capacity under pressure. Resilience begins when those same investments also enable learning, adjustment, and long-term transformation before disruption becomes more costly than preparation.</p>
      </div>

      <div class="card fade-in" style="transition-delay:0.5s">
        <h3>organisational</h3>
        <p>Readiness does not sit in any one institution. Robustness grows through coordination, distributed responsibility, and the ability to stay operational across organisational and sectoral boundaries. Resilience grows when those same relationships are able to adjust, deepen, and reconfigure as conditions change.</p>
      </div>

    </div>
  </div>
</section>
```

**Step 2: Verify in browser**

Expected: same three-column grid on a slightly warmer background. Visual continuity with the medulla section.

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add resilience grid section"
```

---

### Task 6: Apply section and footer HTML

**Files:**
- Modify: `index.html` (apply section + footer)

**Step 1: Replace empty `<section id="apply">` with full content**

```html
<section id="apply" class="section section--dark">
  <div class="container">
    <div class="apply__wordmark">apply</div>
    <div class="apply__body">
      <p class="apply__invite">
        We are looking for mature people and organisations who want to contribute to this deliberately: not simply by occupying space, but by helping shape a setting for practice, exchange, and shared capacity.
      </p>
      <div class="apply__details">
        <div class="apply__meta">
          Application deadline: 20 March 2026<br />
          Response by: 2 April 2026<br />
          Move-in: 1 May 2026
        </div>
        <!-- data-tf-popup will be set in Task 7 -->
        <button class="btn" id="apply-btn">Begin application →</button>
      </div>
    </div>
  </div>
</section>
```

**Step 2: Replace empty `<footer>` with full content**

```html
<footer class="footer">
  <div class="container">
    <div class="footer__inner">
      <div class="footer__logos">
        <a href="https://www.politicsfortomorrow.eu/" class="footer__logo" target="_blank" rel="noopener">Politics for Tomorrow</a>
        <span class="footer__logo-sep">/</span>
        <a href="https://www.nextlearning.earth/" class="footer__logo" target="_blank" rel="noopener">nextLearning e.V.</a>
        <span class="footer__logo-sep">/</span>
        <a href="https://darkmatterlabs.org/" class="footer__logo" target="_blank" rel="noopener">Dark Matter Labs</a>
      </div>
      <div class="footer__address">
        Dresdener Str. 113b<br />
        Berlin<br />
        © medulla 2026
      </div>
    </div>
  </div>
</footer>
```

**Step 3: Verify in browser**

Expected: dark apply section with large red "apply" wordmark, italic invite text, button, and footer with partner names. Full page now renders end-to-end.

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add apply section and footer"
```

---

### Task 7: JavaScript — scroll animations + Typeform

**Files:**
- Modify: `scripts/main.js`
- Modify: `index.html` (add Typeform script tag before closing `</body>`)

**Step 1: Write `scripts/main.js`**

```js
// Scroll-based fade-in using IntersectionObserver
const fadeElements = document.querySelectorAll('.fade-in');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);

fadeElements.forEach((el) => observer.observe(el));

// Typeform popup trigger
// NOTE: Replace 'YOUR_TYPEFORM_ID' with your actual Typeform form ID
// The form ID is the string after /to/ in your Typeform share URL
// e.g. https://yourorg.typeform.com/to/abc12345 → ID is abc12345
const applyBtn = document.getElementById('apply-btn');
if (applyBtn) {
  applyBtn.addEventListener('click', () => {
    if (window.tf) {
      window.tf.createPopup('YOUR_TYPEFORM_ID', {
        mode: 'popup',
        autoClose: 3000,
      }).open();
    }
  });
}
```

**Step 2: Add Typeform embed script to `index.html`**

Add this line just before the closing `</body>` tag, after the `main.js` script tag:

```html
<script src="//embed.typeform.com/next/embed.js"></script>
```

**Step 3: Verify scroll animations in browser**

Scroll the page. Expected: each card and section element fades in from slightly below as it enters the viewport.

**Step 4: Note for Typeform setup**

The Typeform popup won't work until:
1. You create the Typeform (see Task 8)
2. You replace `'YOUR_TYPEFORM_ID'` in `main.js` with the real ID

**Step 5: Commit**

```bash
git add scripts/main.js index.html
git commit -m "feat: add scroll animations and Typeform popup trigger"
```

---

### Task 8: Set up Typeform (manual step)

**This is a manual task — no code to write.**

**Step 1: Log into your Typeform account**

Go to typeform.com and sign in.

**Step 2: Create a new form titled "medulla — Application"**

Add these questions in order. Use Typeform's "Long Text" type unless specified:

| # | Label | Type | Required |
|---|-------|------|----------|
| 1 | Name / Organisation | Short Text | Yes |
| 2 | WHO — What kind of work are you currently engaged in? | Long Text | Yes |
| 3 | CONNECTION — How did you hear about medulla? Have we met before? | Long Text | No |
| 4 | CURRENT CHALLENGE — A concrete challenge in your work related to urban systems | Long Text | Yes |
| 5 | WHY — Why interested in medulla? What role do you imagine it playing? | Long Text | Yes |
| 6 | CONTRIBUTION — How do you imagine contributing? | Long Text | Yes |
| 7 | DESKS — How many desks would you like to reserve? | Number | Yes |
| 8 | TIMING — When would you move in? Permanent or temporary? | Long Text | Yes |
| 9 | FINANCIAL CONTRIBUTION — Baseline 500 EUR/desk. Propose an alternative if needed. | Long Text | No |
| 10 | USE OF SPACE — How do you imagine using the space? | Long Text | Yes |

**Step 3: Configure the "Thank You" screen**

Set the thank-you message to:

> We received your application!
>
> Thank you for your interest in shaping medulla as a shared place for practice, exchange, and urban readiness. We appreciate you taking the time to tell us about your work.
>
> All applications will be reviewed and we will come back to you by 2 April 2026 at the latest.

**Step 4: Set up integrations**

In Typeform → Connect → Integrations:
- **Email notifications:** Add your team email address for new submission alerts
- **Google Sheets:** Connect your Google account and select/create the target spreadsheet

**Step 5: Style the Typeform**

In the Design panel:
- Background: `#111111`
- Buttons: `#B83225`
- Font: DM Sans (or closest available in Typeform)
- Text: `#F5F3EE`

**Step 6: Get the form ID**

From the Share panel, copy the form URL. The ID is the part after `/to/`:
- URL: `https://yourorg.typeform.com/to/abc12345`
- ID: `abc12345`

**Step 7: Update `scripts/main.js`**

Replace `'YOUR_TYPEFORM_ID'` with your actual ID:

```js
window.tf.createPopup('abc12345', {
```

**Step 8: Commit**

```bash
git add scripts/main.js
git commit -m "feat: connect Typeform form ID"
```

---

### Task 9: Final polish and cross-browser verification

**Files:**
- Modify: `styles/main.css` (minor tweaks if needed)
- Modify: `index.html` (meta tags)

**Step 1: Add Open Graph meta tags to `index.html` `<head>`**

```html
<meta property="og:title" content="medulla — Berlin" />
<meta property="og:description" content="A shared resilience node for urban readiness and collaboration. Dresdener Str. 113b, Berlin." />
<meta property="og:type" content="website" />
<meta name="theme-color" content="#111111" />
```

**Step 2: Verify checklist**

- [ ] Desktop: hero fills viewport, two-column layout looks correct
- [ ] Tablet (768px): hero collapses to single column
- [ ] Mobile (375px): cards stack to single column, all text readable
- [ ] Scroll animations trigger correctly on all sections
- [ ] "apply →" anchor link scrolls smoothly to apply section
- [ ] "Begin application →" button triggers Typeform popup
- [ ] Footer partner links open in new tab
- [ ] No console errors

**Step 3: Commit**

```bash
git add index.html styles/main.css
git commit -m "feat: add OG meta tags and final polish"
```

---

### Task 10: Deploy to Netlify

**This is a manual step.**

**Option A — Drag and drop (fastest):**
1. Go to app.netlify.com → "Add new site" → "Deploy manually"
2. Drag the entire `medulla/` project folder into the upload zone
3. Netlify assigns a URL immediately (e.g. `random-name.netlify.app`)
4. In Site settings → Domain management → add your custom domain if you have one

**Option B — Git deploy:**
1. Push this repo to GitHub: `gh repo create medulla --public && git push -u origin main`
2. In Netlify → "Add new site" → "Import an existing project" → connect GitHub repo
3. Build command: (leave empty — static site)
4. Publish directory: `.` (root)

**Step 2: Verify live site**

- Open the Netlify URL in an incognito window
- Run through the complete verification checklist from Task 9
- Submit a test application via Typeform and verify:
  - Email notification received
  - Row appears in Google Sheet

---

## Summary

| Task | Description | Type |
|------|-------------|------|
| 1 | Project scaffold | Code |
| 2 | CSS design system | Code |
| 3 | Hero section | Code |
| 4 | medulla grid section | Code |
| 5 | resilience grid section | Code |
| 6 | Apply section + footer | Code |
| 7 | JS animations + Typeform trigger | Code |
| 8 | Typeform setup + integrations | Manual |
| 9 | Polish + cross-browser check | Code |
| 10 | Netlify deployment | Manual |
