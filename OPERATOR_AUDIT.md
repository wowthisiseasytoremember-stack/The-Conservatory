# Operator Audit: The Conservatory

## 1. System Health: 6.5/10
The Conservatory has a beautiful, innovative design and a strong technical core, but it currently carries high-severity security risks and architectural complexity.

## 2. Entropy Trend: Stable
The project is well-documented (especially in `docs/tabula-rasa/`), which helps manage debt, but the core architectural flaws (monolithic store, open security rules) remain unresolved.

## 3. Biggest Risk: Open Security Rules
The current "public read/write" Firestore rules are a critical security risk. Any user with the project ID can read or delete all biological collection data.

## 4. Highest Leverage: Auth + Rules Implementation
Locking down the database with Firebase Auth is the single most important task to move this from a "prototype" to a "production-ready" tool.

## 5. Action Board

### CRITICAL
- [ ] **Lock Firestore Rules**: Replace `allow read, write: if true` with proper `request.auth != null` rules.
- [ ] **Secure Gemini API**: Move the Gemini AI service calls to a secure Firebase Cloud Function to prevent API key leakage.

### HIGH ROI
- [ ] **Error Tracking Integration**: Add Sentry or a similar tool to monitor production errors and AI identification failures.
- [ ] **Store Decomposition**: Begin extracting logic from `store.ts` into standalone hooks or specialized services.

### STRUCTURAL
- [ ] **Pino/Structured Logging**: Implement structured logging to better debug complex AI intent parsing and state transitions.
- [ ] **Zod Schema Validation**: Use Zod to strictly validate AI responses before they reach the state store.

### STRATEGIC
- [ ] **Bespoke UI Components**: Formalize the "Mad-Libs" and "Wonder-First" UI patterns into a reusable component library.
- [ ] **Multi-Tenant Architecture**: Design a plan for separating user collections to support multiple independent biologists/collectors.
