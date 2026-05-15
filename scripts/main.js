// ── Scroll-driven stacked card experience ───────────────────────────────

const cards     = Array.from(document.querySelectorAll('.card'));
const navItems  = Array.from(document.querySelectorAll('.side-nav__item'));
const driver    = document.querySelector('.scroll-driver');
const NUM_CARDS = cards.length;

// Each card owns 1 viewport-height of scroll space.
// Card stays static for the first 60% of its section,
// then peels upward across the final 40%.
const DWELL_RATIO = 0.6;

let ticking  = false;
let lastActive = -1;

function update() {
  const scrollY = window.scrollY;
  const vh      = window.innerHeight;

  cards.forEach((card, i) => {
    const sectionStart = i * vh;
    const animStart    = sectionStart + vh * DWELL_RATIO;
    const animEnd      = sectionStart + vh;

    let progress = 0;
    if (scrollY > animStart) {
      progress = Math.min((scrollY - animStart) / (animEnd - animStart), 1);
    }

    // Last card never slides away — anchors the final state
    if (i === NUM_CARDS - 1) progress = 0;

    const ty = -easeInCubic(progress) * 100;
    card.style.transform = `translateY(${ty}vh)`;
  });

  // Active nav item: whichever section's scroll range we're currently in
  const active = Math.min(Math.floor(scrollY / vh), NUM_CARDS - 1);
  if (active !== lastActive) {
    navItems.forEach((item, i) => {
      item.classList.toggle('is-active', i === active);
      item.setAttribute('aria-current', i === active ? 'true' : 'false');
    });
    lastActive = active;
  }

  ticking = false;
}

// Fast accelerating ease: feels like being pulled
function easeInCubic(t) {
  return t * t * t;
}

function scheduleUpdate() {
  if (!ticking) {
    requestAnimationFrame(update);
    ticking = true;
  }
}

window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate, { passive: true });

// ── Nav click: smooth scroll to start of that section ────────────────────
navItems.forEach((item, i) => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: i * window.innerHeight, behavior: 'smooth' });
  });
});

// ── Scroll progress bar ──────────────────────────────────────────────────
const progressEl = document.createElement('div');
progressEl.className = 'scroll-progress';
progressEl.innerHTML = '<div class="scroll-progress__bar"></div>';
document.body.appendChild(progressEl);
const progressBar = progressEl.querySelector('.scroll-progress__bar');

function updateProgress() {
  const maxScroll = (driver ? driver.scrollHeight : document.body.scrollHeight) - window.innerHeight;
  const pct = maxScroll > 0 ? Math.min((window.scrollY / maxScroll) * 100, 100) : 0;
  progressBar.style.width = pct + '%';
}

window.addEventListener('scroll', updateProgress, { passive: true });

// ── Typeform: Join the network ───────────────────────────────────────────
const btnNetwork = document.getElementById('btn-network');
if (btnNetwork) {
  btnNetwork.addEventListener('click', () => {
    if (window.tf) window.tf.createPopup('HjPU2Imj', { mode: 'popup', autoClose: 3000 }).open();
  });
}

// ── Typeform: Support the project ────────────────────────────────────────
const btnSupport = document.getElementById('btn-support');
if (btnSupport) {
  btnSupport.addEventListener('click', () => {
    if (window.tf) window.tf.createPopup('mVve4V2y', { mode: 'popup', autoClose: 3000 }).open();
  });
}

// ── Reduced motion: static layout, no scroll animation ──────────────────
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  cards.forEach(card => { card.style.transform = ''; card.style.willChange = 'auto'; });
  update(); // still run nav highlight
} else {
  update();
}
