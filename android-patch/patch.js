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
// 4) sign debug builds with the permanent key at ~/.android/debug.keystore (explicit, so Gradle cannot create a random one)
const gp = 'android/app/build.gradle';
let g = fs.readFileSync(gp, 'utf8');
if (!g.includes('MIRAS_SIGNING')) {
  g += `\n// MIRAS_SIGNING\nandroid {\n    signingConfigs {\n        debug {\n            storeFile file("${'$'}{System.getProperty('user.home')}/.android/debug.keystore")\n            storePassword 'android'\n            keyAlias 'androiddebugkey'\n            keyPassword 'android'\n        }\n    }\n}\n`;
  fs.writeFileSync(gp, g);
}
// 5) MainActivity: JS bridge to colour the areas behind the status / navigation bars (top colour, bottom colour)
{
  const dir = 'android/app/src/main/java/app/miras/archive', f = dir + '/MainActivity.java';
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(f, `package app.miras.archive;

import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.LayerDrawable;
import android.graphics.drawable.ColorDrawable;
import android.view.Gravity;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();
        if (getBridge() == null || getBridge().getWebView() == null) return;
        getBridge().getWebView().addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void set(final String top, final String bottom) {
                runOnUiThread(new Runnable() { public void run() {
                    try {
                        int t = Color.parseColor(top), b = Color.parseColor(bottom);
                        int h = getResources().getDisplayMetrics().heightPixels;
                        ColorDrawable cb = new ColorDrawable(b), ct = new ColorDrawable(t);
                        LayerDrawable ld = new LayerDrawable(new android.graphics.drawable.Drawable[] { cb, ct });
                        ld.setLayerGravity(1, Gravity.TOP);
                        ld.setLayerHeight(1, h / 2);
                        getWindow().getDecorView().setBackground(ld);
                    } catch (Exception e) { }
                } });
            }
        }, "MirasBars");
    }
}
`);
}
console.log('android patched');
