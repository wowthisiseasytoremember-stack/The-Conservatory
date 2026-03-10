# The Conservatory: Comprehensive Visual & Design Inventory

This document provides a detailed catalog of every screen, component, text element, and visual state within The Conservatory. It serves as the master reference for design consistency, branding, and Apple App Store submission preparation.

---

## 1. Brand Identity & Global Assets

### 1.1 App Icon & Identity

- **Icon**: A minimalist, elegant **Green Leaf** (centered).
- **Palette**: `Emerald-500` (Primary), `Slate-900` (Background), `Cyan-400` (Secondary/Water).
- **Typography**:
  - **Serif**: Playfair Display (Proposed) / System Serif (Current).
  - **Sans**: Inter / System Sans.
  - **Mono**: JetBrains Mono / System Mono (for technical data/time).

### 1.2 Global Navigation & Layout (`MainLayout.tsx`)

- **Header Structure**:
  - Logo: "THE CONSERVATORY" (Text-based, small-caps, wide tracking).
  - Connection Badge:
    - `Live Sync` (Emerald pulse) — Connected.
    - `Offline` (Red static) — Disconnected.
  - Dynamic Title: Large serif title centered or left-aligned based on route (e.g., "The Shallows", "Neon Tetra").
- **Global Actions**:
  - **Camera (Emerald)**: Opens Photo Identification.
  - **Layers (Cyan)**: Opens Rack Scan Mode.
  - **Settings (Slate)**: Opens app configuration.
  - **Logout**: Exit session.
- **Voice Overlay**:
  - **Ambient Transcript**: A semi-transparent green bubble in the center showing live speech-to-text.
  - **Primary CTA**: Large fixed Emerald Microphone button at the bottom ("Hold to Talk").

---

## 2. Opening Experience (The "Greeting")

### 2.1 Login View (`LoginView.tsx`)

- **Visual**: Large Leaf icon in a glowing emerald circle.
- **Title**: "The Conservatory" (Bold Serif).
- **Tagline**: "Digital Twin Management".
- **Description**: "A voice-first aquaculture and plant tracking system with Gemini-powered intelligence."
- **Action**: "Sign in with Google" (Large Emerald Button).
- **Footer**: "Private Access • Event Sourced Integrity".

### 2.2 Splash / Home Entry (Proposed)

- **Animation**: "Sketching" effect where the featured habitat diorama draws itself over 2-3 seconds.
- **Transition**: Seamless zoom-in from the sketch to the interactive dashboard.

---

## 3. Core Screens & Views

### 3.1 Dashboard (Home) (`HomeScreen.tsx`)

- **Empty State**:
  - Text: "Welcome to The Conservatory".
  - Wireframe Illustration: "Onboarding Illustration" (Dots pattern).
  - CTA: "No habitats yet. Use voice to create your first habitat."
- **Featured Habitat Spread**:
  - **Hero Label**: "Field Journal" (Monospaced, uppercase).
  - **Habitat Badge**: "Freshwater", "Terrarium", or generic "Habitat" (Cyan pill).
  - **Main Visual**: Watercolor illustration of the ecosystem.
  - **Callout Overlays**: Tiny labels on the illustration pointing to residents (e.g., "Cardinal Tetra").
  - **Field Journal Narrative**: Italicized serif text describing the ecosystem's recent history.
- **Quick Stats Bar**:
  - Residents Count (Emerald).
  - Plants Count (Cyan).
  - pH Badge (Wireframe/Solid).
  - Temp Badge (Wireframe/Solid).
- **Inhabitants Grid**: "Residents" section with a "View All →" link.

### 3.2 Habitat Diorama (`HabitatDiorama.tsx`)

- **Header**: Navigation "← Back" + Large Habitat Name.
- **Illustration**: Main ecosystem visual (Placeholder: "[Habitat Illustration Placeholder]").
- **Narrative**: "Ecosystem narrative will appear here after enrichment..." (Italic slate).
- **Parameter Strip**: "Parameters" label with Cyan badges (e.g., "pH 6.8", "78°F").
- **Residents List**: Vertical list of clickable species names.

### 3.3 Species Placard (`SpeciesPlacard.tsx`)

- **Hero**: Full-bleed image with dark gradient + Bold White Name/Scientific Name.
- **Taxonomy Ribbon**: "Kingdom · Family · Genus" (Slate-400, centered dots).
- **Discovery Secrets**:
  - **Mechanism (🔬)**: How it works biologically.
  - **Advantage (🌍)**: Wildlife purpose.
  - **Synergy (🤝)**: Interaction with tankmates.
- **Traits Dashboard**: Grid of icons and badges (pH, Temp, Light, CO2, Diet).
- **Personal History**: List of chronological observations.
- **Context**: "Lives in **[Habitat]** with **X tankmates**".

---

## 4. Workflows & Modal Interfaces

### 4.1 Confirmation Card / Mad Libs (`ConfirmationCard.tsx`)

- **Analyzing State**: "Processing Intent..." with skeleton loading bars.
- **Strategy State**: "Clarity Required" (Amber theme). Shows "Advice" and "Accept Suggestion" button.
- **Review State**: Interactive sentence (e.g., "I am adding **[12]** **[Neon Tetras]**...").
- **Trait Editor**: Nested modal for editing DNA parameters (pH range, light req, placement).

### 4.2 Photo Identification (`PhotoIdentify.tsx`)

- **Viewfinder**: Full-screen camera with "Species ID Mode" or "Rack Scan Mode" label.
- **Analysis State**: Spinning "Analyzing Species..." emerald text.
- **Result Overlay**: Card showing identified Common Name, Scientific Name, and Confidence %.
- **Action**: "Accession" button to add to collection.

### 4.3 Deep Research Loader (`DeepResearchLoader.tsx`)

- **Visual**: Vertical stepper/checklist of research stages.
- **Stages**: GBIF, Wikipedia, iNaturalist, Local Library, Discovery Synthesis.
- **Status**: Checked (Done), Spinner (Active), X (Error).
- **Completion**: "Explore Discoveries" button.

---

## 5. Developer & Utility Screens

### 5.1 Settings Screen (`SettingsScreen.tsx`)

- **Sections**:
  - Featured Habitat Selection (Default: Most Recent).
  - Animation Speed (Slow/Normal/Fast).
  - Notification Toggles.

### 5.2 DevTools (`DevTools.tsx`)

- **Contractor Tab**: Strategic Advisor for code/design changes.
- **Logs**: Event stream.
- **Diagnostics**: DB connection test.

---

## 6. External Assets (Apple / Public Facing)

### 6.1 App Store Description Draft

> **Title**: The Conservatory: Digital Field Journal
> **Subtitle**: Track, Identify, Discover.
> **Description**:
> Transform your home ecosystems into a living field guide. The Conservatory uses Gemini-powered AI to identify species, research biological secrets, and track the health of your aquariums and terrariums through voice and vision.
>
> • **Voice-First Logging**: Simply speak to record growth, pH, or new residents.
> • **Deep Research**: Unlock "Discovery Secrets" about every organism in your care.
> • **Instant ID**: Snap a photo to identify species and view their optimal care requirements.
> • **Beautiful Spreads**: View your habitats as National Geographic-style watercolor spreads.

### 6.2 Privacy Policy Outline

- **Data Collection**: Google Profile (name/email), Camera (for species ID), Voice (for commands).
- **Processing**: Content processed by Google Gemini API.
- **Storage**: Project data stored in Firebase (US-Central).
- **Third-Party**: GBIF, Wikipedia, iNaturalist (read-only queries).

---

## 7. Pending Decisions & Work For User

### 7.1 Creative Decisions

- [ ] **Illustration Strategy**: Choice between 100% AI-generated, hand-curated library, or hybrid.
- [ ] **Serif Typography**: Formal selection of a premium serif font (e.g., Cormorant Garamond).
- [ ] **Ambient Sound**: Do we want subtle water/nature loops on the home screen?

### 7.2 Text & Copy Decisions

- [ ] **Narrative Tone**: Professional Scientific vs. Warm Journalistic.
- [ ] **Empty State Copy**: Finalize "Welcome" messages for first-time users.
- [ ] **App Store Subtitle**: "Digital Twin Management" vs. "Field Journal for Aquarists".

### 7.3 Technical/UX Decisions

- [ ] **Animation Speed**: Setting the default "drawing" time (is 3s too long?).
- [ ] **Dark Mode**: Is it a launch requirement or Phase 2?
- [ ] **Data Sharing**: Choice to keep all data private or allow sharing placards as images.

---

_End of Inventory / Version 1.0 (2026-02-16)_
