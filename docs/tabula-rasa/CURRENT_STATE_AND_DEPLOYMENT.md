# Current State & Deployment Guide

**Last Updated**: [Current Date]
**Build Status**: ✅ Successfully Built

---

## Current State Summary

### ✅ Completed Improvements (Phase 4)

**Vision Service Abstraction**:
- Interface-based design ready for your shared vision service
- Factory pattern with environment variable switching
- Currently using Gemini, can swap to shared service via env vars

**Species Library Caching**:
- In-memory + Firestore caching
- Prevents re-enriching same species
- Second enrichment is instant

**Intent Parsing Cache**:
- In-memory cache for voice commands
- Repeated commands return instantly

**Toast Notification System**:
- Consistent error/success messaging
- Non-blocking notifications
- Integrated across all operations

### 📊 Build Status

**Build Output**: `build_output/` directory
- ✅ Build successful
- ✅ All modules transformed (1853 modules)
- ⚠️ Large bundle size (2.8MB) - acceptable for single-user app
- ⚠️ Toast.tsx has mixed static/dynamic imports (works, but warning)

**Build Warnings**:
- Large chunk size (2.8MB) - consider code-splitting if needed
- Toast.tsx dynamic imports - works fine, just a warning

---

## Deployment Options

### Option 1: Firebase Hosting (Recommended - Already Configured)

**Setup**:
- ✅ `firebase.json` configured
- ✅ Build output: `build_output/`
- ✅ Proxy routing configured for `/api/proxy`

**Deploy Command**:
```bash
firebase deploy --only hosting
```

**Prerequisites**:
- Firebase CLI installed: `npm install -g firebase-tools`
- Logged in: `firebase login`
- Project selected: `firebase use the-conservatory-d858b`

**What Gets Deployed**:
- Frontend app (React build)
- Firebase Functions (AI proxy) - if deployed separately

---

### Option 2: Vercel (Alternative)

**Setup**:
- Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build_output",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Deploy Command**:
```bash
vercel --prod
```

**Prerequisites**:
- Vercel CLI: `npm install -g vercel`
- Vercel account and project linked

---

### Option 3: Local Preview (For Testing)

**Command**:
```bash
npm run preview
```

**Access**: http://localhost:4173 (or port shown)

---

## Pre-Deployment Checklist

### Environment Variables

**Required for Production**:
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `GEMINI_API_KEY` - Gemini API key (in Firebase Functions secrets)

**Optional (For Shared Vision Service)**:
- `VITE_SHARED_VISION_SERVICE_URL` - Your vision service URL
- `VITE_SHARED_VISION_SERVICE_KEY` - Your vision service API key

**Where to Set**:
- **Firebase Hosting**: Set in Firebase Console → Hosting → Environment variables
- **Vercel**: Set in Vercel Dashboard → Project → Settings → Environment Variables
- **Local**: Create `.env` file (not committed to git)

---

## Deployment Steps

### Firebase Hosting Deployment

1. **Install Firebase CLI** (if not installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Select Project**:
   ```bash
   firebase use the-conservatory-d858b
   ```

4. **Build the App**:
   ```bash
   npm run build
   ```

5. **Deploy**:
   ```bash
   firebase deploy --only hosting
   ```

6. **Deploy Functions** (if needed):
   ```bash
   firebase deploy --only functions
   ```

**Deployment URL**: Will be shown after deploy (e.g., `https://the-conservatory-d858b.web.app`)

---

### Quick Deploy Script

Create `deploy.ps1` (PowerShell) or `deploy.sh` (Bash):

**PowerShell** (`deploy.ps1`):
```powershell
npm run build
firebase deploy --only hosting
```

**Bash** (`deploy.sh`):
```bash
#!/bin/bash
npm run build
firebase deploy --only hosting
```

---

## Post-Deployment Testing

### Verify Deployment

1. **Check URL**: Visit deployed URL
2. **Test Login**: Google OAuth should work
3. **Test Voice**: Voice button should work
4. **Test Photo**: Photo identification should work
5. **Test Enrichment**: Add species, verify enrichment works
6. **Check Console**: No errors in browser console
7. **Check Network**: API calls should succeed

### Verify Improvements

1. **Intent Cache**: Say same command twice, check console for cache hit
2. **Species Library**: Add same species twice, second should be instant
3. **Toast System**: Trigger errors, verify toasts appear
4. **Vision Service**: Check console for "[Vision] Using Gemini vision service"

---

## Current Build Output

**Location**: `build_output/`
**Files**:
- `index.html` - Main HTML file
- `assets/index-*.js` - Main bundle (2.8MB)
- `assets/index-*.css` - Styles (70KB)
- `assets/speciesLibrary-*.js` - Species library chunk
- `assets/enrichmentService-*.js` - Enrichment service chunk

**Size**: ~3MB total (acceptable for single-user app)

---

## Known Issues

### Build Warnings (Non-Critical)

1. **Large Bundle Size** (2.8MB)
   - **Status**: Acceptable for single-user app
   - **Fix**: Code-splitting if needed (deferred)
   - **Impact**: Slightly slower initial load

2. **Toast.tsx Mixed Imports**
   - **Status**: Works fine, just a warning
   - **Fix**: Use consistent import style (deferred)
   - **Impact**: None

---

## Environment Setup

### Development

**Start Dev Server**:
```bash
npm run dev
```

**Access**: http://localhost:5173

**Features**:
- Hot reload
- Source maps
- Dev tools

### Production Build

**Build**:
```bash
npm run build
```

**Preview**:
```bash
npm run preview
```

**Access**: http://localhost:4173

---

## Firebase Functions Deployment

**If deploying functions separately**:

1. **Navigate to functions**:
   ```bash
   cd functions
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Deploy**:
   ```bash
   cd ..
   firebase deploy --only functions
   ```

**Function URL**: `https://us-central1-the-conservatory-d858b.cloudfunctions.net/proxy`

---

## Troubleshooting

### Build Fails

**Issue**: `vite is not recognized`
**Fix**: Run `npm install` first

**Issue**: TypeScript errors
**Fix**: Check `read_lints` output, fix type errors

**Issue**: Import errors
**Fix**: Check file paths, ensure all imports are correct

### Deployment Fails

**Issue**: Firebase not logged in
**Fix**: Run `firebase login`

**Issue**: Wrong project
**Fix**: Run `firebase use the-conservatory-d858b`

**Issue**: Build output missing
**Fix**: Run `npm run build` first

### Runtime Errors

**Issue**: API calls fail
**Fix**: Check Firebase Functions are deployed, check API keys

**Issue**: Auth doesn't work
**Fix**: Check Firebase config, check OAuth setup

**Issue**: Vision service not working
**Fix**: Check console for "[Vision]" messages, verify Gemini API key

---

## Quick Start for Testing

1. **Build**:
   ```bash
   npm run build
   ```

2. **Preview Locally**:
   ```bash
   npm run preview
   ```

3. **Or Deploy to Firebase**:
   ```bash
   firebase deploy --only hosting
   ```

4. **Test**:
   - Visit deployed URL
   - Login with Google
   - Test voice, photo, enrichment
   - Check console for improvements

---

**End of Current State & Deployment Guide**
