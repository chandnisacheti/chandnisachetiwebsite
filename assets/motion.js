// GSAP motion: hero entrance and pillar titles sliding in on scroll.
(function () {
  if (!window.gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);
  var lines = document.querySelectorAll('.hero-h > span');
  if (lines.length) {
    gsap.from(lines, { yPercent: 60, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12, delay: 0.1 });
    gsap.from('.hero-sub', { y: 16, opacity: 0, duration: 0.9, ease: 'power2.out', delay: 0.55 });
  }
  gsap.utils.toArray('.pillar-name').forEach(function (el) {
    gsap.from(el, { x: -40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  gsap.utils.toArray('.sp-h, .po-h').forEach(function (el) {
    gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.1 });
  });
})();
