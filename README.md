<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1xG-F7VEkiylEB0D9HVLxQEhL4JXUqtLK

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Architecture

- **Backend**: Standardized on Firebase Functions for AI proxying (Intent parsing, Vision). This replaces the legacy Vercel proxy for better integration with Firestore.
- **Store**: Uses a centralized Zustand store with persistence to Firestore and LocalStorage.
- **Testing**: Comprehensive E2E coverage with Playwright and unit testing with Vitest.
