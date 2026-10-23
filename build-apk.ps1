param(
    [switch]$OpenInStudio
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = $PSScriptRoot
$FrontendDir = Join-Path $ProjectRoot 'frontend'
$AndroidDir  = Join-Path $FrontendDir 'android'
$OutputDir   = Join-Path $ProjectRoot 'dist-apk'

Write-Host '==========================================================' -ForegroundColor Cyan
Write-Host '   SUBA - AI Thirukkural Wisdom Chatbot (APK Builder)     ' -ForegroundColor Yellow
Write-Host '==========================================================' -ForegroundColor Cyan

# 1. Ensure JDK 17
if (-not $env:JAVA_HOME) {
    if (Test-Path 'C:\Program Files\Java\jdk-17') {
        $env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'
        Write-Host '[*] Configured JAVA_HOME: C:\Program Files\Java\jdk-17' -ForegroundColor Green
    } elseif (Test-Path 'C:\Program Files\Java\jdk-18.0.2.1') {
        $env:JAVA_HOME = 'C:\Program Files\Java\jdk-18.0.2.1'
        Write-Host '[*] Configured JAVA_HOME: C:\Program Files\Java\jdk-18.0.2.1' -ForegroundColor Green
    } else {
        Write-Warning 'JAVA_HOME is not set.'
    }
} else {
    Write-Host "[*] Using JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
}

# 2. Build Vite Frontend & Sync Capacitor Android
Write-Host ''
Write-Host '[1/3] Building Web App and Syncing Android Assets...' -ForegroundColor Cyan
Set-Location $FrontendDir
npm run mobile:build

# 3. Check if user requested opening in Android Studio
if ($OpenInStudio) {
    Write-Host 'Opening Android project in Android Studio...' -ForegroundColor Cyan
    npx cap open android
    exit 0
}

# 4. Check for Android SDK
$SdkPath = $null
if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) {
    $SdkPath = $env:ANDROID_HOME
} elseif ($env:ANDROID_SDK_ROOT -and (Test-Path $env:ANDROID_SDK_ROOT)) {
    $SdkPath = $env:ANDROID_SDK_ROOT
} elseif (Test-Path "$env:LOCALAPPDATA\Android\Sdk") {
    $SdkPath = "$env:LOCALAPPDATA\Android\Sdk"
}

# 5. Build APK via Gradle if SDK is available
if ($SdkPath) {
    Write-Host ''
    Write-Host "[2/3] Android SDK detected at: $SdkPath" -ForegroundColor Green
    
    $LocalPropsPath = Join-Path $AndroidDir 'local.properties'
    $EscapedSdkPath = $SdkPath -replace '\\', '\\'
    "sdk.dir=$EscapedSdkPath" | Out-File -FilePath $LocalPropsPath -Encoding utf8

    Write-Host ''
    Write-Host '[3/3] Compiling Debug APK with Gradle...' -ForegroundColor Cyan
    Set-Location $AndroidDir
    .\gradlew.bat assembleDebug

    $ApkSource = Join-Path $AndroidDir 'app\build\outputs\apk\debug\app-debug.apk'
    if (Test-Path $ApkSource) {
        if (-not (Test-Path $OutputDir)) {
            New-Item -ItemType Directory -Path $OutputDir | Out-Null
        }
        $TargetApk = Join-Path $OutputDir 'SUBA-Thirukkural.apk'
        Copy-Item -Path $ApkSource -Destination $TargetApk -Force
        
        Write-Host ''
        Write-Host '==========================================================' -ForegroundColor Green
        Write-Host '   [SUCCESS] APK GENERATED SUCCESSFULLY!                 ' -ForegroundColor Green
        Write-Host '==========================================================' -ForegroundColor Green
        Write-Host "APK Location: $TargetApk" -ForegroundColor Yellow
        Write-Host 'You can transfer this APK to your Android device and install it.' -ForegroundColor White
        exit 0
    }
} else {
    Write-Host ''
    Write-Host '[!] Android SDK is not yet installed on this PC.' -ForegroundColor Yellow
    Write-Host 'You have two fast ways to get your APK file:' -ForegroundColor White
    Write-Host ''
    Write-Host 'OPTION 1 (Cloud Build via GitHub Actions - No installation needed):' -ForegroundColor Cyan
    Write-Host '  Push this repository to GitHub. The workflow .github/workflows/build-apk.yml' -ForegroundColor White
    Write-Host '  will build the APK in the cloud and let you download it under the Actions tab.' -ForegroundColor White
    Write-Host ''
    Write-Host 'OPTION 2 (Using Android Studio):' -ForegroundColor Cyan
    Write-Host '  1. Install Android Studio (https://developer.android.com/studio)' -ForegroundColor White
    Write-Host '  2. Run: npm run mobile:open (or .\build-apk.ps1 -OpenInStudio)' -ForegroundColor White
    Write-Host '  3. In Android Studio, click Build -> Build Bundle(s) / APK(s) -> Build APK(s)' -ForegroundColor White
    Write-Host ''
    Write-Host 'All Android project files, Capacitor bridges, and network permissions are ready!' -ForegroundColor Green
}
