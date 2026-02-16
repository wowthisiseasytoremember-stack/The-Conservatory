# 🌐 UNIVERSAL VISION SERVICE (UVS) STRATEGY

**Objective**: Unify the 4+ disparate vision identification methods across **The Conservatory**, **Box Audit**, and **Vault** into a single, modular, server-side service.

---

## 1. THE "HOLISTIC" VISION
Instead of each app managing its own Gemini/OpenAI calls, we move the "Brain" to a centralized **Vision Hub**.

| App | Input | Context | Expected Output |
| :--- | :--- | :--- | :--- |
| **Conservatory** | Bio-Sample | `profile: "biology"` | Scientific Name, DNA/Mechanism, Biome |
| **Box Audit** | Warehouse Scene | `profile: "spatial"` | Landmarks, Box IDs, Cluster Triage |
| **Vault** | Retail Item | `profile: "retail"` | eBay Title, Market Price, Condition |

---

## 2. THE UNIVERSAL SCHEMA (Zod Draft)

This "Super-Schema" ensures that the server can return data for any app without breaking others.

```typescript
const UniversalVisionResponse = z.object({
  id: z.string(),
  subject: z.object({
    name: z.string(),
    scientific_name: z.string().optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
  }),
  confidence: z.number(),
  
  // App-Specific "Pods"
  biology: z.object({
    taxonomy: z.record(z.string()).optional(),
    mechanisms: z.string().optional(),
    synergy: z.string().optional(),
  }).optional(),
  
  spatial: z.object({
    landmarks: z.array(z.string()).optional(),
    containers: z.array(z.string()).optional(),
    zones: z.array(z.record(z.any())).optional(),
  }).optional(),
  
  retail: z.object({
    estimated_price: z.object({ floor: z.number(), ceiling: z.number() }).optional(),
    condition_assessment: z.string().optional(),
    ebay_match_score: z.number().optional(),
  }).optional(),

  raw_ai_analysis: z.string(), // Full text for debugging
  metadata: z.object({
    model: z.string(),
    latency: z.number(),
    cost: z.number(),
  })
});
```

---

## 3. IMPLEMENTATION ROADMAP

### Phase 1: The "Vision Hub" Server (Standalone)
- **Repo**: `vision-hub-service`
- **Core**: Node.js/TypeScript + Vertex AI SDK.
- **Security**: Application Default Credentials (ADC). No more passing keys from the client.
- **Prompt Manifest**: A `prompts/` directory containing the "Scout Prompt" (Box Audit) and "Naturalist Prompt" (Conservatory).

### Phase 2: Conservatory Integration (Client-Side Prep)
- Refactor `SharedVisionService.ts` to call the Hub with `profile: "biology"`.
- Use the Hub's `biology` pod to populate the `IdentifyResult`.

### Phase 3: Box Audit Integration (The "3-Stream" Move)
- Refactor `VisionOrchestrator.ts` to replace the local `processAIRequest` with a call to the Hub using `profile: "spatial"`.
- Map the Hub's `spatial` pod to the 3-stream detections.

---

## 4. PREPARATORY TASKS (Immediate)

### 🛠️ Task A: Extract Prompts
Move these to a shared location or this roadmap for later porting:
- **Conservatory**: "You are the Principal Curator..."
- **Box Audit**: "You are the Sighted Warehouse Manager..."
- **Vault**: "You are Tangle the Detective..."

### 🛠️ Task B: Refactor Conservatory Adapter
Update `services/vision/SharedVisionService.ts` to be "Profile-Ready".

### 🛠️ Task C: Standardize Image Handling
All apps must use a standard Base64 JPEG (max 1024px) to ensure consistent AI performance.

---

## 5. THE "UNSPOKEN" BENEFITS
- **Audit Log**: A single Firestore collection (`universal_vision_logs`) tracks every photo ever identified across your ecosystem.
- **Retraining**: Easy to extract "Failed IDs" from all apps to fine-tune future models.
- **Single Point of Failure/Success**: If a new model (like Gemini 3.0) drops, we update **one** server, and all apps get smarter instantly.

---
*Status: Holistic Roadmap Complete. Ready to begin "Vision Hub" scaffolding or Conservatory refactor.*
