/* Own dropdowns instead of the system ones (Windows blue list / Android grey radio dialog), and arrow-key
   navigation between the fields of the record card.
   - every <select> is kept (it is the source of truth: value, change events, readCard) but hidden; a styled
     button + list takes its place. PC / tablet (>=900px): list under the field. Phone: bottom sheet. */
(function () {
  const vd = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  const CHEV = '<svg class="dd-ch" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  const optsOf = sel => [...sel.options].map(o => ({ v: o.value, t: o.textContent, dis: o.disabled }));
  const curText = sel => { const o = sel.options[sel.selectedIndex]; return o ? o.textContent : ''; };

  function ddEnhance(sel) {
    if (sel._dd || sel.multiple || sel.size > 1) return; sel._dd = 1;
    const wrap = document.createElement('div'); wrap.className = 'dd';
    sel.parentNode.insertBefore(wrap, sel); wrap.appendChild(sel);
    sel.classList.add('dd-native'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    const btn = document.createElement('button'); btn.type = 'button';
    btn.className = 'dd-btn ' + sel.className.replace('dd-native', '').trim();
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    if (sel.id) btn.dataset.for = sel.id;
    btn.innerHTML = '<span class="dd-t"></span>' + CHEV; wrap.appendChild(btn); sel._ddBtn = btn;
    const sync = () => { btn.firstChild.textContent = curText(sel); btn.disabled = sel.disabled; btn.classList.toggle('dd-empty', sel.value === ''); };
    sync();
    // code that sets select.value directly (restoring a draft) must update the label too
    Object.defineProperty(sel, 'value', { get() { return vd.get.call(sel); }, set(v) { vd.set.call(sel, v); sync(); }, configurable: true });
    sel.addEventListener('change', sync);
    new MutationObserver(sync).observe(sel, { childList: true, attributes: true, attributeFilter: ['disabled'] });

    let list = null, hi = -1, opts = [], off = null;
    const isOpen = () => !!list;
    const close = () => { if (!list) return; list.remove(); list = null; hi = -1; wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); if (off) { off(); off = null; } };
    const choose = v => {
      close();
      if (vd.get.call(sel) !== v) { vd.set.call(sel, v); sync(); sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); }
      btn.focus();
    };
    const paint = () => { if (!list) return; [...list.children].forEach((el, i) => el.classList.toggle('hi', i === hi)); const el = list.children[hi]; if (el) el.scrollIntoView({ block: 'nearest' }); };
    const openList = () => {
      if (isOpen() || sel.disabled) return;
      opts = optsOf(sel); const cur = vd.get.call(sel);
      if (!isWide()) { openSheet(); return; }
      list = document.createElement('div'); list.className = 'dd-list'; list.setAttribute('role', 'listbox');
      list.innerHTML = opts.map(o => `<div class="dd-it${o.v === cur ? ' on' : ''}" role="option" data-v="${esc(o.v)}">${esc(o.t)}</div>`).join('');
      document.body.appendChild(list); wrap.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
      const r = btn.getBoundingClientRect(), need = Math.min(opts.length, 7) * 38 + 8, host = btn.closest('.cardbody') || document.documentElement;
      const room = Math.min(host.getBoundingClientRect().bottom, window.innerHeight) - r.bottom - 8;
      list.classList.toggle('up', room < need && r.top > room);
      const up = room < need && r.top > room;
      list.style.maxHeight = Math.max(76, Math.min(need, up ? r.top - 12 : room)) + 'px';
      // fixed + appended to <body>: a dialog / card with overflow:hidden must not clip the list
      list.style.position = 'fixed'; list.style.zIndex = '3000'; list.style.margin = '0'; list.style.left = Math.max(4, Math.min(r.left, window.innerWidth - 8 - Math.max(r.width, 180))) + 'px'; list.style.minWidth = r.width + 'px';
      if (up) { list.style.top = 'auto'; list.style.bottom = (window.innerHeight - r.top + 4) + 'px'; } else { list.style.top = (r.bottom + 4) + 'px'; }
      hi = Math.max(0, opts.findIndex(o => o.v === cur)); paint();
      list.addEventListener('mousedown', e => e.preventDefault());
      list.addEventListener('click', e => { const it = e.target.closest('[data-v]'); if (it) choose(it.dataset.v); });
      list.addEventListener('mousemove', e => { const it = e.target.closest('.dd-it'); if (it) { const i = [...list.children].indexOf(it); if (i !== hi) { hi = i; paint(); } } });
      const out = e => { if (!document.body.contains(btn)) return close(); if (!wrap.contains(e.target) && !(list && list.contains(e.target))) close(); };
      const sc = e => { if (list && !list.contains(e.target)) close(); };
      document.addEventListener('pointerdown', out, true); window.addEventListener('scroll', sc, true); window.addEventListener('resize', close);
      off = () => { document.removeEventListener('pointerdown', out, true); window.removeEventListener('scroll', sc, true); window.removeEventListener('resize', close); };
    };
    async function openSheet() {
      const cur = vd.get.call(sel), lab = wrap.parentElement && (wrap.parentElement.closest('.fld,.setrow') || wrap.parentElement).querySelector('.lbl,.tt');
      btn.setAttribute('aria-expanded', 'true');
      const v = await ask({
        title: lab ? lab.textContent.trim() : '', sheet: true, buttons: [], html: `<div class="dd-sheet">${opts.map(o => `<button type="button" class="dd-row${o.v === cur ? ' on' : ''}" data-v="${esc(o.v)}"><span>${esc(o.t)}</span>${o.v === cur ? IC.ok(20) : ''}</button>`).join('')}</div>`,
        onMount: (mb, finish) => mb.addEventListener('click', e => { const b = e.target.closest('.dd-row'); if (b) finish(b.dataset.v); })
      });
      btn.setAttribute('aria-expanded', 'false');
      if (v !== null && v !== undefined && vd.get.call(sel) !== v) { vd.set.call(sel, v); sync(); sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    btn.addEventListener('click', () => { isOpen() ? close() : openList(); });
    btn.addEventListener('keydown', e => {
      if (!isOpen()) return; // closed: Enter / Space open it (button click); arrows belong to the card navigation
      if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); hi = Math.min(opts.length - 1, hi + 1); paint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); hi = Math.max(0, hi - 1); paint(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); if (hi >= 0) choose(opts[hi].v); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      else if (e.key === 'Tab') close();
    });
    btn.addEventListener('blur', () => { setTimeout(() => { if (isOpen() && !wrap.contains(document.activeElement)) close(); }, 0); });
  }
  const scan = root => { (root.tagName === 'SELECT' ? [root] : root.querySelectorAll ? [...root.querySelectorAll('select')] : []).forEach(ddEnhance); };
  const mo = new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) scan(n); });
  const start = () => { scan(document.body); mo.observe(document.body, { childList: true, subtree: true }); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);

  // ---------- record card: ↑ / ↓ move between the fields (closed loop), Enter does not move ----------
  // order = DOM order of the editable controls; the ID field is read-only and skipped. From the last field ↓ goes to the first
  // and ↑ from the first goes to the last. An open list (combo or dropdown) keeps the arrows for itself.
  const cardFields = host => [...host.querySelectorAll('#cBody input.inp, #cBody .dd-btn, #cBody .scanrow, #cBody textarea')].filter(el => !el.disabled && !el.readOnly && el.offsetParent !== null);
  document.addEventListener('keydown', e => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const el = e.target; if (!el || !el.closest) return;
    const host = el.closest('#cardhost'); if (!host || !el.closest('#cBody')) return;
    if (el.getAttribute && el.getAttribute('aria-expanded') === 'true') return; // list open: it handles the arrow
    const f = cardFields(host), i = f.indexOf(el); if (i < 0) return;
    e.preventDefault();
    const n = f[(i + (e.key === 'ArrowDown' ? 1 : -1) + f.length) % f.length];
    n._quiet = true; n.focus(); if (document.activeElement !== n) n._quiet = false;
    if (n.tagName === 'INPUT' && n.select) n.select();
    setTimeout(() => { n._quiet = false; }, 0);
  });

  // ---- animation level 3: numbers in the statistics / reports count up ----
  window.countUpAll = function () {
    if (animLevel() < 3) return;
    document.querySelectorAll('.rp-c .v, .cu').forEach(el => {
      const raw = el.textContent.replace(/\s/g, ''); if (!/^\d+$/.test(raw)) return;
      const to = +raw, orig = el.textContent; if (to < 2 || el._cu === to) return; el._cu = to;
      const t0 = performance.now(), D = 650;
      const step = now => { const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3); el.textContent = fmtInt(Math.round(to * e)); if (k < 1) requestAnimationFrame(step); else el.textContent = orig; };
      requestAnimationFrame(step);
    });
  };

  // ---- phone: the card is a sheet. Swipe down: full -> half; swipe up on half: back to full; swipe down on half: closes.
  //      Works anywhere in the card except on fields/buttons; a scrolled card scrolls first (the sheet only moves from the top). Editing works on half.
  const HALF = 0.46; let g = null;
  const sheetOk = () => !isWide() && window.matchMedia('(max-width:899px)').matches;
  const topOf = s => (s === 'half' ? Math.round(window.innerHeight * HALF) : 0);
  const cardHost = () => { const h = $('#cardhost'); return h && h.classList.contains('on') ? h : null; };
  // moving the sheet must not re-layout the whole card on every touch move: while dragging only a transform changes (GPU); the real `top` is set once when the gesture settles (then the transform animates from where the finger left it)
  const drag = (h, top) => { h._ty = top - (parseFloat(h.style.top) || 0); h.style.willChange = 'transform'; h.style.transition = 'none'; h.style.transform = `translateY(${h._ty}px)`; };
  const setTop = (h, px, anim) => {
    const lay = parseFloat(h.style.top) || 0, vis = lay + (h._ty || 0), run = anim && animLevel() >= 2;
    if (px >= window.innerHeight) { // sliding off the screen: transform only
      h._ty = px - lay; h.style.willChange = 'transform'; h.style.transition = run ? 'transform .24s cubic-bezier(.2,.8,.2,1)' : 'none'; h.style.transform = `translateY(${h._ty}px)`; return;
    }
    h.style.transition = 'none'; h.style.top = px + 'px';
    if (!run) { h._ty = 0; h.style.transform = ''; h.style.willChange = ''; return; }
    h._ty = vis - px; h.style.transform = `translateY(${h._ty}px)`; void h.offsetHeight;
    h.style.willChange = 'transform'; h.style.transition = 'transform .24s cubic-bezier(.2,.8,.2,1)'; h._ty = 0; h.style.transform = 'translateY(0px)';
    clearTimeout(h._tt); h._tt = setTimeout(() => { if (!h._ty) { h.style.transition = ''; h.style.transform = ''; h.style.willChange = ''; } }, 300);
  };
  const toState = (h, s, anim = true) => { h.dataset.sheet = s; h.style.borderRadius = s === 'half' ? '18px 18px 0 0' : ''; setTop(h, topOf(s), anim); };
  window.cardSheetReset = h => { h = h || $('#cardhost'); if (!h) return; clearTimeout(h._tt); h._ty = 0; h.style.top = ''; h.style.transform = ''; h.style.willChange = ''; h.style.transition = ''; h.style.borderRadius = ''; delete h.dataset.sheet; };
  document.addEventListener('touchstart', e => {
    g = null; if (!sheetOk() || e.touches.length !== 1) return;
    const h = cardHost(); if (!h || !h.contains(e.target)) return;
    if (e.target.closest('input,select,textarea,button,.dd,.dd-btn,.dd-list,[contenteditable]')) return;
    const body = e.target.closest('#cBody');
    g = { y: e.touches[0].clientY, x: e.touches[0].clientX, t: performance.now(), h, mode: null, dy: 0, start: h.dataset.sheet === 'half' ? 'half' : 'full', bodyTop: body ? body.scrollTop : 0, body };
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!g) return; const y = e.touches[0].clientY, dy = y - g.y, dx = e.touches[0].clientX - g.x;
    if (!g.mode) {
      if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return;
      if (Math.abs(dx) > Math.abs(dy)) { g = null; return; }
      const atTop = !g.body || g.body.scrollTop <= 0;
      // down: only from the top of the card; up: only on the half sheet (on the full card up is just scrolling)
      if ((dy > 0 && atTop) || (dy < 0 && g.start === 'half')) { g.mode = 'sheet'; g.h.style.animation = 'none'; g.base = topOf(g.start); g.y0 = y; } else { g = null; return; }
    }
    e.preventDefault(); g.dy = y - g.y0;
    const top = Math.max(0, Math.min(window.innerHeight, g.base + g.dy)); drag(g.h, top); g.top = top;
  }, { passive: false });
  const end = async () => {
    if (!g || g.mode !== 'sheet') { g = null; return; } const s = g; g = null; const h = s.h, dy = s.dy, v = dy / Math.max(1, performance.now() - s.t);
    if (s.start === 'full') { if (dy > 70 || (dy > 30 && v > 0.5)) toState(h, 'half'); else toState(h, 'full'); return; }
    if (dy < -50 || (dy < -25 && v < -0.5)) { toState(h, 'full'); return; }
    if (dy > 70 || (dy > 30 && v > 0.5)) {
      if (cardDirty()) { toState(h, 'half'); const ok = await closeCard(false); if (ok) setTimeout(() => { cardSheetReset(h); h.style.animation = ''; }, 260); return; } // edited: ask first, with the sheet still on screen
      setTop(h, window.innerHeight, true); h.dataset.swiped = '1';
      await new Promise(r => setTimeout(r, animLevel() >= 2 ? 240 : 0));
      const ok = await closeCard(false);
      delete h.dataset.swiped;
      if (!ok) { toState(h, 'half'); h.style.animation = 'none'; } else { cardSheetReset(h); h.style.animation = ''; }
      return;
    }
    toState(h, 'half');
  };
  document.addEventListener('touchend', end, { passive: true });
  document.addEventListener('touchcancel', () => { if (g && g.mode === 'sheet') { const h = g.h, st = g.start; g = null; toState(h, st); } else g = null; }, { passive: true });
  // a field gets focus on the half sheet: expand to full so the keyboard does not cover it
  document.addEventListener('focusin', e => { const h = cardHost(); if (h && h.dataset.sheet === 'half' && sheetOk() && h.contains(e.target) && e.target.matches('input,select,textarea')) toState(h, 'full'); });
  window.addEventListener('resize', () => { const h = cardHost(); if (h && h.dataset.sheet) { if (sheetOk()) setTop(h, topOf(h.dataset.sheet), false); else cardSheetReset(h); } });
})();

// (the soft-edge fade observer of the old scrolling button rows was removed: the rows are gone and the observer forced a layout read after every DOM change)

