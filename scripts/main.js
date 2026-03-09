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
