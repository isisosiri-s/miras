// Run once after `npx cap add android`: predictive back, light status-bar icons, Miras launcher icon.
const fs = require('fs'), path = require('path');
const res = 'android/app/src/main/res';
// 1) manifest: predictive back gesture
const mp = 'android/app/src/main/AndroidManifest.xml';
let x = fs.readFileSync(mp, 'utf8');
if (!x.includes('enableOnBackInvokedCallback')) x = x.replace('<application', '<application android:enableOnBackInvokedCallback="true"');
fs.writeFileSync(mp, x);
// 2) theme: light (white) status-bar icons — our top bar is dark brown
const sp = path.join(res, 'values/styles.xml');
if (fs.existsSync(sp)) {
  let s = fs.readFileSync(sp, 'utf8');
  if (!s.includes('windowLightStatusBar')) s = s.replace(/(<style name="AppTheme\.NoActionBar"[^>]*>)/, '$1\n        <item name="android:windowLightStatusBar">false</item>\n        <item name="android:windowLightNavigationBar">false</item>');
  fs.writeFileSync(sp, s);
}
// 3) launcher icon
function copyDir(src, dst) {
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const a = path.join(src, e.name), b = path.join(dst, e.name);
    if (e.isDirectory()) { fs.mkdirSync(b, { recursive: true }); copyDir(a, b); } else fs.copyFileSync(a, b);
  }
}
copyDir('android-res', res);
const any = path.join(res, 'mipmap-anydpi-v26'); fs.mkdirSync(any, { recursive: true });
const adaptive = '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n';
fs.writeFileSync(path.join(any, 'ic_launcher.xml'), adaptive);
fs.writeFileSync(path.join(any, 'ic_launcher_round.xml'), adaptive);
// remove template vector foreground/background that could clash
for (const f of ['drawable-v24/ic_launcher_foreground.xml', 'drawable/ic_launcher_background.xml']) { const p = path.join(res, f); if (fs.existsSync(p)) fs.unlinkSync(p); }
console.log('android patched');
