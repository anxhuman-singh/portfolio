/**
 * ============================================================
 * PORTFOLIO SCRIPTS
 * All interactivity, animations, and UI logic
 * ============================================================
 */

'use strict';


/* ============================================================
   1. UTILITY HELPERS
============================================================ */

/**
 * Query shorthand
 * @param {string} selector
 * @param {Element} [scope=document]
 */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

/**
 * Throttle a callback to fire at most once per `delay` ms
 */
function throttle(fn, delay = 16) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn.apply(this, args);
    }
  };
}

/**
 * Clamp a value between min and max
 */
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}


/* ============================================================
   2. NAVBAR — BLUR ON SCROLL + ACTIVE LINK HIGHLIGHT
============================================================ */
(function initNavbar() {
  const navbar   = $('#navbar');
  const hamburger = $('#hamburger');
  const mobileNav = $('#mobile-nav');
  const navLinks  = $$('.navbar__link');
  const mobileLinks = $$('.navbar__mobile-link');

  if (!navbar) return;

  /* ── Blur effect on scroll ── */
  const onScroll = throttle(() => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    updateActiveLink();
  }, 50);

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Active link via IntersectionObserver ── */
  const sections = $$('section[id], header[id]');

  // Map section id → nav link
  function updateActiveLink() {
    let currentId = '';
    sections.forEach(section => {
      const top = section.getBoundingClientRect().top;
      if (top <= 100) currentId = section.id;
    });

    navLinks.forEach(link => {
      const href = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', href === currentId);
    });
  }

  window.addEventListener('scroll', throttle(updateActiveLink, 100), { passive: true });

  /* ── Hamburger toggle ── */
  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!isOpen));
    mobileNav.setAttribute('aria-hidden', String(isOpen));
    mobileNav.classList.toggle('open', !isOpen);
  });

  /* ── Close mobile nav on link click ── */
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('aria-hidden', 'true');
      mobileNav.classList.remove('open');
    });
  });

  /* ── Close mobile nav on outside click ── */
  document.addEventListener('click', e => {
    if (!navbar.contains(e.target) && mobileNav.classList.contains('open')) {
      hamburger.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('aria-hidden', 'true');
      mobileNav.classList.remove('open');
    }
  });
})();


/* ============================================================
   3. SMOOTH SCROLL — native + fallback offset for fixed nav
============================================================ */
(function initSmoothScroll() {
  const navHeight = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '64',
    10
  );

  document.addEventListener('click', e => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const targetId = anchor.getAttribute('href').slice(1);
    const target   = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  });
})();


/* ============================================================
   4. SCROLL REVEAL ANIMATION (IntersectionObserver)
============================================================ */
(function initReveal() {
  const revealEls = $$('.reveal');
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // fire once
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach(el => observer.observe(el));
})();


/* ============================================================
   5. HERO MOUSE-FOLLOW GLOW
============================================================ */
(function initHeroGlow() {
  const hero = $('.hero');
  const glow = $('#hero-glow');
  if (!hero || !glow) return;

  // Respect reduced-motion preference
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    glow.style.display = 'none';
    return;
  }

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;

  hero.addEventListener('mousemove', throttle(e => {
    const rect = hero.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
  }, 30));

  // Smooth lerp animation loop
  function animateGlow() {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    glow.style.left = `${currentX}px`;
    glow.style.top  = `${currentY}px`;
    requestAnimationFrame(animateGlow);
  }

  requestAnimationFrame(animateGlow);
})();


/* ============================================================
   6. ANIMATED COUNTERS
============================================================ */
(function initCounters() {
  const statNumbers = $$('.stat__number[data-target]');
  if (!statNumbers.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateCounter(el) {
    const target  = parseInt(el.getAttribute('data-target'), 10);
    const suffix  = el.getAttribute('data-suffix') || '';
    const duration = prefersReduced ? 0 : 1800; // ms
    const fps      = 60;
    const frames   = (duration / 1000) * fps;
    let frame = 0;

    if (prefersReduced) {
      el.textContent = target + suffix;
      return;
    }

    // Ease-out cubic
    function easeOut(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function tick() {
      frame++;
      const progress = easeOut(frame / frames);
      const value    = Math.round(progress * target);
      el.textContent = value + suffix;

      if (frame < frames) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target + suffix;
      }
    }

    requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  statNumbers.forEach(el => observer.observe(el));
})();


/* ============================================================
   7. CARD TILT EFFECT (3D perspective on hover)
============================================================ */
(function initCardTilt() {
  const tiltCards = $$('[data-tilt]');
  if (!tiltCards.length) return;

  // Skip on touch/reduced-motion devices
  const prefersReduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice   = 'ontouchstart' in window;
  if (prefersReduced || isTouchDevice) return;

  tiltCards.forEach(card => {
    card.style.perspective = '1000px';
    card.style.transformStyle = 'preserve-3d';

    card.addEventListener('mousemove', e => {
      const rect    = card.getBoundingClientRect();
      const centerX = rect.left + rect.width  / 2;
      const centerY = rect.top  + rect.height / 2;

      // Normalised (-1 to 1)
      const normX = (e.clientX - centerX) / (rect.width  / 2);
      const normY = (e.clientY - centerY) / (rect.height / 2);

      // Clamp rotation to ±6 deg
      const rotX = clamp(-normY * 6, -6, 6);
      const rotY = clamp( normX * 6, -6, 6);

      card.style.transform = `
        translateY(-4px)
        rotateX(${rotX}deg)
        rotateY(${rotY}deg)
      `;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
      card.style.transform  = 'translateY(0) rotateX(0) rotateY(0)';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'none';
    });
  });
})();


/* ============================================================
   8. CONTACT FORM — VALIDATION & SUBMIT SIMULATION
============================================================ */
(function initContactForm() {
  const sendBtn     = $('#send-btn');
  const successMsg  = $('#form-success');
  if (!sendBtn) return;

  const fields = {
    name:    $('#name'),
    email:   $('#email'),
    subject: $('#subject'),
    message: $('#message'),
  };

  /**
   * Simple inline validation
   * @param {HTMLInputElement|HTMLTextAreaElement} el
   * @param {boolean} valid
   */
  function setValidity(el, valid) {
    if (!el) return;
    const group = el.closest('.form-group');
    if (!group) return;

    // Remove old messages
    const existing = group.querySelector('.field-error');
    if (existing) existing.remove();

    if (!valid) {
      el.style.borderColor = '#F87171';
      el.style.boxShadow   = '0 0 0 3px rgba(248,113,113,0.15)';
      const msg = document.createElement('span');
      msg.className   = 'field-error';
      msg.style.cssText = 'font-size:12px;color:#F87171;margin-top:4px;display:block;font-family:var(--font-mono)';
      msg.textContent = el.type === 'email'
        ? 'Please enter a valid email address.'
        : 'This field is required.';
      group.appendChild(msg);
    } else {
      el.style.borderColor = '';
      el.style.boxShadow   = '';
    }
  }

  function validateEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  sendBtn.addEventListener('click', () => {
    let isValid = true;

    // Name
    if (!fields.name || !fields.name.value.trim()) {
      setValidity(fields.name, false);
      isValid = false;
    } else {
      setValidity(fields.name, true);
    }

    // Email
    if (!fields.email || !validateEmail(fields.email.value)) {
      setValidity(fields.email, false);
      isValid = false;
    } else {
      setValidity(fields.email, true);
    }

    // Subject
    if (!fields.subject || !fields.subject.value.trim()) {
      setValidity(fields.subject, false);
      isValid = false;
    } else {
      setValidity(fields.subject, true);
    }

    // Message
    if (!fields.message || !fields.message.value.trim()) {
      setValidity(fields.message, false);
      isValid = false;
    } else {
      setValidity(fields.message, true);
    }

    if (!isValid) return;

    // Simulate submission
    sendBtn.disabled    = true;
    sendBtn.textContent = 'Sending…';
    sendBtn.style.opacity = '0.7';

    setTimeout(() => {
      sendBtn.hidden          = true;
      successMsg.hidden       = false;

      // Reset field styles
      Object.values(fields).forEach(el => {
        if (el) {
          el.style.borderColor = '';
          el.style.boxShadow   = '';
          el.value = '';
        }
      });
    }, 1200);
  });

  // Live clear validation on input
  Object.values(fields).forEach(el => {
    if (!el) return;
    el.addEventListener('input', () => {
      el.style.borderColor = '';
      el.style.boxShadow   = '';
      const errMsg = el.closest('.form-group')?.querySelector('.field-error');
      if (errMsg) errMsg.remove();
    });
  });
})();


/* ============================================================
   9. GRADIENT TEXT ANIMATION (subtle hue-shift)
============================================================ */
(function initGradientAnimation() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const gradientEls = $$('.gradient-text');
  if (!gradientEls.length) return;

  let angle = 135;

  function tick() {
    angle = (angle + 0.12) % 360;
    gradientEls.forEach(el => {
      el.style.backgroundImage = `linear-gradient(
        ${angle}deg,
        #7C5CFA 0%,
        #3B82F6 45%,
        #C4B5FD 100%
      )`;
    });
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();


/* ============================================================
   10. HERO BLOB PARALLAX on mouse move
============================================================ */
(function initBlobParallax() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const blob1 = $('.blob--1');
  const blob2 = $('.blob--2');
  const blob3 = $('.blob--3');
  if (!blob1 || !blob2 || !blob3) return;

  const hero = $('.hero');
  if (!hero) return;

  hero.addEventListener('mousemove', throttle(e => {
    const rect = hero.getBoundingClientRect();
    const cx   = e.clientX / rect.width  - 0.5;  // -0.5 to 0.5
    const cy   = e.clientY / rect.height - 0.5;

    blob1.style.transform = `translate(${cx * 24}px, ${cy * 24}px) scale(1)`;
    blob2.style.transform = `translate(${cx * -20}px, ${cy * -20}px) scale(1)`;
    blob3.style.transform = `translate(${cx * 16}px, ${cy * 16}px) scale(1)`;
  }, 30));
})();


/* ============================================================
   11. TYPING EFFECT in terminal card
============================================================ */
(function initTerminalType() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const terminal = $('.terminal__body');
  if (!terminal) return;

  const lines = $$('.terminal__line', terminal);

  // Initially hide all lines
  lines.forEach(line => {
    line.style.opacity = '0';
    line.style.transform = 'translateY(4px)';
    line.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  });

  // Wait until terminal is in view, then reveal sequentially
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        lines.forEach((line, i) => {
          setTimeout(() => {
            line.style.opacity   = '1';
            line.style.transform = 'translateY(0)';
          }, i * 120);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  observer.observe(terminal);
})();


/* ============================================================
   12. STAGGER DELAY for grid children
   Assigns increasing delay to .reveal siblings inside grids
============================================================ */
(function initStaggerDelays() {
  const grids = $$(
    '.skills__grid, .projects__grid, .services__grid, .testimonials__grid, .stats__grid'
  );

  grids.forEach(grid => {
    const children = $$('.reveal', grid);
    children.forEach((child, i) => {
      // Cap at 6 to avoid very long waits
      child.style.transitionDelay = `${Math.min(i * 80, 480)}ms`;
    });
  });
})();


/* ============================================================
   13. SCROLL-BASED TIMELINE HIGHLIGHT
   Adds a glow to the timeline dot currently closest to viewport centre
============================================================ */
(function initTimelineHighlight() {
  const items = $$('.timeline__item');
  if (!items.length) return;

  function highlight() {
    const mid = window.innerHeight / 2;
    let closest = null;
    let closestDist = Infinity;

    items.forEach(item => {
      const rect = item.getBoundingClientRect();
      const centre = rect.top + rect.height / 2;
      const dist   = Math.abs(centre - mid);
      if (dist < closestDist) {
        closestDist = dist;
        closest = item;
      }
    });

    items.forEach(item => {
      const dot = item.querySelector('.timeline__dot');
      if (!dot) return;

      if (item === closest) {
        dot.style.boxShadow = '0 0 16px rgba(124,92,250,0.55)';
        dot.style.background = 'var(--c-violet)';
      } else {
        // Preserve the always-active last dot
        if (!dot.classList.contains('timeline__dot--active')) {
          dot.style.boxShadow = '';
          dot.style.background = '';
        }
      }
    });
  }

  window.addEventListener('scroll', throttle(highlight, 80), { passive: true });
  highlight();
})();


/* ============================================================
   14. NAVBAR LINK UNDERLINE HOVER BAR
   Adds an animated highlight that slides under nav links
============================================================ */
(function initNavHoverBar() {
  const links = $$('.navbar__link');
  if (!links.length) return;

  // Already handled via CSS :hover; no additional JS needed
  // This block kept as a placeholder for future enhancement
})();


/* ============================================================
   15. PAGE LOAD — initial scroll check
   Trigger scroll handlers once on load in case the user
   navigated directly to an anchor
============================================================ */
window.addEventListener('DOMContentLoaded', () => {
  // Force scroll-based state evaluation immediately
  window.dispatchEvent(new Event('scroll'));
});


/* ============================================================
   16. KEYBOARD ACCESSIBILITY — ESC closes mobile nav
============================================================ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const hamburger = $('#hamburger');
    const mobileNav = $('#mobile-nav');
    if (hamburger && mobileNav && mobileNav.classList.contains('open')) {
      hamburger.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('aria-hidden', 'true');
      mobileNav.classList.remove('open');
      hamburger.focus();
    }
  }
});


/* ============================================================
   17. TESTIMONIAL CARDS — subtle auto-float
   Alternates the translateY of each card on a gentle timer
   to give the grid a breathing, animated feel
============================================================ */
(function initTestimonialFloat() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const cards = $$('.testimonial-card');
  if (!cards.length) return;

  cards.forEach((card, i) => {
    const delay    = i * 800;       // stagger start
    const duration = 4000 + i * 600; // slightly different speeds

    function floatUp() {
      card.style.transition = `transform ${duration}ms ease-in-out`;
      card.style.transform  = 'translateY(-6px)';
      setTimeout(floatDown, duration);
    }

    function floatDown() {
      card.style.transition = `transform ${duration}ms ease-in-out`;
      card.style.transform  = 'translateY(0)';
      setTimeout(floatUp, duration);
    }

    // Only float when card is visible
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(floatUp, delay);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    // Hover should override float
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease';
      card.style.transform  = 'translateY(-4px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
    });

    observer.observe(card);
  });
})();


/* ============================================================
   18. PERFORMANCE — Passive event listeners confirmed
   All scroll/mousemove handlers use { passive: true } where
   registered via addEventListener above to ensure 60fps.
============================================================ */