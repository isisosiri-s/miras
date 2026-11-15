// Run once after `npx cap add android`: predictive back, light status-bar icons, Miras launcher icon.
const fs = require('fs'), path = require('path');
const res = 'android/app/src/main/res';
// 1) manifest: predictive back gesture
const mp = 'android/app/src/main/AndroidManifest.xml';
let x = fs.readFileSync(mp, 'utf8');
if (!x.includes('enableOnBackInvokedCallback')) x = x.replace('<application', '<application android:enableOnBackInvokedCallback="true"');
// Wi-Fi sync talks plain http to the PC on the local network (the data itself is encrypted with the pairing code)
if (!x.includes('usesCleartextTraffic')) x = x.replace('<application', '<application android:usesCleartextTraffic="true"');
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
// 5) native plugin MirasBars: colour the areas behind the status / navigation bars (top colour, bottom colour)
{
  const dir = 'android/app/src/main/java/app/miras/archive';
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dir + '/MirasBarsPlugin.java', `package app.miras.archive;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.view.Gravity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MirasBars")
public class MirasBarsPlugin extends Plugin {
    @PluginMethod
    public void set(final PluginCall call) {
        final String top = call.getString("top", "#5B3A1E");
        final String bottom = call.getString("bottom", "#F6F1E9");
        getActivity().runOnUiThread(new Runnable() { public void run() {
            try {
                int t = Color.parseColor(top), b = Color.parseColor(bottom);
                int h = getActivity().getResources().getDisplayMetrics().heightPixels;
                LayerDrawable ld = new LayerDrawable(new Drawable[] { new ColorDrawable(b), new ColorDrawable(t) });
                ld.setLayerGravity(1, Gravity.TOP);
                ld.setLayerHeight(1, h / 2);
                getActivity().getWindow().getDecorView().setBackground(ld);
                call.resolve();
            } catch (Exception e) { call.reject(String.valueOf(e)); }
        } });
    }
}
`);
  fs.writeFileSync(dir + '/MirasFilesPlugin.java', `package app.miras.archive;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "MirasFiles")
public class MirasFilesPlugin extends Plugin {
    @PluginMethod
    public void save(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType(call.getString("mime", "application/octet-stream"));
        i.putExtra(Intent.EXTRA_TITLE, call.getString("name", "miras.bin"));
        startActivityForResult(call, i, "saveDone");
    }

    @ActivityCallback
    private void saveDone(PluginCall call, ActivityResult result) {
        if (call == null) return;
        JSObject o = new JSObject();
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            o.put("saved", false); call.resolve(o); return;
        }
        try {
            Uri dest = result.getData().getData();
            String path = Uri.parse(call.getString("src")).getPath();
            InputStream in = new FileInputStream(path);
            OutputStream out = getContext().getContentResolver().openOutputStream(dest);
            byte[] buf = new byte[65536]; int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            out.flush(); out.close(); in.close();
            o.put("saved", true); call.resolve(o);
        } catch (Exception e) { call.reject(String.valueOf(e)); }
    }
}
`);
  fs.writeFileSync(dir + '/MainActivity.java', `package app.miras.archive;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MirasBarsPlugin.class);
        registerPlugin(MirasFilesPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`);
}
console.log('android patched');
