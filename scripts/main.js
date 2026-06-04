// ── Scroll-driven 3D card-deck (Medulla) ────────────────────────────────
// Cards are anchored top-right in a 48px staircase. On scroll, each card
// peels upward to reveal the one behind it. Card 0 (intro) peels first;
// card 8 (events) is the base layer and never moves.

const cards     = Array.from(document.querySelectorAll('.card'));
const driver    = document.querySelector('.scroll-driver');
const NUM_CARDS = 9;
const LAST      = NUM_CARDS - 1; // index 8 = base (Events)

// Card dwells for the first part of its section, then peels across the rest.
const DWELL_RATIO = 0.25;
// Lerp factor — smooth, silky scroll tracking (~250ms settle at 60fps).
const LERP_FACTOR = 0.12;

let smoothY   = window.scrollY;
let animating = false;

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function deckActive() {
  return !reduceMotion && window.matchMedia('(min-width: 1025px)').matches;
}

// ── Progress bar ──────────────────────────────────────────────────────────
const progressEl = document.createElement('div');
progressEl.className = 'scroll-progress';
progressEl.innerHTML = '<div class="scroll-progress__bar"></div>';
document.body.appendChild(progressEl);
const progressBar = progressEl.querySelector('.scroll-progress__bar');

// Smooth ease-in-out: slow lift, quick middle, soft landing.
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── Core render ───────────────────────────────────────────────────────────
function render() {
  const vh = window.innerHeight;

  if (!deckActive()) {
    // Stacked fallback / reduced motion: no peel transforms.
    cards.forEach((card) => { if (card.style.transform) card.style.transform = ''; });
    const maxScroll0 = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (maxScroll0 > 0 ? Math.min((window.scrollY / maxScroll0) * 100, 100) : 0) + '%';
    return;
  }

  cards.forEach((card) => {
    const i = parseInt(card.dataset.card, 10); // 0 = front, 8 = base
    const sectionStart = i * vh;
    const animStart    = sectionStart + vh * DWELL_RATIO;
    const animEnd      = sectionStart + vh;

    let progress = 0;
    if (smoothY > animStart) {
      progress = Math.min((smoothY - animStart) / (animEnd - animStart), 1);
    }
    if (i === LAST) progress = 0; // base layer never peels

    const ty = -easeInOutCubic(progress) * vh; // peel up by one viewport
    card.style.transform = ty ? `translateY(${ty}px)` : '';
  });

  const maxScroll = (driver ? driver.scrollHeight : document.body.scrollHeight) - window.innerHeight;
  const pct = maxScroll > 0 ? Math.min((smoothY / maxScroll) * 100, 100) : 0;
  progressBar.style.width = pct + '%';
}

// ── Animation loop ──────────────────────────────────────────────────────────
function tick() {
  const target = window.scrollY;
  const delta  = target - smoothY;

  if (Math.abs(delta) < 0.1) {
    smoothY = target;
    animating = false;
    render();
    return;
  }
  smoothY += delta * LERP_FACTOR;
  render();
  requestAnimationFrame(tick);
}

function scheduleUpdate() {
  if (!animating) { animating = true; requestAnimationFrame(tick); }
}

window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', () => { smoothY = window.scrollY; render(); }, { passive: true });

// ── Init ────────────────────────────────────────────────────────────────────
render();
