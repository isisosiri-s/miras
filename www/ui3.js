'use strict';
/* Miras — extra list tools: duplicates, find & replace, quick jump, saved filter sets */

// ---- duplicates: same inventory number, or same title + author ----
function dupSet() {
  if (UI._dupRev === DB.rev && UI._dups) return UI._dups;
  const a = new Map(), b = new Map(), out = new Set();
  const live = DB.records.filter(isLive);
  for (const r of live) {
    const inv = norm(String(r.inv || '')); if (inv) { (a.get(inv) || a.set(inv, []).get(inv)).push(r); }
    const ti = norm(String(r.title || '')); if (ti) { const k = ti + '|' + norm(String(r.author || '')); (b.get(k) || b.set(k, []).get(k)).push(r); }
  }
  for (const m of [a, b]) for (const l of m.values()) if (l.length > 1) l.forEach(r => out.add(r.uuid));
  UI._dups = out; UI._dupRev = DB.rev; return out;
}

// ---- find & replace ----
async function findReplaceDlg() {
  const cols = liveCols().filter(c => ['text', 'list'].includes(c.kind));
  if (!cols.length) return;
  const opts = `<option value="*">${esc(t('fr_all_cols'))}</option>` + cols.map(c => `<option value="${c.key}">${esc(colName(c))}</option>`).join('');
  const scopeN = computeList().length, allN = DB.records.filter(isLive).length;
  const state = { col: '*', find: '', rep: '', cs: false, whole: false, scope: 'list' };
  const plan = () => {
    const keys = state.col === '*' ? cols.map(c => c.key) : [state.col];
    const recs = state.scope === 'list' ? computeList() : DB.records.filter(isLive);
    const out = []; if (!state.find) return out;
    const esc2 = state.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(state.whole ? '^' + esc2 + '$' : esc2, state.cs ? 'g' : 'gi');
    for (const r of recs) for (const k of keys) {
      const v = r[k]; if (typeof v !== 'string' || !v) continue;
      re.lastIndex = 0; if (!re.test(v)) continue; re.lastIndex = 0;
      const nv = v.replace(re, () => state.rep); if (nv !== v) out.push([r, k, v, nv]);
    }
    return out;
  };
  let last = [];
  const res = await ask({
    title: t('fr_title'),
    html: `<div class="fld"><div class="lbl">${t('chg_col')}</div><select class="inp" id="frCol">${opts}</select></div>
      <div class="fld"><div class="lbl">${t('fr_find')}</div><input class="inp" id="frFind" autocomplete="off"></div>
      <div class="fld"><div class="lbl">${t('fr_with')}</div><input class="inp" id="frRep" autocomplete="off"></div>
      <label class="setrow" style="padding:8px 2px"><input type="checkbox" id="frCs" style="margin-right:10px"><span class="tt">${t('fr_case')}</span></label>
      <label class="setrow" style="padding:8px 2px"><input type="checkbox" id="frWhole" style="margin-right:10px"><span class="tt">${t('fr_whole')}</span></label>
      <div class="fld"><div class="lbl">${t('fr_scope')}</div><select class="inp" id="frScope"><option value="list">${esc(t('fr_scope_list', { n: scopeN }))}</option><option value="all">${esc(t('fr_scope_all', { n: allN }))}</option></select></div>
      <div id="frInfo" class="ss" style="padding:6px 2px;min-height:2.4em"></div>`,
    onMount: m => {
      const upd = () => {
        state.col = $('#frCol', m).value; state.find = $('#frFind', m).value; state.rep = $('#frRep', m).value;
        state.cs = $('#frCs', m).checked; state.whole = $('#frWhole', m).checked; state.scope = $('#frScope', m).value;
        last = plan(); const recN = new Set(last.map(x => x[0].uuid)).size;
        $('#frInfo', m).innerHTML = state.find ? (last.length ? esc(t('fr_found', { n: last.length, r: recN })) + `<br><span style="opacity:.8">${esc(String(last[0][2]).slice(0, 40))} → ${esc(String(last[0][3]).slice(0, 40))}</span>` : esc(t('fr_none'))) : '';
      };
      ['frCol', 'frFind', 'frRep', 'frCs', 'frWhole', 'frScope'].forEach(i => { $('#' + i, m).oninput = upd; $('#' + i, m).onchange = upd; });
    },
    buttons: [{ label: t('btn_cancel'), v: null }, { label: t('fr_apply'), cls: 'b1', v: true }],
  });
  if (!res || !last.length) return;
  const by = new Map(); for (const [r, k, , nv] of last) { (by.get(r) || by.set(r, {}).get(r))[k] = nv; }
  const recN = by.size;
  if (!(await confirmDlg(t('fr_confirm', { n: last.length, r: recN }), t('fr_apply')))) return;
  for (const [r, vals] of by) updateRecord(r, vals);
  UI.listKey = ''; refreshList(); toast(t('mass_done', { n: recN }));
}

// ---- quick jump to ID / inventory number ----
async function jumpDlg() {
  const v = await ask({ title: t('jump_title'), html: `<input class="inp" id="jmp" autocomplete="off" inputmode="text" placeholder="${esc(t('jump_ph'))}">`, onMount: m => setTimeout(() => { const i = $('#jmp', m); i && i.focus(); }, 80), buttons: [{ label: t('btn_cancel'), v: null }, { label: t('jump_go'), cls: 'b1', v: m => $('#jmp', m).value.trim() }] });
  if (!v) return;
  const live = DB.records.filter(isLive); const nv = norm(v);
  let r = /^\d+$/.test(v) ? live.find(x => x.id === +v) : null;
  if (!r) r = live.find(x => norm(String(x.inv || '')) === nv);
  if (!r) { toast(t('jump_none')); return; }
  if (UI.route !== 'books') goRoute('books');
  let list = computeList();
  if (!list.includes(r)) { UI.q = ''; UI.filter = 'all'; UI.colf = {}; renderChips(); const q = $('#q'); if (q) q.value = ''; refreshList(); list = computeList(); }
  const i = list.indexOf(r); const tw = $('#tw'); if (i < 0 || !tw) return;
  tw.scrollTop = Math.max(0, i * UI.vr.rh - tw.clientHeight / 3); renderWindow(true);
  UI.flash = r.uuid; renderWindow(true);
  setTimeout(() => { UI.flash = null; renderWindow(true); }, 1800);
}

// ---- saved filter sets ----
async function filterSetsDlg() {
  const sets = H.fsets || []; let after = null;
  const html = `<div class="group" style="margin:0">${sets.map((s, i) => `<div class="setrow"><button class="tt" data-a="use" data-n="${i}" style="flex:1;text-align:left;background:none;border:0;color:inherit;font:inherit">${esc(s.name)}</button><button class="ib" data-a="del" data-n="${i}" style="color:var(--bad)">${IC.trash}</button></div>`).join('') || `<div class="ss" style="padding:12px">${t('fs_none')}</div>`}</div>`;
  const r = await ask({
    title: t('fs_title'), html, buttons: [{ label: t('close'), v: null, cls: 'b2' }, { label: t('fs_save'), v: 'save', cls: 'b1' }],
    onMount: m => $$('[data-a]', m).forEach(b => b.onclick = () => { after = [b.dataset.a, +b.dataset.n]; m.querySelector('.btn').click(); }),
  });
  if (after) {
    const [a, i] = after;
    if (a === 'use') applyFilterSet(sets[i]);
    else { H.fsets = sets.filter((_, j) => j !== i); await saveHeader(); filterSetsDlg(); }
    return;
  }
  if (r === 'save') {
    const name = await ask({ title: t('fs_name'), html: `<input class="inp" id="fsn" autocomplete="off">`, onMount: mm => setTimeout(() => { const i = $('#fsn', mm); i && i.focus(); }, 80), buttons: [{ label: t('btn_cancel'), v: null }, { label: t('btn_save'), cls: 'b1', v: mm => $('#fsn', mm).value.trim() }] });
    if (name) { H.fsets = (H.fsets || []).concat([{ name, q: UI.q, filter: UI.filter, colf: JSON.parse(JSON.stringify(UI.colf || {})), sort: UI.sort ? { ...UI.sort } : null }]); await saveHeader(); toast(t('toast_saved'), 1200); }
  }
}
function applyFilterSet(s) {
  UI.q = s.q || ''; UI.filter = s.filter || 'all'; UI.colf = JSON.parse(JSON.stringify(s.colf || {})); UI.sort = s.sort ? { ...s.sort } : null;
  if (UI.route !== 'books') goRoute('books'); const q = $('#q'); if (q) q.value = UI.q; renderChips(); refreshList();
}
