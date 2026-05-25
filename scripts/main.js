// ── Scroll-driven stacked card experience ───────────────────────────────

const cards     = Array.from(document.querySelectorAll('.card'));
const driver    = document.querySelector('.scroll-driver');
const NUM_CARDS = cards.length;

// CSS token values — must match :root in main.css
const BASE_H = 80;   // --base-h
const TAB_H  = 44;   // --tab-h

// How much of each scroll section the card dwells before peeling.
// 0.35 → card starts moving sooner, giving 65% of the section for the
// animation (vs old 40%) — more scroll distance = smoother feel.
const DWELL_RATIO = 0.35;

// Lerp factor for smooth scrolling (0–1).
// 0.12 settles in ~250 ms at 60 fps: responsive but silky.
const LERP_FACTOR = 0.12;

let smoothY   = window.scrollY;  // lerp-tracked position
let animating = false;           // rAF loop running?

// ── Progress bar ──────────────────────────────────────────────────────────
const progressEl = document.createElement('div');
progressEl.className = 'scroll-progress';
progressEl.innerHTML = '<div class="scroll-progress__bar"></div>';
document.body.appendChild(progressEl);
const progressBar = progressEl.querySelector('.scroll-progress__bar');

// ── Helpers ───────────────────────────────────────────────────────────────
function cardHeight(i) {
  return window.innerHeight - BASE_H - (NUM_CARDS - 1 - i) * TAB_H;
}

// Smooth ease-in-out: slow start → fast middle → soft landing.
// Matches how a physical card feels when lifted off a stack.
function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── Core render ───────────────────────────────────────────────────────────
function render() {
  const vh = window.innerHeight;

  cards.forEach((card, i) => {
    const sectionStart = i * vh;
    const animStart    = sectionStart + vh * DWELL_RATIO;
    const animEnd      = sectionStart + vh;

    let progress = 0;
    if (smoothY > animStart) {
      progress = Math.min((smoothY - animStart) / (animEnd - animStart), 1);
    }

    // Last card anchors the final state — never slides away
    if (i === NUM_CARDS - 1) progress = 0;

    const ty = -easeInOutCubic(progress) * cardHeight(i);
    card.style.transform = `translateY(${ty}px)`;
  });

  // Progress bar
  const maxScroll = (driver ? driver.scrollHeight : document.body.scrollHeight)
                    - window.innerHeight;
  const pct = maxScroll > 0
    ? Math.min((smoothY / maxScroll) * 100, 100)
    : 0;
  progressBar.style.width = pct + '%';
}

// ── Animation loop ────────────────────────────────────────────────────────
// Lerps smoothY toward the real scroll position each frame, producing
// buttery eased motion without any CSS transition lag on the transforms.
function tick() {
  const target = window.scrollY;
  const delta  = target - smoothY;

  if (Math.abs(delta) < 0.1) {
    // Close enough — snap to target and stop the loop
    smoothY   = target;
    animating = false;
    render();
    return;
  }

  smoothY += delta * LERP_FACTOR;
  render();
  requestAnimationFrame(tick);
}

function scheduleUpdate() {
  if (!animating) {
    animating = true;
    requestAnimationFrame(tick);
  }
}

window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', () => {
  // On resize, snap immediately — no lerp needed
  smoothY = window.scrollY;
  render();
}, { passive: true });

// ── Typeform: Join the network ────────────────────────────────────────────
const btnNetwork = document.getElementById('btn-network');
if (btnNetwork) {
  btnNetwork.addEventListener('click', () => {
    if (window.tf) window.tf.createPopup('HjPU2Imj', { mode: 'popup', autoClose: 3000 }).open();
  });
}

// ── Typeform: Support the project ─────────────────────────────────────────
const btnSupport = document.getElementById('btn-support');
if (btnSupport) {
  btnSupport.addEventListener('click', () => {
    if (window.tf) window.tf.createPopup('mVve4V2y', { mode: 'popup', autoClose: 3000 }).open();
  });
}

// ── Reduced motion: static layout, no animation ───────────────────────────
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  cards.forEach(card => {
    card.style.transform  = '';
    card.style.willChange = 'auto';
  });
} else {
  render();
}
