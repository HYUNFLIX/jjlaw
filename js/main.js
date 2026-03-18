/**
 * 구정진 변호사 법률사무소 - Main JS
 * Handles: navigation, scroll animations, counters, mobile menu
 */

(function () {
  'use strict';

  /* ============================================================
     1. NAVIGATION — transparency + active link
  ============================================================ */
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  const sections = Array.from(document.querySelectorAll('section[id]'));

  function updateNav() {
    const scrollY = window.scrollY;

    // Scrolled state
    navbar.classList.toggle('scrolled', scrollY > 80);

    // Active nav link
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 120;
      if (scrollY >= top) current = section.id;
    });

    navLinks.forEach(link => {
      const href = link.getAttribute('href').slice(1);
      link.classList.toggle('active', href === current);
    });
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav(); // run on load

  /* ============================================================
     2. MOBILE HAMBURGER MENU
  ============================================================ */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  function toggleMenu(open) {
    hamburger.classList.toggle('open', open);
    mobileMenu.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    hamburger.setAttribute('aria-expanded', String(open));
  }

  hamburger.addEventListener('click', () => {
    toggleMenu(!mobileMenu.classList.contains('open'));
  });

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  // Close on ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      toggleMenu(false);
    }
  });

  /* ============================================================
     3. SCROLL REVEAL — IntersectionObserver
  ============================================================ */
  const revealClasses = ['.reveal', '.reveal-left', '.reveal-right'];
  const revealEls = document.querySelectorAll(revealClasses.join(', '));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Respect CSS transition-delay from inline style
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealEls.forEach(el => revealObserver.observe(el));

  /* ============================================================
     4. COUNTER ANIMATION
  ============================================================ */
  const counterEls = document.querySelectorAll('.stat-number[data-target]');

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counterEls.forEach(el => counterObserver.observe(el));

  /* ============================================================
     5. SCROLL INDICATOR — hide on scroll
  ============================================================ */
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator) {
    window.addEventListener('scroll', () => {
      scrollIndicator.style.opacity = window.scrollY > 60 ? '0' : '';
    }, { passive: true });
  }

  /* ============================================================
     6. PRACTICE CARD SUBTLE 3D TILT
  ============================================================ */
  const cards = document.querySelectorAll('.practice-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;  // -0.5 to 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-8px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ============================================================
     7. SMOOTH SCROLL for all anchor links
  ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ============================================================
     8. CONTACT FORM — basic validation + feedback
  ============================================================ */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', e => {
      const name = form.querySelector('#name').value.trim();
      const phone = form.querySelector('#phone').value.trim();
      const message = form.querySelector('#message').value.trim();

      if (!name || !phone || !message) {
        e.preventDefault();
        alert('이름, 연락처, 문의 내용은 필수 항목입니다.');
        return;
      }

      // mailto fallback: the default browser mailto behavior fires
      // Optional: show a brief confirmation before navigating
    });
  }

})();
