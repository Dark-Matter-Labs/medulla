// ── Scroll-driven 3D card-deck (Medulla), smoothed with Lenis ───────────────
// Cards rest in a bottom-right staircase. On scroll each card lifts and PARKS
// at the top as a thin cascading stack (it stays visible — it doesn't fly off
// screen). Card 0 (intro) parks first; card 8 (events) is the base and stays.

const cards  = Array.from(document.querySelectorAll('.card'));
const driver = document.querySelector('.scroll-driver');
const LAST   = 8; // data-card index of the base (Events) card

// How long each card dwells before lifting (fraction of its viewport section).
const DWELL_RATIO = 0.12;

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function deckActive() {
  return !reduceMotion && window.matchMedia('(min-width: 1025px)').matches;
}

// ── Progress bar ────────────────────────────────────────────────────────────
const progressEl = document.createElement('div');
progressEl.className = 'scroll-progress';
progressEl.innerHTML = '<div class="scroll-progress__bar"></div>';
document.body.appendChild(progressEl);
const progressBar = progressEl.querySelector('.scroll-progress__bar');

// ── Easing + geometry helpers ───────────────────────────────────────────────
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
// Matches CSS: --vstep: clamp(30px, 4.44vh, 48px)
function vstep() { return Math.min(48, Math.max(30, 0.0444 * window.innerHeight)); }
// Card's resting height (matches CSS height: 100% − (8−i)·vstep)
function restHeight(i) { return window.innerHeight - (8 - i) * vstep(); }
// Parked cards cascade by vstep/2 at the top. This matches each card's top
// padding (pt_k = (k+1)·vstep/2), so an active card's content always starts
// just below the parked stack — they never overlap.
function parkStep() { return vstep() / 2; }
// translateY that moves card i from its rest spot to its parked spot at the top
function parkY(i) { return (i + 1) * parkStep() - restHeight(i); }

// ── Core render ───────────────────────────────────────────────────────────────
function render() {
  if (!deckActive()) {
    cards.forEach((c) => { if (c.style.transform) c.style.transform = ''; });
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (max > 0 ? Math.min((window.scrollY / max) * 100, 100) : 0) + '%';
    return;
  }

  const vh = window.innerHeight;
  const y  = lenis ? lenis.scroll : window.scrollY;

  cards.forEach((card) => {
    const i = parseInt(card.dataset.card, 10);
    if (i === LAST) { if (card.style.transform) card.style.transform = ''; return; }

    const animStart = i * vh + vh * DWELL_RATIO;
    const animEnd   = i * vh + vh;
    let p = 0;
    if (y > animStart) p = Math.min((y - animStart) / (animEnd - animStart), 1);

    const ty = easeInOutCubic(p) * parkY(i); // parkY < 0 → lifts toward the top
    card.style.transform = ty ? `translateY(${ty}px)` : '';
  });

  const max = (driver ? driver.scrollHeight : document.body.scrollHeight) - vh;
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
window.addEventListener('resize', () => { if (lenis) lenis.resize(); render(); }, { passive: true });

// ── Click a peeking card to glide to it ─────────────────────────────────────
// Card i is the active card when scroll ≈ i × vh. Clicking another card glides
// the deck there. Real links (the Luma event links) are left to behave normally.
function scrollToCard(index) {
  if (!deckActive()) return;
  const targetY = index * window.innerHeight;
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
render();
