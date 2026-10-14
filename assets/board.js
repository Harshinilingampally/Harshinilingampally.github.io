/* The Board — plates are posted in sequence, in place. */
(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const faces = Array.from(document.querySelectorAll('.face'));

  /* ---------- posting a plate ---------- */
  const post = (el, delay) => {
    if (reduced.matches) return;
    el.style.setProperty('--d', delay + 'ms');
    el.setAttribute('data-post', '');
    el.addEventListener('animationend', () => {
      el.removeAttribute('data-post');
      el.style.removeProperty('--d');
    }, { once: true });
  };

  /* ---------- the register ---------- */
  const setRow = (face, open) => {
    const panel = document.getElementById(face.getAttribute('aria-controls'));
    const row = face.closest('.row');
    face.setAttribute('aria-expanded', String(open));
    row.setAttribute('data-open', String(open));
    face.querySelector('.face__openlabel').textContent = open ? 'Close' : 'Open';
    if (!panel) return;

    if (open) {
      panel.hidden = false;
      // the chain posts link by link, the way a board is actually changed
      panel.querySelectorAll('.link').forEach((link, i) => post(link, 40 + i * 70));
    } else {
      panel.hidden = true;
    }
  };

  faces.forEach((face) => {
    face.addEventListener('click', () => {
      const open = face.getAttribute('aria-expanded') === 'true';
      setRow(face, !open);
      if (!open) {
        const top = face.getBoundingClientRect().top;
        if (top < 0) face.scrollIntoView({ block: 'start', behavior: reduced.matches ? 'auto' : 'smooth' });
      }
    });

    face.addEventListener('keydown', (e) => {
      const i = faces.indexOf(face);
      if (e.key === 'ArrowDown' && i < faces.length - 1) { e.preventDefault(); faces[i + 1].focus(); }
      if (e.key === 'ArrowUp' && i > 0) { e.preventDefault(); faces[i - 1].focus(); }
      if (e.key === 'Home') { e.preventDefault(); faces[0].focus(); }
      if (e.key === 'End') { e.preventDefault(); faces[faces.length - 1].focus(); }
      if (e.key === 'Escape' && face.getAttribute('aria-expanded') === 'true') {
        e.preventDefault();
        setRow(face, false);
      }
    });
  });

  /* ---------- figure plates post as the board comes into view ---------- */
  const figs = document.querySelectorAll('[data-fig]');
  if ('IntersectionObserver' in window && !reduced.matches) {
    let seen = 0;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        post(entry.target, (seen++ % 4) * 110);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.3 });
    figs.forEach((f) => io.observe(f));
  }

  /* ---------- the reel shelf: the poster becomes the player, in place ---------- */
  document.querySelectorAll('.tape__face').forEach((btn) => {
    const tape = btn.closest('.tape');
    const title = btn.querySelector('.tape__title').textContent;
    const meta = btn.querySelector('.strip').textContent;

    const restore = (focusBack) => {
      tape.replaceChildren(btn);
      if (focusBack) btn.focus();
    };

    btn.addEventListener('click', () => {
      document.querySelectorAll('.tape video').forEach((v) => v.pause());

      const video = document.createElement('video');
      video.src = btn.dataset.video;
      video.poster = btn.dataset.poster;
      video.controls = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.setAttribute('aria-label', title);

      const state = document.createElement('span');
      state.className = 'tape__state';
      state.setAttribute('role', 'status');
      state.textContent = 'Loading…';

      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'tape__back';
      back.textContent = '← Back to the board';
      back.addEventListener('click', () => { video.pause(); restore(true); });

      const cap = document.createElement('span');
      cap.className = 'tape__title';
      cap.textContent = title;
      const dur = document.createElement('span');
      dur.className = 'strip';
      dur.textContent = meta;

      const shell = document.createElement('div');
      shell.className = 'tape__face';
      shell.append(video, cap, dur, state, back);

      video.addEventListener('canplay', () => { state.remove(); }, { once: true });
      video.addEventListener('error', () => {
        state.className = 'tape__state tape__state--error';
        state.textContent = 'This reel would not load. Try again, or watch it on Instagram.';
      });

      tape.replaceChildren(shell);
      back.focus();
      video.play().catch(() => {
        state.textContent = 'Press play to watch.';
      });
    });
  });
})();
