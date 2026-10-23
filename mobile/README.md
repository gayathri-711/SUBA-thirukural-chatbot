# SUBA Mobile — React Native & Expo Application 📱

Native mobile app for **SUBA — AI Thirukkural Wisdom Chatbot** featuring a floating chatbot widget, offline UI, all 1,330 Kurals, and EAS Build APK generator.

---

## 🌟 Features

- **Visible Chatbot Widget**: Floating circular button on the Home screen labeled **"Ask SUBA • சுபாவிடம் கேட்க"** with active online indicator and quick suggestions.
- **Full-Screen Interactive Chat Panel**:
  - Grounded answers powered by 1,330 Thirukkural couplets
  - Kural card display with couplet, Tamil explanation, and English meaning
  - Actionable life takeaways (*வாழ்வியல் பாடம்*)
  - Typing indicator and error/retry states
- **Explore & Search 1,330 Kurals**:
  - Filter by *அறத்துப்பால்*, *பொருட்பால்*, *காமத்துப்பால்*
  - Search by Kural number (1–1330) or keyword
- **Kural of the Day**: Daily couplet reflection
- **Bookmark & History**: Save favorite Kurals and view question history
- **Network & Server Settings**: Live connection test and custom server IP configuration

---

## 📲 How to Test on Your Phone with Expo Go

1. Make sure your phone and computer are on the **same Wi-Fi network**.
2. Open terminal in the `mobile` folder:
   ```bash
   cd mobile
   npx expo start
   ```
3. Open the **Expo Go** app on your Android phone (logged in as `gayathri711`).
4. Scan the QR code displayed in the terminal.
5. In the app settings (⚙️), test the connection to `http://192.168.0.9:8000/api`.

---

## 📦 How to Build the Standalone Android APK

To generate a direct `.apk` file you can install on any Android phone:

1. Open terminal in `mobile/`:
   ```bash
   cd mobile
   npx eas-cli build -p android --profile preview
   ```
2. When prompted to generate an Android Keystore, press **Enter** (EAS will generate and manage it automatically).
3. EAS will build the `.apk` on the cloud.
4. When finished (approx. 5 minutes), EAS will display a **direct download URL and QR code** to install `SUBA.apk` directly on your phone!
5. You can also view and download all your APK builds at:
   https://expo.dev/accounts/gayathri711/projects/suba-thirukkural/builds
