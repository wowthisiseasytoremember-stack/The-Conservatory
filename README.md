# The Digital Conservatory (Unified)

A high-fidelity digital archive and research tool for aquatic curators. This project merges the "Soul" of **Organism Atlas** (UI/UX, Research Synthesis) with the "Muscle" of **The Conservatory** (Firebase, Capacitor, Vision/Voice, Domain Logic) into a single, premium experience.

## 🏛️ The Vision: "The Modern Museum"
We do not manage "inventory"; we curate and protect **living artifacts**. The Conservatory transforms your home ecosystem into a documented "Digital Cabinet of Curiosities," connecting every specimen back to its ancestral origins in the wild.

---

## ✨ Key Features

### 1. Living Placards (The Unveiling)
When you add a specimen (like *Anubias nana 'Pinto'*), the app **unveils** a high-fidelity "Museum Placard." Using bold typography and editorial-style layouts, it tells the specific story of that cultivar's history, care, and origin.

### 2. Deep Research Scraper (The Research Engine)
Instead of generic AI guessing, our **Deep Research** engine scrapes authoritative sources (Wikipedia, Aquasabi, Flowgrow, Tropica) to synthesize a professional botanical/zoological dossier for every specimen.

### 3. Stewardship Journal (Enriched Observation)
Log your observations via Voice or Photo. The AI enriches your journal entries with "Curator's Notes," providing scientific context and validating your progress as a steward of nature.

### 4. Cross-Platform (Web & Mobile)
Built with **React 19** and **Capacitor 8**, providing a fluid web experience and a native-feeling mobile app for iOS and Android.

---

## 🛠️ Technical Stack

- **Frontend**: React (Vite + TypeScript)
- **Styling**: Tailwind CSS 4 (Museum Ivory & Botanical Green Palette)
- **State**: Zustand (Modular Store) + TanStack Query
- **Backend**: Firebase (Firestore, Auth, Storage, Cloud Functions)
- **Native**: Capacitor 8
- **AI**: Google Gemini 2.0 Flash (Synthesis & Intent Parsing)

---

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Firebase Setup**:
   Ensure you have a `.env.local` file with your Firebase credentials and `GEMINI_API_KEY`.

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Deploy Functions**:
   ```bash
   cd functions
   npm run deploy
   ```

---

## 📂 Documentation
- `VISION_MANDATE.md`: The core philosophy and user experience principles.
- `TECHNICAL_BLUEPRINT.md`: The architectural map of the unified system.
- `docs/ARCHIVE/`: Legacy documentation and planning materials.

---
*Created for the serious curator. Protecting life, documenting wonder.*
