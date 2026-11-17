'use strict';
/* Miras UI part 2: trash, columns, settings, import/export, Excel import, sync */

function pageShell(main, title, inner, right) {
  main.innerHTML = `${mobBar(title, true)}<div class="pageh"><h2>${esc(title)}</h2>${right || ''}</div><div class="page"><div class="pagein" id="pg">${inner}</div></div>`;
  bindMobBar();
}
const rowSwitch = (id, title, sub, on, dis) => `<button class="setrow" id="${id}"><div class="tt">${title}${sub ? `<div class="ss">${sub}</div>` : ''}</div><span class="sw ${on ? 'on' : ''} ${dis ? 'dis' : ''}"></span></button>`;
const rowLink = (id, title, sub) => `<button class="setrow" id="${id}"><div class="tt">${title}${sub ? `<div class="ss">${sub}</div>` : ''}</div><span class="chev">${IC.chev}</span></button>`;
const segHtml = (id, opts, cur) => `<div class="seg" id="${id}">${opts.map(([v, l]) => `<button data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;

// ---------- trash ----------
function viewTrash(main) {
  const items = DB.records.filter(r => r.del && !r.purged).sort((a, b) => b.del - a.del);
  const rows = items.map(r => `<div class="trrow" data-u="${r.uuid}"><div class="nm"><b>${esc(r.inv || '')} · ${esc(r.title || t('title_untitled'))}</b><span>ID ${r.id} · ${t('trash_days', { n: trashDaysLeft(r) })}</span></div>
    <button class="sbtn" data-act="restore">${t('trash_restore')}</button><button class="ib" style="color:var(--bad)" data-act="forever" aria-label="${esc(t('trash_forever'))}">${IC.trash}</button></div>`).join('');
  pageShell(main, t('trash_title'), `<div class="hint">${t('trash_hint')}</div>
    ${items.length ? `<div style="padding:0 12px 8px"><button class="sbtn" id="purge" style="color:var(--bad)">${IC.trash} ${t('trash_purge')}</button></div><div class="group" style="margin:6px 12px">${rows}</div>` : `<div class="empty"><b>${t('trash_empty')}</b></div>`}`);
  $$('.trrow button', main).forEach(b => b.onclick = async () => {
    const r = byUuid().get(b.closest('.trrow').dataset.u);
    if (b.dataset.act === 'restore') { restoreRecords([r]); toast(t('toast_saved'), 1000); }
    else { if (!(await confirmDlg(t('trash_purge_confirm', { n: 1 }), t('trash_forever'), true))) return; purgeRecords([r]); }
    viewTrash(main);
  });
  const p = $('#purge'); if (p) p.onclick = async () => { if (await confirmDlg(t('trash_purge_confirm', { n: items.length }), t('trash_purge'), true)) { purgeRecords(items); viewTrash(main); } };
}

// ---------- columns ----------
function viewColumns(main) {
  const cols = liveCols();
  const rows = cols.map((c, i) => {
    const locked = c.kind === 'id';
    return `<div class="colrow ${c.hidden ? 'hid' : ''}" data-k="${c.key}"><span class="nm">${esc(colName(c))}${!c.b ? `<span class="badge">${t('badge_custom')}</span>` : ''}</span>
    ${locked ? `<span class="ib" style="opacity:.6">${IC.lock(18)}</span>` : `<button class="ib" data-a="up" ${i <= 1 ? 'disabled' : ''}>${IC.up}</button><button class="ib" data-a="down" ${i >= cols.length - 1 ? 'disabled' : ''}>${IC.down}</button>
    <button class="ib ${onPhone(c) ? 'ph on' : 'ph'}" data-a="ph" title="${esc(t('col_phone'))}" ${(c.key === 'inv' || c.hidden) ? 'disabled' : ''}>${IC.phone}</button><button class="ib" data-a="eye" ${(builtinOf(c.key) || {}).noHide ? 'disabled' : ''}>${c.hidden ? IC.eyeoff : IC.eye}</button><button class="ib" data-a="edit">${IC.edit}</button>${!c.b ? `<button class="ib" data-a="del" style="color:var(--bad)">${IC.trash}</button>` : ''}`}</div>`;
  }).join('');
  pageShell(main, t('nav_columns'), `<div class="hint">${t('cols_hint')}</div><div style="padding:0 12px 8px"><button class="sbtn pri" id="addCol">${IC.plus.replace('width="26" height="26"', 'width="18" height="18"')}${t('col_add_btn')}</button></div><div class="group" style="margin:6px 12px">${rows}</div>`);
  $('#addCol').onclick = async () => { if (await colDialog(null)) viewColumns(main); };
  $$('.colrow [data-a]', main).forEach(b => b.onclick = async () => {
    const key = b.closest('.colrow').dataset.k; const c = colDef(key); const a = b.dataset.a;
    if (a === 'up' || a === 'down') { moveColumn(key, a === 'up' ? -1 : 1); }
    else if (a === 'ph') { c.ph = !onPhone(c); c.mts = Date.now(); colStamp(); scheduleSave(); UI.listKey = ''; }
    else if (a === 'eye') { c.hidden = !c.hidden; c.mts = Date.now(); colStamp(); scheduleSave(); }
    else if (a === 'edit') { await colDialog(c); }
    else if (a === 'del') {
      for (; ;) {
        const r = await ask({ title: t('col_del_title', { x: colName(c) }), text: t('col_del_text'), buttons: [{ label: t('col_move_btn'), v: 'move', cls: 'b1' }, { label: t('col_rename_btn'), v: 'rename', cls: 'b3' }, { label: t('col_del_export'), v: 'export', cls: 'b3' }, { label: t('btn_cancel'), v: null }, { label: t('col_del_ok'), v: 'del', cls: 'bad' }] });
        if (r === 'export') { await exportColumnXlsx(key); continue; }
        if (r === 'rename') { await colDialog(c); break; }
        if (r === 'move') { if (await moveColumnData(c)) break; continue; }
        if (r === 'del') { deleteColumn(key); UI.listKey = ''; }
        break;
      }
    }
    viewColumns(main);
  });
}
// move the data of one column into another (optionally deleting the source column afterwards)
async function moveColumnData(src) {
  const srcOk = ['text', 'number', 'date', 'list'].includes(src.kind);
  const targets = liveCols().filter(c => c.key !== src.key && c.kind === 'text' && c.key !== 'inv');
  if (!srcOk || !targets.length) { toast(t('col_move_none')); return false; }
  const recs = DB.records.filter(r => !r.purged);
  const val = (c, r) => String(cellText(c, r) ?? '').trim();
  const plan = (tc, pol) => {
    let move = 0, conf = 0; const todo = [];
    for (const r of recs) {
      const v = val(src, r); if (!v) continue;
      const cur = String(r[tc.key] ?? '').trim();
      if (!cur) { todo.push([r, v]); move++; }
      else if (norm(cur) === norm(v)) { /* already same */ }
      else {
        conf++;
        if (pol === 'replace') todo.push([r, v]);
        else if (pol === 'join') todo.push([r, cur + ' / ' + v]);
      }
    }
    return { move, conf, todo };
  };
  const tgtDef = targets.find(c => c.key === 'author') || targets[0];
  const res = await ask({
    title: t('col_move_title', { x: colName(src) }),
    html: `<div class="fld"><div class="lbl">${t('col_move_to')}</div><select class="inp" id="mvT">${targets.map(c => `<option value="${c.key}" ${c.key === tgtDef.key ? 'selected' : ''}>${esc(colName(c))}</option>`).join('')}</select></div>
      <div class="fld"><div class="lbl">${t('col_move_conf')}</div><select class="inp" id="mvP"><option value="keep">${t('col_move_keep')}</option><option value="replace">${t('col_move_replace')}</option><option value="join">${t('col_move_join')}</option></select></div>
      <label class="setrow" style="padding:8px 0"><input type="checkbox" id="mvD" checked style="margin-right:10px"><span class="tt">${t('col_move_del', { x: esc(colName(src)) })}</span></label>
      <div class="hint" id="mvI" style="padding:4px 0"></div>`,
    onMount: m => {
      const upd = () => { const p = plan(colDef($('#mvT', m).value), $('#mvP', m).value); $('#mvI', m).textContent = t('col_move_info', { a: p.move, b: p.conf }); };
      $('#mvT', m).onchange = upd; $('#mvP', m).onchange = upd; upd();
    },
    buttons: [{ label: t('btn_cancel'), v: null }, { label: t('col_move_go'), cls: 'b1', v: m => ({ key: $('#mvT', m).value, pol: $('#mvP', m).value, del: $('#mvD', m).checked }) }]
  });
  if (!res) return false;
  const tc = colDef(res.key); const p = plan(tc, res.pol);
  const bk = await ask({ title: t('conf_title'), text: t('col_move_bk', { a: p.todo.length }), buttons: [{ label: t('btn_cancel'), v: null }, { label: t('col_move_nobk'), v: 'no', cls: 'b3' }, { label: t('col_move_bkgo'), v: 'bk', cls: 'b1' }] });
  if (!bk) return false;
  if (bk === 'bk') { const n = await createBackup(); if (n) toast(t('backup_done', { f: n })); }
  for (const [r, v] of p.todo) updateRecord(r, { [tc.key]: v });
  if (res.del && !src.b) deleteColumn(src.key);
  UI.listKey = ''; scheduleSave();
  toast(t('col_move_done', { n: p.todo.length }), 2500);
  return true;
}
async function colDialog(def) {
  const isNew = !def; let kind = def ? def.kind : 'text';
  const b = def && builtinOf(def.key);
  const nameInp = ['ru', 'tk', 'en'].map(l => `<div class="fld"><div class="lbl">${t('newcol_' + l)}</div><input class="inp" id="nm_${l}" value="${esc(def && def.names ? (def.names[l] || '') : '')}" placeholder="${b ? esc(I18N[l][b.i18n]) : ''}" autocomplete="off"></div>`).join('');
  const afterOpts = isNew ? `<div class="fld"><div class="lbl">${t('insert_after')}</div><select class="inp" id="after"><option value="__start">${t('col_pos_start')}</option>${liveCols().filter(c => c.kind !== 'id').map(c => `<option value="${c.key}">${esc(colName(c))}</option>`).join('')}</select></div>` : '';
  const typeChips = isNew ? `<div class="fld"><div class="lbl">${t('col_type_label')}</div><div class="typechips" id="kinds">${KINDS.map(k => `<button class="chip ${k === kind ? 'on' : ''}" data-k="${k}">${t(KIND_LABEL[k])}</button>`).join('')}</div></div>` : '';
  const optsBox = `<div class="fld ${kind === 'list' ? '' : 'hidden'}" id="optsw"><div class="lbl">${t('col_opts')}</div><textarea class="inp" id="opts" rows="4">${esc((def && def.opts || []).join('\n'))}</textarea></div>`;
  let result = false, wNew;
  const curW = def ? colW(def) : 0;
  const widthBox = isNew ? '' : `<div class="fld"><div class="lbl">${t('col_width')}: <b id="wv">${curW}</b> px</div><div class="typechips" id="wch"><button class="chip" data-p="0.6">${t('w_narrow')}</button><button class="chip" data-p="1">${t('w_mid')}</button><button class="chip" data-p="1.7">${t('w_wide')}</button><button class="chip" data-p="0">${t('w_reset')}</button></div><input type="range" id="wr" min="${CW_MIN}" max="${CW_MAX}" step="2" value="${curW}" style="width:100%;margin-top:8px"></div>`;
  await ask({
    title: isNew ? t('newcol_title') : t('col_edit'), html: nameInp + widthBox + typeChips + optsBox + afterOpts,
    onMount: m => {
      if (!isNew) {
        const wr = $('#wr', m), wv = $('#wv', m);
        wr.oninput = () => { wNew = +wr.value; wv.textContent = wr.value; };
        $$('#wch .chip', m).forEach(ch => ch.onclick = () => { const f = +ch.dataset.p; if (!f) { wNew = 0; wr.value = defW(def); wv.textContent = defW(def); } else { wNew = Math.max(CW_MIN, Math.min(CW_MAX, Math.round(defW(def) * f))); wr.value = wNew; wv.textContent = wNew; } });
      }
      if (isNew) { const s = $('#after', m); s.value = liveCols().filter(c => c.kind !== 'id').slice(-1)[0].key; }
      $$('#kinds .chip', m).forEach(ch => ch.onclick = () => { kind = ch.dataset.k; $$('#kinds .chip', m).forEach(x => x.classList.toggle('on', x === ch)); $('#optsw', m).classList.toggle('hidden', kind !== 'list'); });
      if (!isNew && def.kind !== 'list') $('#optsw', m).classList.add('hidden');
    },
    buttons: [{ label: t('btn_cancel'), v: null }, {
      label: isNew ? t('btn_add') : t('btn_save'), cls: 'b1',
      check: m => { const any = ['ru', 'tk', 'en'].some(l => $('#nm_' + l, m).value.trim()); if (!any && (isNew || !def.b)) { toast(t('col_err_name')); return false; } return true; },
      v: m => {
        const names = {}; ['ru', 'tk', 'en'].forEach(l => names[l] = $('#nm_' + l, m).value.trim());
        const opts = $('#opts', m).value.split('\n').map(x => x.trim()).filter(Boolean);
        if (isNew) addColumn({ names, kind, opts: kind === 'list' ? opts : [], afterKey: $('#after', m).value });
        else { def.names = Object.values(names).some(Boolean) ? names : null; if (def.kind === 'list') def.opts = opts; def.mts = Date.now(); colStamp(); scheduleSave(); }
        if (!isNew && wNew !== undefined) { setColW(def, wNew); saveHeader(); UI.listKey = ''; }
        result = true; return true;
      }
    }],
  });
  if (result) UI.listKey = '';
  return result;
}

// ---------- settings ----------
async function viewSettings(main) {
  const hasPin = Auth.hasPin();
  const bioOk = Native.isApp && await Native.bioAvailable();
  const sc = main.querySelector('.page') ? main.querySelector('.page').scrollTop : 0;
  const alOpts = [[0, t('al_now')], [60, t('al_1')], [300, t('al_5')], [900, t('al_15')], [-1, t('al_never')]];
  const trashN = DB.records.filter(r => r.del && !r.purged).length;
  const bk = H.lastBackup ? t('set_backup_last', { d: fmtDateTime(H.lastBackup) }) : t('backup_never');
  pageShell(main, t('set_title'), `
  <div class="group"><div class="setrow col"><div class="tt">${t('set_lang')}</div>${segHtml('sLang', [['tk', 'Türkmençe'], ['ru', 'Русский'], ['en', 'English']], H.lang).replace('margin:8px 14px', '')}</div>
  ${rowSwitch('sEnc', t('set_encrypt'), t('set_encrypt_sub'), hasPin)}${hasPin ? rowLink('sPw', t('set_password')) : ''}</div>
  ${hasPin ? `<div class="group"><div class="setrow col"><div class="tt">${t('set_autolock')}</div><select class="inp" id="sAl">${alOpts.map(([v, l]) => `<option value="${v}" ${H.autolock === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
  ${rowSwitch('sBio', t('set_bio'), bioOk ? t('set_bio_sub') : t('set_bio_na'), H.bio && bioOk, !bioOk)}
  </div>`: ''}
  <div class="group">${rowSwitch('sRest', t('set_rest'), t('set_rest_sub'), H.rest)}${H.rest ? rowSwitch('sRestUi', t('set_restui'), t('set_restui_sub'), H.restUi) : ''}</div>
  <div class="group">${rowSwitch('sShot', t('set_shot'), Native.canBlockShots() ? t('set_shot_sub') : t('set_shot_na'), H.shot)}</div>
  <div class="group"><div class="setrow col"><div class="tt">${t('set_theme')}</div>${segHtml('sTheme', [['light', t('theme_light')], ['dark', t('theme_dark')]], H.theme)}</div>
  <div class="setrow col"><div class="tt">${t('set_font')}</div>${segHtml('sFont', [['s', t('font_s')], ['m', t('font_m')], ['l', t('font_l')]], H.font)}</div></div>
  <div class="group">${rowLink('sCols', t('set_columns'))}${rowLink('sTrash', t('set_trash'), trashN ? `${trashN}` : '')}
  <div class="setrow"><div class="tt">${t('set_backup')}<div class="ss">${bk}</div>${Native.cap ? `<div class="ss">${t('backup_warn')}</div>` : ''}</div><button class="sbtn" id="sBk">${t('set_backup_btn')}</button></div>
  <div class="setrow"><div class="tt">${t('set_version')}</div><span class="ss">${APP_VERSION}</span></div></div>`);
  main.querySelector('.page').scrollTop = sc;
  const again = () => viewSettings(main);
  $$('#sLang button', main).forEach(b => b.onclick = async () => { await setLang(b.dataset.v); });
  $$('#sTheme button', main).forEach(b => b.onclick = async () => { H.theme = b.dataset.v; applyPrefs(); await saveHeader(); again(); });
  $$('#sFont button', main).forEach(b => b.onclick = async () => { H.font = b.dataset.v; applyPrefs(); await saveHeader(); again(); });
  $('#sRest').onclick = async () => { H.rest = !H.rest; if (!H.rest && UI.filter.includes('rest')) UI.filter = 'all'; UI.listKey = ''; await saveHeader(); again(); };
  if ($('#sRestUi')) $('#sRestUi').onclick = async () => { H.restUi = !H.restUi; if (!H.restUi && (UI.filter === 'rest' || UI.filter === 'notrest')) UI.filter = 'all'; await saveHeader(); again(); };
  if ($('#sAl')) $('#sAl').onchange = async e => { H.autolock = +e.target.value; await saveHeader(); };
  $('#sEnc').onclick = async () => {
    if (hasPin) {
      const pw = await askPassword(t('enc_off_warn'));
      if (pw) { await Native.bioClear(); await Auth.disablePin(); toast(t('enc_off_ok')); }
    } else {
      const pin = await askNewPin(t('set_encrypt'));
      if (pin) { await Auth.enablePin(pin); toast(t('enc_on_ok')); }
    }
    again();
  };
  $('#sShot').onclick = async () => { H.shot = !H.shot; await saveHeader(); await Native.setShotBlock(H.shot); again(); };
  if ($('#sBio')) $('#sBio').onclick = async () => {
    if (!bioOk) return;
    if (H.bio) { await Native.bioClear(); H.bio = false; }
    else { const pw = await askPassword(t('set_bio')); if (pw && await Native.bioSave(pw)) H.bio = true; }
    await saveHeader(); again();
  };
  if ($('#sPw')) $('#sPw').onclick = async () => {
    const pin = await askNewPin(t('set_password'), true);
    if (pin) { await Auth.changePw(pin); if (H.bio) await Native.bioSave(pin); toast(t('pw_ok')); }
  };
  $('#sCols').onclick = () => goRoute('columns'); $('#sTrash').onclick = () => goRoute('trash');
  $('#sBk').onclick = async () => { const n = await createBackup(); if (n) toast(t('backup_done', { f: n })); again(); };
}

// ---------- import / export ----------
function viewIE(main) {
  pageShell(main, t('ie_title'), `<div class="group">${rowLink('iImp', t('ie_import_xlsx'))}${rowLink('iXlsx', t('ie_export_xlsx'))}${rowLink('iCsv', t('ie_export_csv'))}</div>
  <div class="hint">${t('ie_warn_plain')}</div>
  <div class="group">${rowLink('iBk', t('ie_backup'), H.enc ? t('ie_enc_note') : '')}${rowLink('iRs', t('ie_restore'))}</div>`);
  $('#iImp').onclick = () => startImport();
  const plain = fn => async () => { if (await confirmDlg(t('ie_warn_plain'), t('ok'))) await fn(); };
  $('#iXlsx').onclick = plain(exportXlsx); $('#iCsv').onclick = plain(exportCsv);
  $('#iBk').onclick = async () => { const n = await createBackup(); if (n) toast(t('backup_done', { f: n })); };
  $('#iRs').onclick = async () => {
    const f = await pickFile('.json,application/json'); if (!f) return;
    const payload = await readFilePayload(await readText(f), 'backup'); if (!payload) return;
    if (!(await confirmDlg(t('restore_confirm'), t('ie_restore'), true))) return;
    const n = await restoreBackup(payload); UI.listKey = ''; toast(t('restore_ok', { n: fmtInt(n), w: noun('rec', n) }));
  };
}
async function readFilePayload(text, kind) {
  let pw = DB._pw;
  for (let tries = 0; tries < 3; tries++) {
    try { const p = await openFile(text, pw); if (p.kind !== kind) throw new Error('format'); return p; }
    catch (e) {
      if (e.message === 'password') {
        const v = await ask({ title: t('file_pw'), html: `<input class="inp" id="fp" type="password" autocomplete="off">`, buttons: [{ label: t('btn_cancel'), v: null }, { label: t('ok'), cls: 'b1', v: m => $('#fp', m).value }] });
        if (v == null) return null; pw = v; if (tries > 0) toast(t('file_pw_wrong'));
      } else { toast(t('file_err')); return null; }
    }
  }
  toast(t('file_pw_wrong')); return null;
}

// ---------- Excel import ----------
async function startImport() {
  const f = await pickFile('.xlsx,.xls,.csv'); if (!f) return;
  let plan;
  try {
    plan = await withBusy(t('imp_progress'), async () => { const p = buildImportPlan(parseWorkbook(await readBuf(f)), f.name); if (!p.empty) { UI.imp = { plan: p }; recomputeImport(); } return p; });
  } catch (e) { console.error(e); UI.imp = null; toast(t('file_err')); return; }
  if (plan.empty) { UI.imp = null; toast(t('imp_empty')); return; }
  if (UI.route === 'import') renderRoute(); else goRoute('import');
}
function recomputeImport() {
  const I = UI.imp; I.rv = planRowValues(I.plan); const d = detectImportDups(I.plan, I.rv); I.dups = d.dups; I.noInv = d.noInv;
  I.typeBad = I.rv.filter(x => x.typeBad).length;
}
function viewImport(main) {
  const I = UI.imp; if (!I) { UI.route = 'books'; return renderRoute(); }
  const p = I.plan;
  const undet = p.cols.filter(c => c.target === 'new' && c.undetected && !c.chosen);
  const colRows = p.cols.map((c, i) => {
    let st, sel = '', cls = '';
    if (c.reason === 'id') st = t('imp_ignored');
    else if (c.target === 'ignore') {
      st = t('imp_col_ignore');
      // a matched column the user ignored can be switched back (target0 = the column it was matched to)
      const d0 = c.target0 && colDef(c.target0);
      if (d0) sel = `<select data-i="${i}"><option value="keep">${esc(t('imp_matched', { x: colName(d0) }))}</option><option value="ignore" selected>${esc(t('imp_col_ignore'))}</option></select>`;
    }
    else if (c.target === 'new') {
      st = c.undetected && !c.chosen ? t('imp_undetected') : t('imp_new'); if (c.undetected && !c.chosen) cls = 'und';
      sel = `<select data-i="${i}">${c.undetected && !c.chosen ? `<option value="">${t('imp_choose')}</option>` : ''}${KINDS.map(k => `<option value="${k}" ${c.kind === k && (!c.undetected || c.chosen) ? 'selected' : ''}>${t(KIND_LABEL[k])}</option>`).join('')}<option value="ignore" ${c.kind === 'ignore' ? 'selected' : ''}>${t('imp_col_ignore')}</option></select>`;
    } else {
      st = t('imp_matched', { x: colName(colDef(c.target)) });
      sel = `<select data-i="${i}"><option value="keep" selected>${t(KIND_LABEL[colDef(c.target).kind] || 'type_text')}</option><option value="ignore">${t('imp_col_ignore')}</option></select>`;
    }
    return `<div class="fcol ${cls}"><div style="flex:1;min-width:0"><div class="nm">${esc(c.name)}</div><div class="st">${esc(st)}</div></div>${sel}${c.undetected && !c.chosen ? '<span class="pill" style="background:#F0D58A;color:#5C4300">!</span>' : ''}</div>`;
  }).join('');
  const dupRows = I.dups.slice(0, 100).map((d, k) => {
    const v = I.rv[d.row].vals; const kindT = d.kind === 'exact' ? t('imp_dup_kind_exact') : d.kind === 'name' ? t('imp_dup_kind_name') : t('imp_dup_kind_file');
    // same inventory number: only skip / update (in the archive) — "add" would duplicate the number
    const acts = (d.kind === 'file' ? (d.byInv ? ['skip'] : ['skip', 'add']) : (d.byInv ? ['skip', 'update'] : ['skip', 'update', 'add'])).map(a => `<button data-k="${k}" data-a="${a}" class="${d.act === a ? 'on' : ''}">${t('imp_' + a)}</button>`).join('');
    return `<div class="dup"><div class="h"><span>${esc(v.inv)} · ${esc(v.title || '')}</span><span style="color:var(--bad)">${d.id ? 'ID ' + d.id : ''}</span></div><div class="s">${kindT}</div><div class="acts">${acts}</div></div>`;
  }).join('');
  const canAdd = I.rv.filter(x => x.vals.inv).length - I.dups.filter(d => d.act !== 'add').length;
  const newCols = p.cols.filter(c => c.target === 'new' && c.kind !== 'ignore').length;
  pageShell(main, t('imp_title'), `
  <div class="group" style="margin-top:10px"><div class="setrow">${IC.file}<div class="tt">${esc(p.fileName)}<div class="ss">${t('imp_found', { r: fmtInt(p.body.length), rw: noun('row', p.body.length), c: p.nCols, cw: noun('col', p.nCols) })}</div></div></div></div>
  <div class="sect">${t('imp_file_cols')}</div><div class="group">${colRows}</div>
  ${undet.length ? `<div class="banner" style="margin-top:10px">${IC.warn}<span>${t('imp_warn', { x: undet.map(c => c.name).join(', ') })}</span></div>` : ''}
  ${I.noInv ? `<div class="banner" style="margin-top:10px">${IC.warn}<span>${t('imp_no_inv', { n: I.noInv })}</span></div>` : ''}
  ${I.typeBad ? `<div class="banner" style="margin-top:10px">${IC.warn}<span>${t('imp_type_unrec', { n: I.typeBad })}</span></div>` : ''}
  ${I.dups.length ? `<div class="sect">${t('imp_dups')} · ${t('imp_dups_n', { n: I.dups.length, w: noun('dup', I.dups.length) })}</div><div class="hint" style="margin-top:0">${t('imp_dups_sub')}</div>
  <div class="dup"><div class="s">${t('imp_apply_all')}</div><div class="acts"><button data-all="skip">${t('imp_skip')}</button><button data-all="update">${t('imp_update')}</button><button data-all="add">${t('imp_add')}</button></div></div>${dupRows}
  ${I.dups.length > 100 ? `<div class="hint">${t('ch_more', { n: I.dups.length - 100 })}</div>` : ''}
  <div style="padding:6px 12px"><button class="sbtn" id="dupX">${t('imp_dups_export')}</button></div>` : ''}
  <div class="hint" style="text-align:center;margin-top:16px">${t('imp_summary', { a: fmtInt(Math.max(0, canAdd)), w: noun('rec', canAdd), c: newCols })}</div>
  ${undet.length ? `<div class="hint" style="text-align:center;color:var(--bad);margin-top:0">${t('imp_load_hint', { x: undet[0].name })}</div>` : ''}
  <div style="padding:6px 12px"><button class="btn b1" id="load" style="width:100%" ${undet.length ? 'disabled' : ''}>${t('imp_load')}</button></div>`);
  $$('.fcol select', main).forEach(s => s.onchange = () => {
    const c = p.cols[+s.dataset.i]; const v = s.value;
    if (c.target === 'new') { if (v) { c.kind = v; c.chosen = true; } }
    else if (v === 'ignore') { if (c.target !== 'ignore') { c.target0 = c.target; c.target = 'ignore'; } }
    else if (v === 'keep' && c.target === 'ignore' && c.target0) { c.target = c.target0; c.target0 = null; }
    withBusy(t('imp_progress'), async () => recomputeImport()).then(() => viewImport(main));
  });
  $$('.acts button[data-a]', main).forEach(b => b.onclick = () => { I.dups[+b.dataset.k].act = b.dataset.a; viewImport(main); });
  const actOk = (d, a) => !(a === 'update' && d.kind === 'file') && !(a === 'add' && d.byInv);
  $$('.acts button[data-all]', main).forEach(b => b.onclick = () => { I.dups.forEach(d => { if (actOk(d, b.dataset.all)) d.act = b.dataset.all; }); viewImport(main); });
  const dx = $('#dupX'); if (dx) dx.onclick = () => exportDupsXlsx(p, I.rv, I.dups);
  $('#load').onclick = async () => {
    const st = await withBusy(t('imp_progress'), async () => { const x = applyImport(p, I.rv, I.dups); await flushSave(); return x; }); UI.imp = null; UI.listKey = '';
    toast(t('imp_result', { a: st.added, u: st.updated, s: st.skipped }), 4000);
    goRoute('books'); refreshList();
  };
}

// ---------- sync ----------
// ---------- Wi-Fi block ----------
const lanClientOk = () => !window.MirasLan && (deviceKind() === 'phone' || window.__lanTest);
function lanStatsHtml(st) {
  if (!st) return '';
  const parts = [t('lan_res', { a: st.added, c: st.changed + st.merged, d: st.deleted })];
  if (st.rep && (st.rep.added || st.rep.changed || st.rep.removed)) parts.push(t('sync_rep', { a: st.rep.added, c: st.rep.changed, r: st.rep.removed }));
  return `<div class="hint" style="text-align:center">${parts.map(esc).join('<br>')}</div>`;
}
function lanBlockHtml() {
  if (window.MirasLan) {
    if (!LAN.on) return `<div class="sect">${t('lan_title')}</div><div class="hint">${t('lan_pc_hint')}</div><div style="padding:6px 12px"><button class="btn b1" id="lnStart" style="width:100%">${t('lan_wait_btn')}</button>${LAN.last ? lanStatsHtml(LAN.last) : ''}</div>`;
    return `<div class="sect">${t('lan_title')}</div><div class="group lan" style="padding:12px">
      <div class="ss">${t('lan_urls')}</div>${LAN.urls.length ? LAN.urls.map(u => `<div class="lan-url">${esc(u.replace(/^http:\/\//, ''))}</div>`).join('') : `<div class="lan-url">–</div>`}
      <div class="ss" style="margin-top:8px">${t('lan_code_lbl')}</div><div class="lan-code">${esc(String(LAN.code).replace(/(\d{3})(?=\d)/g, '$1 '))}</div>
      <div class="ss" style="margin-top:8px">${LAN.last ? t('lan_last', { t: fmtDateTime(LAN.last.at) }) : t('lan_listening')}${LAN.bad ? ` · ${t('lan_bad', { n: LAN.bad })}` : ''}</div>${LAN.last ? lanStatsHtml(LAN.last) : ''}</div>
      <div style="padding:6px 12px"><button class="btn b2" id="lnStop" style="width:100%">${t('lan_stop')}</button></div>`;
  }
  if (!lanClientOk()) return '';
  return `<div class="sect">${t('lan_title')}</div><div class="hint">${t('lan_phone_hint')}</div><div style="padding:0 12px 6px">
    <div class="lbl">${t('lan_addr')}</div><input class="inp" id="lnAddr" inputmode="url" autocomplete="off" placeholder="192.168.1.5:${LAN_PORT}" value="${esc(H.lanAddr || '')}">
    <div class="lbl" style="margin-top:8px">${t('lan_code')}</div><input class="inp" id="lnCode" inputmode="numeric" autocomplete="off" maxlength="11" placeholder="000 000 000">
    <button class="btn b1" id="lnGo" style="width:100%;margin-top:10px">${t('lan_go')}</button></div>`;
}
function bindLan(main) {
  const st = $('#lnStart'), sp = $('#lnStop'), go = $('#lnGo');
  const errToast = e => toast(t({ code: 'lan_err_code', locked: 'lan_err_locked', wait: 'lan_err_wait', port: 'lan_err_port' }[e && e.message] || 'lan_err_net'), 4500);
  if (st) st.onclick = async () => { try { await lanStartPc(); } catch (e) { errToast(e); } viewSync(main); };
  if (sp) sp.onclick = async () => { await lanStopPc(); viewSync(main); };
  if (go) go.onclick = async () => {
    const addr = $('#lnAddr').value.trim(), code = $('#lnCode').value.replace(/\s+/g, '');
    if (!addr) { $('#lnAddr').focus(); return; }
    if (!/^\d{9}$/.test(code)) { toast(t('lan_err_code')); $('#lnCode').focus(); return; }
    H.lanAddr = addr; saveHeader();
    let r; try { r = await withBusy(t('lan_working'), () => lanSyncClient(addr, code)); } catch (e) { errToast(e); return; }
    UI.sync = { plan: r.plan, name: 'Wi-Fi', done: true, renum: r.renum, wifi: true }; UI.listKey = ''; viewSync(main);
  };
}
function viewSync(main) {
  const S = UI.sync;
  if (!S) {
    pageShell(main, t('sync_title'), `<div class="hint">${t('sync_hint')}</div><div style="display:flex;gap:10px;padding:6px 12px"><button class="btn b3" id="syCreate">${t('sync_create')}</button><button class="btn b1" id="syChoose">${t('sync_choose')}</button></div>${lanBlockHtml()}`);
    bindLan(main);
    $('#syCreate').onclick = async () => { const n = await createSyncFile(); if (n) toast(t('sync_created', { f: n }), 4000); };
    $('#syChoose').onclick = async () => {
      const f = await pickFile('.json,application/json'); if (!f) return;
      const payload = await readFilePayload(await readText(f), 'sync'); if (!payload) return;
      let plan; try { plan = planMerge(payload); } catch { toast(t('file_err')); return; }
      if (plan.identical) { toast(t('sync_none'), 3500); return; }
      UI.sync = { plan, name: f.name }; viewSync(main);
    };
    return;
  }
  const P = S.plan;
  if (S.done) {
    pageShell(main, t('sync_title'), `<div class="empty"><b>${t('sync_done')}</b>${S.renum ? `<div>${t('sync_renum', { n: S.renum })}</div>` : ''}</div>${lanStatsHtml(planStats(P))}
    <div style="display:flex;flex-direction:column;gap:10px;padding:6px 12px">${S.wifi ? '' : `<button class="btn b3" id="syRet">${t('sync_return')}</button>`}<button class="btn b1" id="syBack">${t('nav_books')}</button></div>`);
    if (!S.wifi) $('#syRet').onclick = async () => { const n = await createSyncFile(); if (n) toast(t('sync_created', { f: n }), 4000); };
    $('#syBack').onclick = () => { UI.sync = null; UI.listKey = ''; goRoute('books'); };
    return;
  }
  const dl = k => deviceLabel(k);
  const showList = (arr, mk) => arr.slice(0, 40).map(mk).join('') + (arr.length > 40 ? `<div class="hint">${t('ch_more', { n: arr.length - 40 })}</div>` : '');
  const head = x => `<b>${esc(x.inv || '')} · ${esc(x.title || t('title_untitled'))}</b>`;
  const diffLines = (diffs) => diffs.slice(0, 4).map(d => `<div>${esc(t('ch_field', { f: colName(d.c), a: showVal(d.c, d.a), b: showVal(d.c, d.b) }))}</div>`).join('') + (diffs.length > 4 ? `<div>${t('ch_more', { n: diffs.length - 4 })}</div>` : '');
  pageShell(main, t('sync_title'), `
  <div class="group" style="margin-top:10px"><div class="setrow">${IC.file}<div class="tt">${esc(S.name)}<div class="ss">${t('sync_from2', { d: dl(P.fromKind), n: fmtInt(P.fromCount), w: noun('rec', P.fromCount) })}</div></div></div></div>
  <div class="sect">${t('sync_report')}</div>
  <div class="tiles"><div class="tile a"><b>${P.added.length}</b><span>${t('t_added')}</span></div><div class="tile"><b>${P.changed.length + P.merged.length}</b><span>${t('t_changed')}</span></div><div class="tile d"><b>${P.deleted.length}</b><span>${t('t_deleted')}</span></div></div>
  ${P.colChanges ? `<div class="hint" style="margin-top:0">${t('sync_cols', { n: P.colChanges })}</div>` : ''}
  ${showList(P.added, x => `<div class="rep">${head(x)}<div>${t('ch_new')}</div></div>`)}
  ${showList(P.changed, x => `<div class="rep">${head(x)}${x.lines ? x.lines.map(l => `<div>${esc(l)}</div>`).join('') : diffLines(x.diffs)}</div>`)}
  ${showList(P.merged, x => `<div class="rep">${head(x)}<div>${t('ch_merged')}</div>${x.diffs.length ? diffLines(x.diffs) : ''}${(x.lines || []).map(l => `<div>${esc(l)}</div>`).join('')}</div>`)}
  ${P.rep ? `<div class="hint" style="margin-top:0">${t('sync_rep', { a: P.rep.stat.added, c: P.rep.stat.changed, r: P.rep.stat.removed })}</div>` : ''}
  ${showList(P.deleted, x => `<div class="rep">${head(x)}<div style="color:var(--bad)">${t('ch_deleted_here')}</div></div>`)}
  ${P.conflicts.length ? `<div class="sect">${t('t_conflicts')}</div><div style="padding:0 12px 6px;display:flex;gap:8px"><button class="sbtn" id="syNewer">${t('keep_newer')}</button><button class="sbtn" id="syLocal">${t('sync_keep_dev')}</button></div>` : ''}
  ${showList(P.conflicts, (x) => { const k = P.conflicts.indexOf(x); const d0 = x.diffs[0]; const names = x.diffs.map(d => colName(d.c)).join(', ') || t('ch_deleted_here');
    const la = d0 ? showVal(d0.c, d0.a) : (x.local.del ? t('ch_deleted_here') : t('ch_restored')); const lb = d0 ? showVal(d0.c, d0.b) : (x.remote.del ? t('ch_deleted_here') : t('ch_restored'));
    return `<div class="rep cf">${head(x)}<div>${esc(t('ch_conflict_sub', { f: names }))}</div><div class="two"><button data-c="${k}" data-v="local" class="${x.choice === 'local' ? 'on' : ''}">${dl(deviceKind())}: «${esc(la)}»</button><button data-c="${k}" data-v="remote" class="${x.choice === 'remote' ? 'on' : ''}">${dl(P.fromKind)}: «${esc(lb)}»</button></div></div>`; })}
  <div style="display:flex;gap:10px;padding:14px 12px"><button class="btn b2" id="syCancel">${t('btn_cancel')}</button><button class="btn b1" id="syApply">${t('apply')}</button></div>`);
  $$('.rep .two button', main).forEach(b => b.onclick = () => { P.conflicts[+b.dataset.c].choice = b.dataset.v; viewSync(main); });
  if ($('#syNewer')) { $('#syNewer').onclick = () => { setAllConflicts(P, 'newer'); viewSync(main); }; $('#syLocal').onclick = () => { setAllConflicts(P, 'local'); viewSync(main); }; }
  $('#syCancel').onclick = () => { UI.sync = null; viewSync(main); };
  $('#syApply').onclick = async () => { const r = await applyMerge(P); UI.sync = { ...S, done: true, renum: r.renum }; UI.listKey = ''; viewSync(main); };
}
