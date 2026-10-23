# SUBA Thirukkural — Android APK Generation Guide 📱

The web application has been converted into a native Android project using **Capacitor**. The project includes full offline UI caching, cleartext network traffic permissions (for local network backend connection), and dynamic server URL configuration.

---

## 🛠️ What Has Been Configured

1. **Capacitor Android Core**: Integrated into `frontend/` with package ID `com.suba.thirukkural` and app name `SUBA Thirukkural`.
2. **Network Security & Permissions**: `AndroidManifest.xml` includes:
   - `<uses-permission android:name="android.permission.INTERNET" />`
   - `android:usesCleartextTraffic="true"` (Allows connecting to `http://` backend IPs on local Wi-Fi).
3. **Dynamic Server URL in App**: In **AI Settings** (`⚙️`), you can configure the backend URL (e.g. `http://192.168.1.15:8000/api` or `https://your-server.onrender.com/api`).
4. **Automated Cloud Build**: `.github/workflows/build-apk.yml` builds `app-debug.apk` on GitHub for free.
5. **Local Helper Script**: `build-apk.ps1` automates compiling and exporting the APK.

---

## 🚀 How to Generate the APK

### Method 1: Cloud Build with GitHub Actions (Easiest — No Local SDK Required)

You do **not** need to install 10GB of Android Studio on your computer:
1. Commit and push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Add Capacitor Android and APK build configuration"
   git push origin main
   ```
2. On GitHub, go to the **Actions** tab.
3. The workflow **"Build SUBA Android APK"** will run automatically.
4. Once completed (approx. 2-3 minutes), click on the run and scroll to **Artifacts**.
5. Download **`SUBA-Thirukkural-debug-apk.zip`**, extract `app-debug.apk`, and install it on your Android phone!

---

### Method 2: Using Android Studio (Local GUI)

1. Download and install [Android Studio](https://developer.android.com/studio).
2. Open terminal in `frontend/` and run:
   ```bash
   npm run mobile:open
   ```
3. Android Studio will open the `frontend/android` project.
4. In the top menu bar, click:
   **Build** ➔ **Build Bundle(s) / APK(s)** ➔ **Build APK(s)**.
5. When complete, a notification will appear with a **"locate"** link to your `app-debug.apk`.

---

### Method 3: Using PowerShell CLI Script

If you have Android SDK installed locally:
```powershell
.\build-apk.ps1
```
The script will build the frontend, sync Capacitor, compile with Gradle using JDK 17, and output the APK into `./dist-apk/SUBA-Thirukkural-v1.0.apk`.

---

## 🌐 Connecting the Mobile App to the Backend

When running on an Android device:
- The phone cannot reach `http://localhost:8000` because `localhost` refers to the phone itself.
- **For local testing over Wi-Fi**:
  1. Find your computer's IP address (run `ipconfig` in PowerShell, e.g. `192.168.1.15`).
  2. Start the FastAPI backend with host `0.0.0.0`:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
     ```
  3. In the SUBA Android app, click the **Settings / AI Model** button (⚙️), and set **Backend Server URL** to:
     ```
     http://192.168.1.15:8000/api
     ```
- **For cloud deployment**:
  Host the backend on Render, Railway, or Fly.io and enter your HTTPS URL in the app settings.
