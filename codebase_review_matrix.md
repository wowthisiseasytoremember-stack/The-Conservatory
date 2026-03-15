# Codebase Review Matrix: The Conservatory

| File | Purpose (Plain English) | Inputs (Format/Type) | Outputs (Format/Type) | Tech Notes | Design Notes | Shipping Notes | Ethos/Vibe Match | Last Updated (UTC) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ENTRY & APP ROOT** | | | | | | | | | |
| `index.tsx` | App entry point and global error initialization. | N/A | React DOM Root | Initializes `errorService`. Simple mount logic. | Minimal. | Production ready. | **Solid.** Clean entry. | 2025-05-15T10:00:00Z | ✅ |
| `App.tsx` | Main application controller, routing, and global state orchestration. | URL Routes, Store State | JSX (MainLayout + Routes) | Contains global error hardening. Uses `@ts-ignore` for window-level functions. | Coordinates the "Nat Geo" feel via `MainLayout`. | Heavy dependency on `useConservatory` hook. | **Vibe Debt.** `@ts-ignore` used for bridge logic. | 2025-05-15T10:05:00Z | 🟡 |
| **DATA & TYPES** | | | | | | | | | |
| `types.ts` | Central source of truth for all domain entities and system states. | N/A | TypeScript Interfaces/Enums | Defines "DNA" traits for entities. Supports rich observations and research stages. | N/A | Highly stable. | **Excellent.** Very descriptive. | 2025-05-15T10:10:00Z | ✅ |
| `src/schemas.ts` | Zod validation schemas for AI-generated payloads and API responses. | JSON Objects | Validated Data / Parse Errors | Ensures AI outputs match expected system formats. | N/A | Critical for system stability. | **Solid.** Professional safety layer. | 2025-05-15T10:15:00Z | ✅ |
| **SERVICES** | | | | | | | | | |
| `services/firebase.ts` | Firebase initialization and configuration with persistence. | Env Vars / LocalStorage | Firebase Service Instances | Supports runtime config override via UI. Uses persistent local cache. | N/A | Includes fallback hardcoded keys (Security risk). | **Functional.** LocalStorage override is clever. | 2025-05-15T10:20:00Z | 🟡 |
| `services/store.ts` | Monolithic state manager (The "Brain") for the entire application. | User Input, Firestore Sync | Reactive App State | Handles voice, persistence, research, and ecosystem logic. 800+ lines. | N/A | **Huge Monolith.** Needs decomposition into specialized stores. | **Vibe Debt.** Logic for 5+ domains in one class. | 2025-05-15T10:25:00Z | 🔴 |
| `services/geminiService.ts` | AI Gateway for voice parsing, vision, and advisory reports. | Text, Base64 Images | Structured JSON / Narratives | Implements LRU caching for intents. Multi-model (Flash vs Pro). | N/A | Uses a Cloud Function proxy for security. | **Solid.** Powerful intelligence hub. | 2025-05-15T10:30:00Z | ✅ |
| **CORE UI** | | | | | | | | | |
| `components/MainLayout.tsx`| Master shell providing the "Nat Geo" magazine aesthetic. | Children, Status, BiomeTheme | JSX (Header, Main, Voice CTA) | Uses biome-based CSS variables for dynamic themes. | High-end typography (Serif) and glassmorphism. | Responsive and polished. | **Excellent.** Captures the "Ethos". | 2025-05-15T10:35:00Z | ✅ |
| `components/AIChatBot.tsx` | Specialized interface for "Grounded" or "Deep Thinking" AI consultation. | User Prompts | Chat History + Grounding Links | Supports G3-Pro and Flash-Grounded modes. | Deep-nebula dark aesthetic with emerald accents. | UI is polished, but logic is heavy. | **Excellent.** Very high vibe. | 2025-05-15T10:40:00Z | ✅ |
| `components/DevTools.tsx` | Internal utility for testing scenarios, quick actions, and backend audits. | Interaction | Store Updates / AI Calls | Comprehensive: Scenarios, Actions, Advisory, Backend. | Compact, utility-focused overlay. | Remove/Disable in production builds. | **Practical.** Indispensable for dev. | 2025-05-15T10:45:00Z | ✅ |
| `components/EntityDetailModal.tsx` | Rich detail view and editor for organisms and habitats. | Entity Object | Update Callbacks | Integrates GBIF API for scientific verification. | Very busy UI; 500+ lines of code. | **Vibe Debt.** Component is too large. | **Functional but Cluttered.** | 2025-05-15T10:50:00Z | 🟡 |
| `components/VoiceButton.tsx`| Push-to-talk interface for hands-free conservatory management. | User Voice | Transcript Strings | Uses Pointer Events for "feel". Support fallback for no-speech. | Pulsing red/emerald states. | Browser-dependent (webkitSpeechRecognition). | **Good.** High interaction value. | 2025-05-15T10:55:00Z | ✅ |
| **SCREENS** | | | | | | | | | |
| `components/screens/HomeScreen.tsx` | Featured habitat spread and activity overview. | Store Data | JSX (Journal View) | Uses WireframePlaceholders for missing visuals. | "Nat Geo" magazine spread layout. | Requires more actual image assets. | **Excellent.** Strong narrative focus. | 2025-05-15T11:00:00Z | 🟡 |
| `components/screens/SpeciesPlacard.tsx` | Individual organism "Placard" with discovery secrets. | Species ID | JSX (Discovery View) | Modularizes "Mechanism" and "Evolutionary" logic. | Focuses on scientific storytelling. | High reliance on enriched data. | **Excellent.** Scientifically grounded. | 2025-05-15T11:05:00Z | ✅ |
| `components/screens/HabitatDiorama.tsx` | Ecosystem overview and resident listing. | Habitat ID | JSX (Ecosystem View) | Simpler than Placard; focuses on relationships. | Uses biome-specific styling. | Stable but could use more data viz. | **Solid.** Reliable overview. | 2025-05-15T11:10:00Z | ✅ |

## Vibe Debt Summary
1.  **Monolithic Store (`services/store.ts`)**: Functional but extremely "ugly" architecturally. It handles too many responsibilities (Firestore, Voice, Research, Navigation state).
2.  **Component Overload (`EntityDetailModal.tsx`)**: The UI is functional but the code is a "wall of logic" that makes maintenance difficult.
3.  **Bridge Brittle-ness (`App.tsx`)**: The use of `@ts-ignore` and `window` level assignments for voice processing is a "hack" that works but lacks type safety.
4.  **Wireframe Over-reliance**: While intentional for the aesthetic, many screens rely on `WireframePlaceholder` which can feel "unfinished" if data enrichment fails.

---
*Matrix generated by Gemini CLI - `codebase-review-matrix` skill.*
