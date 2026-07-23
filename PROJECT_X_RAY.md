# Project X-Ray: The Conservatory

## 1. What This System Really Is
The Conservatory is a **React 19 (Vite)**-based Progressive Web App (PWA) designed for biological collection management. It employs a "Wonder-First" philosophy, focusing on voice-native interactions and AI-driven identification. The backend is powered by **Firebase** (Firestore/Functions) and **Gemini AI** for high-reasoning species identification and intent parsing.

## 2. Complexity Hotspots
- **Monolithic Store**: `services/store.ts` is the central brain of the application, managing all state, business logic, and Firebase persistence. This creates a high "blast radius" for any changes.
- **AI Service Hub**: `services/geminiService.ts` contains the core species identification and voice intent parsing logic. It's a dense file where any logic errors directly impact the app's primary value proposition.
- **Confirmation Pattern**: The "Mad-Libs" confirmation UI (`ConfirmationCard.tsx`) is a sophisticated piece of front-end logic designed to validate and refine AI outputs before they're committed to the database.

## 3. Fragile Zones
- **Security Vulnerabilities**: Firestore rules are currently open (`allow read, write: if true`), and Gemini API keys are potentially exposed in client-side bundles.
- **Dual Proxy Overhead**: The project is currently splitting its infrastructure across **Vercel** and **Firebase Functions**, leading to unnecessary complexity in deployment and maintenance.
- **Error Observability**: There is a significant lack of structured logging (e.g., Pino) or error tracking (e.g., Sentry), making it difficult to diagnose production failures.

## 4. Scalability Assessment
- **Single-User Optimization**: The architecture is currently optimized for a single-user, "bespoke" experience. It lacks basic features like pagination, robust conflict resolution, and multi-tenant isolation.
- **State Management**: As the feature set grows, the monolithic store will become a major bottleneck for developer productivity and app performance.

## 5. Refactor Priorities
1. **HIGHEST: Security Hardening**
   - **What**: Implement proper Firebase Auth and lock down Firestore rules. Move Gemini API keys to secure backend functions.
   - **Why**: Prevent data loss and unauthorized API usage.
2. **HIGH: Store Decomposition**
   - **What**: Split `services/store.ts` into smaller, task-specific stores or services.
   - **Why**: Reduce complexity and improve maintainability.
3. **MEDIUM: Infrastructure Consolidation**
   - **What**: Consolidate either onto Vercel or fully into Firebase to reduce proxy overhead.
   - **Why**: Simplify the deployment pipeline and reduce technical debt.

## 6. Maturity Score: 6.5/10
- **Architecture Clarity**: 7 (Clear vision, modern tech stack).
- **Complexity Management**: 5 (Monolithic state and dual infrastructure).
- **Scalability Readiness**: 6 (Works well for individuals, but needs work for scale).
