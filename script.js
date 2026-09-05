'use strict';

// Progressive enhancement: all reading, links and native form submission work without JS.
const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-navigation');

if (header && menuButton && navigation) {
  const smallScreen = window.matchMedia('(max-width: 900px)');
  const setMenu = (open, returnFocus = false) => {
    header.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Navigation schliessen' : 'Navigation öffnen');
    if (returnFocus) menuButton.focus();
  };
  menuButton.hidden = false;
  header.classList.add('menu-ready');
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    setMenu(false);
    // Move keyboard focus with the destination when the mobile navigation closes.
    const target = document.querySelector(link.hash);
    if (smallScreen.matches && target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) setMenu(false, true);
  });
  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) setMenu(false);
  });
  smallScreen.addEventListener('change', () => setMenu(false));

  if ('IntersectionObserver' in window) {
    const links = Array.from(navigation.querySelectorAll('a[href^="#"]'));
    const sections = Array.from(document.querySelectorAll('main > section'));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of links) {
          if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        }
      }
    }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
    sections.forEach((section) => observer.observe(section));
  }
}

const form = document.querySelector('.booking-form');
if (form && 'fetch' in window && 'AbortController' in window) {
  const submit = form.querySelector('[type="submit"]');
  const status = form.querySelector('.form-status');
  let sending = false;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    sending = true;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.hidden = false;
    status.textContent = 'Deine Anfrage wird gesendet …';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Submission failed');
      window.location.assign(new URL('thank-you.html', window.location.href).href);
    } catch (error) {
      status.textContent = error.name === 'AbortError'
        ? 'Die Bestätigung dauert zu lange. Bitte prüfe deine Verbindung, bevor du es erneut versuchst. Deine Eingaben bleiben erhalten.'
        : 'Die Anfrage konnte nicht bestätigt werden. Bitte versuche es später erneut. Deine Eingaben bleiben erhalten.';
      status.focus();
    } finally {
      window.clearTimeout(timeout);
      sending = false;
      submit.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });
}
