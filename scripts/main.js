// ── Scroll-driven 3D card-deck (Medulla), smoothed with Lenis ───────────────
// Cards rest in a staircase. On scroll each card lifts and PARKS at the top as
// a thin cascading stack (it stays visible). Card 0 (intro) parks first; card 8
// (events) is the base and stays. Works at every width — CSS owns the geometry
// (card heights / steps), JS just measures it, so desktop and mobile share one
// engine. A static stacked layout is used under prefers-reduced-motion and on
// screens too short for the staircase (phones in landscape).

const cards  = Array.from(document.querySelectorAll('.card'));
const driver = document.querySelector('.scroll-driver');
const stage  = document.querySelector('.cards-stage');
const LAST   = 8; // data-card index of the base (Events) card

// How long each card dwells before lifting (fraction of its viewport section).
const DWELL_RATIO = 0.12;

// Copy fitting: shrink a card's body copy in small steps until it fits.
const FIT_MIN  = 0.8;
const FIT_STEP = 0.025;
const fitCards = cards.filter((c) => c.classList.contains('card--content') && !c.classList.contains('card--events'));

// Keep in sync with the static-layout @media rule in main.css.
const STATIC_QUERY = '(prefers-reduced-motion: reduce), (orientation: landscape) and (max-height: 500px)';
const staticMQ     = window.matchMedia(STATIC_QUERY);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function deckActive() { return !staticMQ.matches; }

// ── Progress bar ────────────────────────────────────────────────────────────
const progressEl = document.createElement('div');
progressEl.className = 'scroll-progress';
progressEl.innerHTML = '<div class="scroll-progress__bar"></div>';
document.body.appendChild(progressEl);
const progressBar = progressEl.querySelector('.scroll-progress__bar');

function setProgress(y, max) {
  const p = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
  progressBar.style.transform = `scaleX(${p})`;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── Copy fitting ──────────────────────────────────────────────────────────────
// The sans body copy can be taller than its card on small or short screens.
// Reset each card to full size, then step --fit down until nothing overflows
// the card's inner box (FIT_MIN is the floor; CSS clips anything beyond it).
function fitCopy() {
  fitCards.forEach((card) => {
    const inner = card.querySelector('.card__inner');
    card.style.removeProperty('--fit');
    if (!deckActive() || !inner) return;
    let fit = 1;
    while (inner.scrollHeight > inner.clientHeight + 1 && fit > FIT_MIN) {
      fit = Math.max(FIT_MIN, fit - FIT_STEP);
      card.style.setProperty('--fit', fit.toFixed(3));
    }
  });
}

// ── Measured geometry (read from CSS so it adapts to any breakpoint) ─────────
// H[i]   = card i's resting height (px), from its computed CSS height.
// PARK[i]= translateY that lifts card i from its rest spot to its parked strip.
// Parked cards cascade by vstep/2 — this matches each card's CSS top padding,
// so an active card's content always clears the parked stack.
// Scroll lengths are cached here too, so render() never reads layout per frame.
let H = [];
let PARK = [];
let sectionH = 0;
let maxScroll = 0;
function measure() {
  H = [];
  cards.forEach((c) => { H[parseInt(c.dataset.card, 10)] = parseFloat(getComputedStyle(c).height) || 0; });
  const vstep = (H[LAST] - H[LAST - 1]) || 0; // height delta between adjacent cards
  PARK = [];
  for (let i = 0; i <= LAST; i++) PARK[i] = (i + 1) * (vstep / 2) - H[i];

  // One scroll "section" per card, derived from the driver so it matches the
  // CSS (9 × viewport) on both desktop and mobile, regardless of vh/URL-bar drift.
  sectionH  = driver.scrollHeight / (LAST + 1);
  maxScroll = driver.scrollHeight - window.innerHeight;
}

// ── Core render ───────────────────────────────────────────────────────────────
function render() {
  const y = lenis ? lenis.scroll : window.scrollY;

  if (!deckActive()) {
    // static page height still changes as images/fonts land — read it live
    // (no transforms are written in this mode, so the read is cheap)
    setProgress(y, document.documentElement.scrollHeight - window.innerHeight);
    return;
  }

  cards.forEach((card) => {
    const i = parseInt(card.dataset.card, 10);
    if (i === LAST) return;

    const animStart = i * sectionH + sectionH * DWELL_RATIO;
    const animEnd   = i * sectionH + sectionH;
    let p = 0;
    if (y > animStart) p = Math.min((y - animStart) / (animEnd - animStart), 1);

    const ty = easeInOutCubic(p) * (PARK[i] || 0); // PARK < 0 → lifts toward the top
    const transform = ty ? `translateY(${ty}px)` : '';
    if (card.style.transform !== transform) card.style.transform = transform;
    // Promote only the card(s) mid-lift to their own GPU layer: smooth motion
    // without holding nine full-screen layers in memory (matters on iOS).
    const willChange = p > 0 && p < 1 ? 'transform' : '';
    if (card.style.willChange !== willChange) card.style.willChange = willChange;
  });

  setProgress(y, maxScroll);
}

// Clear inline deck styles when switching into the static layout.
function clearDeckStyles() {
  cards.forEach((c) => { c.style.transform = ''; c.style.willChange = ''; });
}

// ── Smooth scrolling (Lenis) ────────────────────────────────────────────────
let lenis = null;
if (!reduceMotion && typeof Lenis !== 'undefined') {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
  lenis.on('scroll', render);
  const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
} else {
  window.addEventListener('scroll', render, { passive: true });
}

// ── Relayout on viewport changes ────────────────────────────────────────────
// Mobile browsers fire resize as the URL bar shows/hides; the deck is sized in
// svh so nothing changes then — only refit when the stage really changed size.
let lastSize = '';
function relayout() {
  const size = `${window.innerWidth}x${stage.clientHeight}`;
  if (size !== lastSize) { lastSize = size; fitCopy(); }
  if (lenis) lenis.resize();
  measure();
  render();
}
let resizeTimer = 0;
window.addEventListener('resize', () => {
  measure();
  render();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(relayout, 120);
}, { passive: true });
window.addEventListener('orientationchange', () => { setTimeout(relayout, 200); });
staticMQ.addEventListener('change', () => {
  if (!deckActive()) clearDeckStyles();
  lastSize = '';
  relayout();
});

// ── Click a peeking card to glide to it ─────────────────────────────────────
function scrollToCard(index) {
  if (!deckActive()) return;
  const targetY = index * sectionH;
  if (lenis) lenis.scrollTo(targetY, { duration: 0.9, easing: easeInOutCubic });
  else window.scrollTo({ top: targetY, behavior: 'smooth' });
}

driver.addEventListener('click', (e) => {
  if (!deckActive()) return;
  if (e.target.closest('a')) return;                                  // real links work
  if (window.getSelection && String(window.getSelection())) return;   // ignore selection
  const card = e.target.closest('.card');
  if (card) scrollToCard(parseInt(card.dataset.card, 10));
});

// ── Events list: scroll internally, hand back to the deck at the edges ──────
// When the events list overflows it scrolls on its own; the moment it reaches
// its top or bottom, wheel input is released to Lenis so the deck keeps moving
// (no more getting "stuck" inside the list). Pointer/touch devices fall back to
// native overscroll chaining (see CSS).
const eventsList = document.querySelector('.card--events .events');
if (eventsList && lenis) {
  eventsList.addEventListener('wheel', (e) => {
    if (eventsList.scrollHeight <= eventsList.clientHeight + 1) return; // not scrollable → deck scrolls
    const atTop    = eventsList.scrollTop <= 0;
    const atBottom = eventsList.scrollTop + eventsList.clientHeight >= eventsList.scrollHeight - 1;
    const canScrollInner = (e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop);
    // Inner can still move in this direction → keep it native, stop the deck.
    // At the edge → do nothing so the wheel reaches Lenis and the deck advances.
    if (canScrollInner) e.stopPropagation();
  }, { passive: true });
}

// ── Init ────────────────────────────────────────────────────────────────────
relayout();
// web fonts change line breaks; refit and re-measure once they're ready
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => { lastSize = ''; relayout(); });
}
