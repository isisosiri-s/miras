'use strict';
/* Thin bridge to native features. In a plain browser everything degrades gracefully. */
const Native = {
  get cap() { return window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform() ? Capacitor : null; },
  get isApp() { return !!(window.MirasNative || this.cap); },
  plugin(n) { return this.cap && this.cap.Plugins ? this.cap.Plugins[n] : null; },
  // screenshots / screen recording
  canBlockShots() { return !!((window.MirasNative && MirasNative.setProtect) || this.plugin('PrivacyScreen')); },
  async setShotBlock(on) {
    try {
      if (window.MirasNative && MirasNative.setProtect) return MirasNative.setProtect(on);
      const p = this.plugin('PrivacyScreen'); if (p) return on ? p.enable() : p.disable();
    } catch (e) { console.warn('shot', e); }
  },
  // biometrics (Android)
  async bioAvailable() {
    try { const p = this.plugin('NativeBiometric'); if (!p) return false; const r = await p.isAvailable(); return !!r.isAvailable; } catch { return false; }
  },
  async bioSave(pw) {
    const p = this.plugin('NativeBiometric'); if (!p) return false;
    try { await p.verifyIdentity({ reason: 'Miras', title: 'Miras' }); await p.setCredentials({ username: 'miras', password: pw, server: 'miras.local' }); return true; } catch { return false; }
  },
  async bioGet() {
    const p = this.plugin('NativeBiometric'); if (!p) return null;
    try { await p.verifyIdentity({ reason: 'Miras', title: 'Miras' }); const c = await p.getCredentials({ server: 'miras.local' }); return c.password; } catch { return null; }
  },
  async bioClear() { try { const p = this.plugin('NativeBiometric'); if (p) await p.deleteCredentials({ server: 'miras.local' }); } catch { } },
  async hasBioCreds() { try { const p = this.plugin('NativeBiometric'); if (!p) return false; await p.getCredentials({ server: 'miras.local' }); return true; } catch { return false; } },
  // status bar: light icons on our dark brown bar
  // icon colour follows what is under the bar: dark screens (lock/splash/dark theme) -> light icons, light theme -> dark icons
  async syncBar() {
    const p = this.plugin('StatusBar'); if (!p) return;
    const light = !!document.querySelector('.lockscr, #splash:not(.out)') || (typeof H !== 'undefined' && H.theme === 'dark');
    if (light === this._barLight) return; this._barLight = light;
    try { await p.setStyle({ style: light ? 'DARK' : 'LIGHT' }); } catch (e) { console.warn('sb', e); }
  },
  // colour the system-bar areas: top = header / lock colour, bottom = page colour
  paintBars() {
    let t, b;
    if (document.querySelector('.lockscr, #splash:not(.out)')) { t = '#4A2D17'; b = '#241208'; }
    else {
      const cs = e => e ? getComputedStyle(e).backgroundColor : '';
      const hex = c => { const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(c || ''); return m ? '#' + [1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, '0')).join('') : null; };
      t = hex(cs(document.querySelector('.appbar'))) || '#5B3A1E';
      b = (getComputedStyle(document.documentElement).getPropertyValue('--bg') || '').trim() || '#F6F1E9';
    }
    const k = t + b; if (k === this._barKey) return; this._barKey = k;
    // PIN / splash screens only: paint the safe-area strips under the system bars with the screen colour
    const lock = !!document.querySelector('.lockscr, #splash:not(.out)');
    if (lock) {
      const st = 'max(var(--safe-area-inset-top,0px),env(safe-area-inset-top,0px))';
      document.documentElement.style.background = `linear-gradient(to bottom, ${t} 0, ${t} ${st}, ${b} ${st}, ${b} 100%)`;
      document.body.style.background = 'transparent';
    } else { document.documentElement.style.background = ''; document.body.style.background = ''; }
    if (!this.cap) return;
    try { const P = this.plugin('MirasBars') || this.cap.registerPlugin('MirasBars'); P.set({ top: t, bottom: b }).catch(e => { this._barKey = null; console.warn('pb', e); }); } catch (e) { this._barKey = null; console.warn('pb', e); }
  },
  initBars() {
    this._barLight = null; this.syncBar(); this.paintBars();
    let q = 0; const run = () => { q = 0; this.syncBar(); this.paintBars(); };
    new MutationObserver(() => { if (!q) q = requestAnimationFrame(run); }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-theme'] });
  },
  // back button / minimise
  minimize() { const p = this.plugin('App'); if (p && p.minimizeApp) p.minimizeApp(); },
  onBackButton(fn) { const p = this.plugin('App'); if (p && p.addListener) p.addListener('backButton', fn); },
};
