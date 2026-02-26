# FlipScale Shipping Roadmap - February 25, 2026

**Project Status:** Phase 1 in progress. New "Authenticated Scraping" feature added to the roadmap as Milestone 6.
**Last Updated:** February 25, 2026

---
## EXECUTIVE SUMMARY
...
<previous content omitted for brevity>
...

---

## 🚀 MILESTONE 6: Authenticated Scraping Engine (NEW)

- **Goal:** Implement a system for scraping websites that require a login (e.g., eBay completed listings, Poshmark). This will use a persistent Playwright session, managed by a local Express server, to provide high-quality, real-time market data that is otherwise unavailable.
- **Validation:** A developer can click a "Connect eBay" button, log into a real Chromium window, and see a "Connected" status. Subsequently, the `enrichmentService` can automatically use this session to pull completed listing data in the background.

- **Tasks:**
    - **Task 6.1 (Server Backend):**
        - Create a new `server/` directory.
        - Install `express` and `playwright-chromium`.
        - Implement an Express server in `server/server.ts`.
        - Create a `session-manager.ts` to handle creating, saving, and loading persistent Playwright browser contexts for different platforms (e.g., eBay).
        - Implement a `/api/browser/login` endpoint that launches a headed (visible) browser for the user to log in.
        - Implement a `/api/browser/status` endpoint to check if a valid session cookie exists for a given platform.
    - **Task 6.2 (Scraper Logic):**
        - Create `server/scrapers/ebay-scraper.ts`.
        - Implement the logic to navigate to eBay's completed listings page and extract pricing data using the authenticated Playwright context.
        - Create a `/api/scrape/ebay` endpoint on the Express server that triggers this scraper.
    - **Task 6.3 (Frontend UI):**
        - Create a new `PlatformConnector.tsx` component.
        - This component will display the connection status for each platform (e.g., "eBay: Connected").
        - The "Connect" button will call the `/api/browser/login` endpoint.
        - The component will periodically poll the `/api/browser/status` endpoint to update its state.
    - **Task 6.4 (Integration):**
        - Integrate the `PlatformConnector.tsx` component into a suitable part of the UI (e.g., the Settings screen or a dedicated "Integrations" page).
        - Modify the `enrichmentService.ts` to call the `/api/scrape/ebay` endpoint as a fallback when other pricing sources fail.
        - Add `data/browser-sessions/` to `.gitignore` to ensure user session data is never committed.
    - **Task 6.5 (Git):**
        - Commit all work for this milestone with the message: "feat: Implement authenticated scraping engine with Playwright."

<previous content omitted for brevity>
...

---
**Document Version:** 1.1
**Last Updated:** February 25, 2026
**Status:** READY FOR EXECUTION
