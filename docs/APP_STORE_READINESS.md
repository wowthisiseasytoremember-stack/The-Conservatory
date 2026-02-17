# APP STORE READINESS AUDIT

This document outlines the gap analysis between the current state of "The Conservatory" and a production-ready application suitable for the Google Play Store and Apple App Store.

## 1. Status Summary

| Area                   | Status          | Readiness Score | Critical Gaps                                                                               |
| ---------------------- | --------------- | --------------- | ------------------------------------------------------------------------------------------- |
| **Core Functionality** | 🟢 Functional   | 90%             | None. Core loops (Voice, Vision, Research) work.                                            |
| **User Experience**    | 🟡 Polished MVP | 70%             | Loading states, error boundaries, empty states are good. Needs onboarding flow.             |
| **Mobile Native**      | 🔴 Web Only     | 0%              | **MAJOR GAP**. Currently a PWA/Web App. No Capacitor/React Native integration.              |
| **Compliance**         | 🟠 Partial      | 40%             | Privacy Policy missing. "Delete Account" flow exists but manual. Terms of Service missing.  |
| **Assets**             | 🟠 Minimal      | 30%             | App Icon exists. Splash screen missing. screenshot assets missing.                          |
| **Performance**        | 🟡 Unverified   | 50%             | Works on high-end devices. Low-end Android testing needed. Bundle size optimization needed. |

**Verdict**: The application **logic** is ready. The **packaging and compliance** layer is completely missing. You cannot submit this to the App Store today.

---

## 2. Technical Gaps (The "Hard" Stuff)

### 2.1 Native Wrapper (Missing)

You are currently building a React Web Application (`vite`). To ship to App Stores, you need a native wrapper.

- **Solution**: Install **CapacitorJS**.
- **Effort**: Medium (1-2 days).
- **Why**: It wraps your build in a WebView and provides native plugins (Camera, Haptics, Status Bar).
- **Current Blocker**: Your `Camera` and `Voice` features rely on Web APIs (`navigator.mediaDevices`, `webkitSpeechRecognition`). These **will fail** inside a standard WebView on iOS without specific native permissions and polyfills.

### 2.2 Permissions Handling

- **iOS**: Requires `Info.plist` modifications to explain _why_ you need Camera (NSCameraUsageDescription) and Microphone (NSMicrophoneUsageDescription).
- **Android**: Requires `AndroidManifest.xml` updates.
- **Current State**: Handled implicitly by browser. Needs explicit native config.

### 2.3 Offline Capability

- **Current State**: `MockFirestoreService` exists, but true offline-first persistence (SQLite or fully configured Firestore Offline Persistence) needs verification on native devices.
- **Requirement**: App must not crash if opened in Airplane mode.

---

## 3. Compliance Gaps (The "Legal" Stuff)

### 3.1 Account Deletion (Apple Requirement)

- **Rule**: Apps that support account creation MUST support account deletion within the app.
- **Status**: You added a "Clear Database" button (Good!), but does it actually delete the Firebase Auth user?
- **Fix**: Update the logic to also call `user.delete()`.

### 3.2 Privacy Policy

- **Rule**: App Store requires a URL to a privacy policy.
- **Content**: Must disclose usage of Google Gemini (AI), Camera data, and Voice data.
- **Status**: Missing.

### 3.3 User Generated Content (UGC) policies

- **Rule**: Since users generate content (habitats, notes), you need a EULA processing that you are not liable for their content, and a mechanism to report/block if it were social (it's not, so this is lower risk, but AI generation is considered UGC by Apple).
- **AI Disclaimer**: You must label AI-generated content (Enrichment) as such.

---

## 4. Asset Gaps (The "Polish" Stuff)

### 4.1 Icons & Splash

- Need `adaptive-icon.png` (Android) and `AppIcon.appiconset` (iOS) in many sizes.
- Need a `splash.png` (Launch Screen) that matches your `LoginView.tsx` background color (`#0c120c`).

### 4.2 Screenshots

- App Store requires specific high-res screenshots for:
  - 6.5" iPhone
  - 5.5" iPhone
  - 12.9" iPad (optional but recommended)
- Google Play requires feature graphics.

---

## 5. Strategic Roadmap to Submission

### Phase 1: Native Conversion (This Week)

1.  Initialize Capacitor in the project (`npm install @capacitor/core @capacitor/cli`).
2.  Add Android and iOS platforms (`npx cap add android`, `npx cap add ios`).
3.  Install Capacitor plugins for Camera and Voice to replace/polyfill web standards where needed.
    - `@capacitor-community/speech-recognition` (Web Speech API is flaky on iOS WebView).
    - `@capacitor/camera` (Better native camera UI than `<input type="file">`).
4.  Configure `vite.config.ts` to output to the correct `dist` folder Capacitor expects.

### Phase 2: Compliance & Polish

1.  Add specific "Delete Account" button in Settings that calls Firebase Auth deletion.
2.  Host a simple `privacy.html` on Firebase Hosting.
3.  Design generic assets (Icon, Splash).

### Phase 3: Internal Testing

1.  **TestFlight** (iOS) and **Internal Testing Track** (Android).
2.  Invite yourself and 1-2 friends.
3.  Verify: Does `VoiceButton` work when the app is backgrounded? (Probably not, need to handle background states).

---

## 6. Immediate Action Plan

Do you want to proceed with **Phase 1 (Native Conversion)**?
I can start by installing Capacitor and setting up the native project structure right now.
