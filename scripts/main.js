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
const applyBtn = document.getElementById('apply-btn');
if (applyBtn) {
  applyBtn.addEventListener('click', () => {
    if (window.tf) {
      window.tf.createPopup('aBO8faXO', {
        mode: 'popup',
        autoClose: 3000,
      }).open();
    }
  });
}
