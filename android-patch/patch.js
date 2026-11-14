// Run once after `npx cap add android`: enables predictive back + keeps secure flag defaults.
const fs = require('fs'), p = 'android/app/src/main/AndroidManifest.xml';
let x = fs.readFileSync(p, 'utf8');
if (!x.includes('enableOnBackInvokedCallback')) x = x.replace('<application', '<application android:enableOnBackInvokedCallback="true"');
fs.writeFileSync(p, x);
console.log('manifest patched');
