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

// Typeform popup is triggered via data-tf-popup attribute on the button.
// The embed script (embed.typeform.com/next/embed.js) handles it automatically.
