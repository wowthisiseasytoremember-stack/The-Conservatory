# API Reference — The Conservatory

This document covers the Firebase Cloud Functions API (backend proxy) and the internal service interfaces used by the frontend.

---

## Firebase Cloud Functions

Base URL (production): `https://us-central1-the-conservatory-d858b.cloudfunctions.net`

The frontend proxies requests via Vite's dev server at `/api/*` → Cloud Functions.

---

### POST `/proxy`

**Purpose**: Server-side proxy for Gemini generative AI requests. Keeps the Gemini API key secret on the server.

**Method**: `POST`

**Authentication**: None required at the function level (key is managed via Firebase Secret Manager as `GEMINI_API_KEY`).

**Request Body** (`application/json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | `string` | No | Gemini model name. Defaults to `gemini-pro-latest`. Examples: `gemini-2.0-flash`, `gemini-1.5-pro-latest` |
| `contents` | `string \| array` | Yes | The prompt content. Either a plain string, or an array of Gemini content objects (`{ role, parts }`) |
| `config` | `object` | No | Gemini `generationConfig` object (e.g., `{ responseMimeType: "application/json", responseSchema: {...} }`) |
| `systemInstruction` | `string` | No | System-level instruction prepended to the conversation |

**Request Example** (text prompt):
```json
POST /proxy
Content-Type: application/json

{
  "model": "gemini-2.0-flash",
  "contents": "Identify this aquatic plant and describe its care requirements.",
  "systemInstruction": "You are an expert aquarist. Respond in JSON.",
  "config": {
    "responseMimeType": "application/json"
  }
}
```

**Request Example** (multimodal — image + text):
```json
POST /proxy
Content-Type: application/json

{
  "model": "gemini-2.0-flash",
  "contents": [
    {
      "role": "user",
      "parts": [
        { "inlineData": { "mimeType": "image/jpeg", "data": "<base64>" } },
        { "text": "What species is this?" }
      ]
    }
  ]
}
```

**Response** (`200 OK`):

| Field | Type | Description |
|-------|------|-------------|
| `text` | `string` | The generated text response from Gemini |
| `candidates` | `array` | Raw Gemini candidate objects (may be empty) |

```json
{
  "text": "This appears to be Anubias barteri...",
  "candidates": [{ "content": { ... }, "finishReason": "STOP" }]
}
```

**Error Responses**:

| Status | Body | Cause |
|--------|------|-------|
| `405 Method Not Allowed` | `{ "error": "Method Not Allowed" }` | Non-POST request |
| `500 Internal Server Error` | `{ "error": "Server misconfiguration" }` | GEMINI_API_KEY not set in environment |
| `500 Internal Server Error` | `{ "error": "<message>" }` | Gemini API call failed |

---

## Frontend Service Interfaces

The following TypeScript interfaces define the key service contracts within the app.

---

### IVisionService

**File**: `services/vision/IVisionService.ts`

Interface for AI vision providers. Currently implemented by `GeminiVisionService`.

```typescript
interface IVisionService {
  identifyFromBase64(
    base64Image: string,
    mimeType: string,
    contextHint?: string
  ): Promise<IdentifyResult>;
}
```

**`identifyFromBase64`**

| Parameter | Type | Description |
|-----------|------|-------------|
| `base64Image` | `string` | Base64-encoded image data (without data URI prefix) |
| `mimeType` | `string` | MIME type of the image (`image/jpeg`, `image/png`, etc.) |
| `contextHint` | `string?` | Optional context (e.g., "aquatic plant", "freshwater fish") to improve identification accuracy |

Returns: `Promise<IdentifyResult>`

---

### IdentifyResult

**File**: `types.ts`

```typescript
interface IdentifyResult {
  commonName: string;
  scientificName?: string;
  confidence: number;          // 0–1
  type: EntityType;
  traits?: Trait[];
  description?: string;
  careNotes?: string;
  alternativeNames?: string[];
}
```

---

### GeminiService — Key Methods

**File**: `services/geminiService.ts`

These are the primary AI operations exposed by the service. All return Promises and validate responses against Zod schemas.

#### `parseVoiceIntent(transcript, habitats)`

Parses a voice command transcript into a structured pending action.

| Parameter | Type | Description |
|-----------|------|-------------|
| `transcript` | `string` | Raw voice transcript |
| `habitats` | `Entity[]` | Current list of habitats (for context matching) |

Returns: `Promise<PendingAction>` — includes `intent`, `targetHabitatName`, and `candidates`.

Intent values: `ACCESSION_ENTITY`, `LOG_OBSERVATION`, `MODIFY_HABITAT`, `QUERY`

**Caching**: Identical transcripts + habitat context are cached in an LRU cache to make repeated commands instant.

---

#### `identifyPhoto(base64Image, mimeType)`

Runs a 3-stream parallel identification (species, care, traits) on an image.

| Parameter | Type | Description |
|-----------|------|-------------|
| `base64Image` | `string` | Base64 image data |
| `mimeType` | `string` | Image MIME type |

Returns: `Promise<IdentifyResult>`

---

#### `scanRack(base64Image, mimeType)`

Identifies multiple specimens arranged in a rack/grid from a single image.

Returns: `Promise<RackContainer[]>` — array of identified rack positions with species data.

---

#### `enrichEntity(entity)`

Runs the deep research pipeline for a single entity, generating discovery secrets, synergy notes, biological discovery data, and a care narrative.

| Parameter | Type | Description |
|-----------|------|-------------|
| `entity` | `Entity` | The entity to enrich |

Returns: `Promise<EnrichedEntityData>` with fields: `mechanism`, `evolutionaryAdvantage`, `synergyNote`, `narrative`, `discoverySecrets`.

---

### SpeciesLibrary

**File**: `services/speciesLibrary.ts`

Firestore-backed cache for enriched species data. 90-day TTL with LRU memory layer.

```typescript
class SpeciesLibrary {
  get(speciesName: string): Promise<SpeciesRecord | null>;
  save(record: SpeciesRecord): Promise<void>;
  clearCache(): void;
}
```

**`get(speciesName)`**: Returns cached species enrichment data, or `null` if not found or expired.

**`save(record)`**: Persists enrichment data to Firestore and updates the in-memory LRU cache.

---

## Data Models

### Entity

Core domain object representing any specimen or habitat.

```typescript
interface Entity {
  id: string;
  name: string;
  type: EntityType;               // HABITAT | ORGANISM | PLANT | INVERTEBRATE
  confidence: number;             // 0–1, AI identification confidence
  traits: Trait[];
  aliases: string[];
  enrichment_status: 'none' | 'pending' | 'complete' | 'failed';
  created_at: number;             // Unix timestamp (ms)
  updated_at: number;
  group_id?: string;
  notes?: string;
  enrichment?: EnrichmentData;
}
```

### Trait

Biological/physical parameters for an entity.

```typescript
interface Trait {
  type: 'AQUATIC' | 'TERRESTRIAL' | 'PHOTOSYNTHETIC' | 'INVERTEBRATE' | 'VERTEBRATE' | 'COLONY';
  parameters?: {
    pH?: number;
    temp?: number;
    salinity?: string;
    humidity?: number;
    substrate?: string;
    lightReq?: string;
    co2?: boolean;
    molting?: boolean;
    colony?: boolean;
    diet?: string;
    estimatedCount?: number;
    stable?: boolean;
    nitrates?: number;
    ammonia?: number;
  };
}
```

### PendingAction

Structured result of voice intent parsing — awaits user confirmation before execution.

```typescript
interface PendingAction {
  intent: 'ACCESSION_ENTITY' | 'LOG_OBSERVATION' | 'MODIFY_HABITAT' | 'QUERY';
  targetHabitatName?: string;
  candidates?: Entity[];
  confirmationMessage?: string;
  rawTranscript?: string;
}
```

### AppEvent / DomainEvent

Immutable event log entry.

```typescript
interface DomainEvent {
  id: string;
  type: string;
  entityId: string;
  habitatId?: string;
  payload: Record<string, unknown>;
  timestamp: number;
  userId: string;
}
```

---

## Firestore Collections

| Collection | Access | Description |
|------------|--------|-------------|
| `entities` | Auth required | Habitats, specimens, organisms |
| `events` | Auth required | Immutable event log |
| `groups` | Auth required | Entity groupings (racks, tanks) |
| `species_library` | Auth required (read-only) | AI-enriched species data cache |
| `ai_usage_logs` | Auth required | Cost tracking for AI calls |
| `system_logs` | Create-only | System diagnostics |
| `feeder_pic_database` | Auth required | Feeder/breeding photo references |

Database ID: `theconservatory`

---

## Environment Variables

| Variable | Context | Description |
|----------|---------|-------------|
| `VITE_FIREBASE_API_KEY` | Frontend build | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Frontend build | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Frontend build | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Frontend build | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Frontend build | Firebase Messaging sender |
| `VITE_FIREBASE_APP_ID` | Frontend build | Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Frontend build | Google Analytics measurement ID |
| `GEMINI_API_KEY` | Scripts + Cloud Function (secret) | Google Gemini API key |
| `VITE_ENABLE_COST_TRACKING` | Frontend build | Enable AI cost tracking (`true`/`false`) |
