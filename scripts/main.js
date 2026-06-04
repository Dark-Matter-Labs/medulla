// ── Scroll-driven 3D card-deck (Medulla), smoothed with Lenis ───────────────
// Cards rest in a staircase. On scroll each card lifts and PARKS at the top as
// a thin cascading stack (it stays visible). Card 0 (intro) parks first; card 8
// (events) is the base and stays. Works at every width — CSS owns the geometry
// (card heights / steps), JS just measures it, so desktop and mobile share one
// engine. A static stacked layout is used only under prefers-reduced-motion.

const cards  = Array.from(document.querySelectorAll('.card'));
const driver = document.querySelector('.scroll-driver');
const LAST   = 8; // data-card index of the base (Events) card

// How long each card dwells before lifting (fraction of its viewport section).
const DWELL_RATIO = 0.12;

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function deckActive() { return !reduceMotion; }

// ── Progress bar ────────────────────────────────────────────────────────────
const progressEl = document.createElement('div');
progressEl.className = 'scroll-progress';
progressEl.innerHTML = '<div class="scroll-progress__bar"></div>';
document.body.appendChild(progressEl);
const progressBar = progressEl.querySelector('.scroll-progress__bar');

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── Measured geometry (read from CSS so it adapts to any breakpoint) ─────────
// H[i]   = card i's resting height (px), from its computed CSS height.
// PARK[i]= translateY that lifts card i from its rest spot to its parked strip.
// Parked cards cascade by vstep/2 — this matches each card's CSS top padding,
// so an active card's content always clears the parked stack.
let H = [];
let PARK = [];
function measure() {
  H = [];
  cards.forEach((c) => { H[parseInt(c.dataset.card, 10)] = parseFloat(getComputedStyle(c).height) || 0; });
  const vstep = (H[LAST] - H[LAST - 1]) || 0; // height delta between adjacent cards
  PARK = [];
  for (let i = 0; i <= LAST; i++) PARK[i] = (i + 1) * (vstep / 2) - H[i];
}

// ── Core render ───────────────────────────────────────────────────────────────
function render() {
  if (!deckActive()) {
    cards.forEach((c) => { if (c.style.transform) c.style.transform = ''; });
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (max > 0 ? Math.min((window.scrollY / max) * 100, 100) : 0) + '%';
    return;
  }

  const y = lenis ? lenis.scroll : window.scrollY;
  // One scroll "section" per card, derived from the driver so it matches the
  // CSS (9 × viewport) on both desktop and mobile, regardless of vh/URL-bar drift.
  const sectionH = driver.scrollHeight / (LAST + 1);

  cards.forEach((card) => {
    const i = parseInt(card.dataset.card, 10);
    if (i === LAST) { if (card.style.transform) card.style.transform = ''; return; }

    const animStart = i * sectionH + sectionH * DWELL_RATIO;
    const animEnd   = i * sectionH + sectionH;
    let p = 0;
    if (y > animStart) p = Math.min((y - animStart) / (animEnd - animStart), 1);

    const ty = easeInOutCubic(p) * (PARK[i] || 0); // PARK < 0 → lifts toward the top
    card.style.transform = ty ? `translateY(${ty}px)` : '';
  });

  const max = driver.scrollHeight - window.innerHeight;
  progressBar.style.width = (max > 0 ? Math.min((y / max) * 100, 100) : 0) + '%';
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
window.addEventListener('resize', () => {
  if (lenis) lenis.resize();
  measure();
  render();
}, { passive: true });
// Mobile orientation / URL-bar changes alter card heights — re-measure.
window.addEventListener('orientationchange', () => { setTimeout(() => { measure(); render(); }, 200); });

// ── Click a peeking card to glide to it ─────────────────────────────────────
function scrollToCard(index) {
  if (!deckActive()) return;
  const targetY = index * (driver.scrollHeight / (LAST + 1));
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

// ── Init ────────────────────────────────────────────────────────────────────
measure();
render();
// fonts can shift layout slightly; re-measure once they're ready
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); render(); });
