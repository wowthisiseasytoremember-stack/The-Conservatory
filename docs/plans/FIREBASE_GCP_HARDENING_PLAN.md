# 🛡️ HOLISTIC AUDIT: Firebase & GCP Provisioning

**Status**: CRITICAL (Action Required for Conservatory security)
**Projects Audited**: The Conservatory, Box Audit, Vault.

---

## 1. FINDINGS: THE "GOOD, BAD, & UGLY"

### 🔴 The Conservatory (Ugly)
*   **Wide-Open Rules**: `firestore.rules` allows `read, write: if true`. **Anyone on the internet can delete your entire plant library and user data.**
*   **Missing Storage Rules**: No `storage.rules` file found. Defaults may be insecure.
*   **Named Database Complexity**: Using database `theconservatory` instead of `(default)`. While supported, it often breaks standard CLI tools and third-party integrations if not explicitly handled (as seen in our seeding script).
*   **Client-Side Keys**: API keys are passed through the frontend.

### 🟡 Box Audit & Vault (Bad Architecture)
*   **Resource Mingling**: Both apps share the `boxaudit0001` Firebase project. Vault data (`feeder_pic_database`) lives inside the Box Audit project.
*   **Lack of Isolation**: A user in Vault could technically access Box Audit collections if rules aren't perfectly segmented by collection prefix.
*   **Service Account Overload**: One service account (`boxauditpwa@...`) is handling too many distinct app responsibilities.

### 🟢 Infrastructure (Good)
*   **ADC Usage**: Vault is correctly moving toward **Application Default Credentials**, which is the gold standard for server-to-server security.
*   **Vision Hub**: Our new module uses ADC and is properly isolated from the frontend.

---

## 2. HARDENING PLAN (Immediate Actions)

### Step 1: Secure the Conservatory (High Priority)
I will immediately create a restricted `firestore.rules` for the Conservatory that:
1.  Allows anyone to **READ** the `species_library`.
2.  Allows users to **READ/WRITE ONLY** their own `habitats` and `observations`.
3.  Protects `system_logs`.

### Step 2: Provision Storage Rules
Add `storage.rules` to the Conservatory to prevent anonymous uploads to your `observations` folder.

### Step 3: Standardize the Database
**Proposal**: Migrate the Conservatory from the `theconservatory` database ID back to `(default)`.
*   **Why?** Most Firebase extensions and simpler backup tools only support the default database.
*   **Action**: Export data from named DB -> Import to default DB -> Update `firebase.ts`.

---

## 3. PROVISIONING BEST PRACTICES (The "Right" Way)

1.  **Project per Business Domain**: 
    *   `the-conservatory-d858b` (Botanical)
    *   `boxaudit-production` (Inventory)
    *   `vision-hub-core` (Shared Intelligence)
2.  **Environment Sync**: Use `.env` files for non-sensitive config (Project IDs) and **Secret Manager** for sensitive keys (Gemini API keys).
3.  **Unified Auth**: All apps should use the same Firebase Auth tenant if they are part of your "suite," or remain isolated if they are for different users.

---

## 🚀 NEXT STEPS FOR ME

1.  [ ] **Action**: I will draft the hardened `firestore.rules` for the Conservatory now.
2.  [ ] **Action**: I will draft `storage.rules` for the Conservatory.
3.  [ ] **Action**: I will verify if `boxaudit0001` has any non-auth users who can see `feeder_pic_database`.

**Should I proceed with creating the hardened rules files for the Conservatory immediately?**
