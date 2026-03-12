// ─── Active nav highlighting ──────────────────────────────────────────
const navLinks = document.querySelectorAll('.nav-link');
const tracked  = document.querySelectorAll('[data-section]');

// Map data-section value → nav href
const sectionNavMap = {
  medulla:    '#medulla',
  membership: '#membership',
  space:      '#space',
  apply:      '#apply-bottom',
};

function setActive(sectionKey) {
  const target = sectionNavMap[sectionKey];
  navLinks.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === target);
  });
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const key = entry.target.dataset.section;
        if (key) setActive(key);
      }
    });
  },
  { threshold: 0.25, rootMargin: '-10% 0px -60% 0px' }
);

tracked.forEach((el) => sectionObserver.observe(el));

// Set initial active state
setActive('medulla');

// ─── Typeform: "Join the network" buttons ────────────────────────────
// TODO: Replace 'JOIN_TYPEFORM_ID' with your actual Typeform form ID
const JOIN_ID = 'HjPU2Imj';

['btn-network-top', 'btn-network-bottom'].forEach((id) => {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener('click', () => {
      if (window.tf) window.tf.createPopup(JOIN_ID, { mode: 'popup', autoClose: 3000 }).open();
    });
  }
});

// ─── Typeform: "Support the project" buttons ─────────────────────────
// TODO: Replace 'SUPPORT_TYPEFORM_ID' with your actual Typeform form ID
const SUPPORT_ID = 'mVve4V2y';

['btn-support-top', 'btn-support-bottom'].forEach((id) => {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener('click', () => {
      if (window.tf) window.tf.createPopup(SUPPORT_ID, { mode: 'popup', autoClose: 3000 }).open();
    });
  }
});
