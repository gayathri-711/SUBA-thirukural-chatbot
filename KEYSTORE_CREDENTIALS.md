# SUBA — Android APK Signing Key & Keystore Credentials 🔑

Your official Android release signing key has been generated and placed in the project.

---

## 📋 Keystore Information

| Property | Value |
| :--- | :--- |
| **Keystore File** | `suba-release-key.keystore` |
| **Key Alias** | `suba_key` |
| **Keystore Password** | `Gayathri@443` |
| **Key Password** | `Gayathri@443` |
| **Key Type** | `PKCS12` (2048-bit RSA) |
| **Signature Algorithm** | `SHA256withRSA` |
| **Validity** | 10,000 Days (Valid until March 2054) |
| **Owner (DName)** | `CN=SUBA, OU=Mobile, O=SUBA Thirukkural, L=Chennai, ST=Tamil Nadu, C=IN` |

---

## 🛡️ Certificate Fingerprints

- **SHA-1 Fingerprint**:
  ```text
  2B:43:D8:6E:43:BD:13:1F:7F:28:3D:7E:30:20:E4:06:DE:A1:A9:0B
  ```
- **SHA-256 Fingerprint**:
  ```text
  6F:AC:67:AA:17:8D:B4:48:7D:80:16:F7:B3:D5:3D:98:F2:E6:7B:82:72:93:B9:7C:42:D5:08:8B:22:67:F6:CE
  ```

---

## 📂 Keystore Locations in Project

1. Root: `c:\Users\janan\Downloads\thirukural chatbot\suba-release-key.keystore`
2. Mobile: `c:\Users\janan\Downloads\thirukural chatbot\mobile\suba-release-key.keystore`
3. Capacitor Android: `c:\Users\janan\Downloads\thirukural chatbot\frontend\android\app\suba-release-key.keystore`

---

## 🛠️ How to Sign an APK Manually (If Needed)

If signing an APK with `apksigner` or `jarsigner`:

```bash
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore suba-release-key.keystore app-unsigned.apk suba_key
```
Password when prompted: `Gayathri@443`
