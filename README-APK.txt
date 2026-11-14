Сборка Miras.apk (нужны Node.js 20+, JDK 21, Android Studio/SDK). Ключ (keystore) хранить в двух местах!
1) npm install
2) npm run apk:init        (создаёт папку android и патчит манифест)
3) npx cap sync android && cd android && ./gradlew assembleDebug
APK: android/app/build/outputs/apk/debug/app-debug.apk
Для обновлений поверх старой версии подписывать ВСЕГДА одним и тем же ключом.
Windows .exe: npm run pc:build  (результат dist/Miras.exe)
