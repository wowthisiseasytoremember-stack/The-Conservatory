# PASS 1: Workflows and Critical User Journeys

This document describes **what** The Conservatory does from a user and domain perspective, without any technical implementation details. This is intended for Phase 2 (Ideal Architecture) design, where implementation choices are open.

---

## System Purpose

**The Conservatory** is a biological collection management system for aquarists, terrarium keepers, and botanical enthusiasts. Users track habitats (tanks, terrariums), organisms (plants, animals), and environmental observations through multimodal interfaces (voice commands, photo identification, text entry).

**Core Intent**: Create a "digital twin" of biological collections with rich taxonomic data, automated enrichment from external sources, and conversational interfaces that reduce data entry friction.

**Philosophy**: This is about **WONDER** and **DISCOVERY**, not maintenance. "What does CONSERVATORY mean?" - a place of wonder, discovery, and preservation. The system should inspire curiosity and reveal the fascinating mechanisms of biological life.

**Core UX Principle**: **Save all data, ask user to confirm, but NEVER BLOCKING**. If the user doesn't provide complete information (e.g., pot size), the system:
- Saves the data anyway with placeholder values (---) or assumed values with a flag
- Never prompts or blocks asking for missing data
- User can fill in missing data later via:
  - Mad-Libs confirmation on the item detail card
  - Saying something that clarifies it
  - Taking a photo that makes it clear
  - Or just leave it as ---
- System never says "you must tell me X before I can continue" - always progressive, never blocking

**Primary User Intent**: When users open the app, their goal is to be **WOWED and AWED** by their collection and the majesty of the world. They don't open it daily to add fish - they don't buy fish every day. They open it because last time they left feeling **smart, happy, and proud**. The app is a beautiful digital representation of what they love and care about - it updates and adapts as they make changes, and they learn about what they have, develop pride and knowledge. That's why they return.

---

## Domain Concepts

### Entities

**Habitats**: Physical containers that hold organisms. Can be:
- **Aquatic**: Aquariums, tanks (freshwater, saltwater, brackish)
- **Terrestrial**: Terrariums, paludariums, vivariums
- **Botanical**: Pots, planters, containers for houseplants
- Each habitat has:
  - Name
  - Size and unit (gallons, liters, pot size, etc.)
  - Type (freshwater, saltwater, brackish, terrestrial, pot/planter)
  - Location description
  - Environmental parameters (pH, temperature, salinity, humidity, substrate, light exposure, etc.)

**Organisms**: Individual plants, animals, or colonies that live in habitats. Includes:
- **Aquatic organisms**: Fish, shrimp, snails, aquatic plants
- **Terrestrial organisms**: Reptiles, amphibians, terrestrial plants
- **Houseplants**: Tropical plants, succulents, special morphs/variants (Global Green Pothos, special Philodendrons, Monstera Thai Constellations, etc.)
- Each organism has:
  - Common name (including morph/variant names like "Thai Constellation", "Global Green")
  - Scientific name (optional, can be discovered)
  - Morph/variant designation (if applicable)
    - **Big focus**: Lean into wonder through specificity - "THIS morph has..." or "THIS variegation means..."
    - If morph-specific info isn't available: General awe for the species, genus, or relationships is welcome
    - System needs to look at plant groups and may need to scrape DB of tropical plant morphs
    - System must be smart enough to distinguish real morphs from marketing names (e.g., "Global Green" is a real morph, but some names are just marketing)
  - Quantity (for colonies or groups)
  - Traits (biological characteristics)
  - Habitat relationship (which habitat/container it lives in - tank, terrarium, or pot)
  - Enrichment status (whether external data has been gathered)

**Groups**: User-defined collections of entities (e.g., "My Shrimp Collection", "Foreground Plants")

**Events**: Records of actions taken in the system:
- Entity accessions (adding new organisms)
- Habitat modifications (creating or updating habitats)
- Observations (environmental measurements, growth notes, biological events)
- Removals (organisms removed, died, got eaten, etc.)

### Traits System

Organisms can have multiple traits that describe their biological characteristics:

**AQUATIC**: Water-dwelling organisms
- Parameters: pH, temperature, salinity (fresh/brackish/marine), ammonia, nitrates

**TERRESTRIAL**: Land-dwelling organisms
- Parameters: humidity, substrate type, temperature

**PHOTOSYNTHETIC**: Plants and algae
- Parameters: light requirement (low/med/high), CO2 needs, growth rate, difficulty, placement (foreground/midground/background/floating/epiphyte), growth height

**INVERTEBRATE**: Animals without backbones
- Parameters: molting status, colony status

**VERTEBRATE**: Animals with backbones
- Parameters: diet (carnivore/herbivore/omnivore)

**COLONY**: Groups of organisms
- Parameters: estimated count, stability status

**Trait Mixing**: An organism can have multiple traits (e.g., AQUATIC + PHOTOSYNTHETIC + INVERTEBRATE for a shrimp that lives in water, photosynthesizes, and is an invertebrate).

**Type Inference**: The system infers entity type from traits:
- PHOTOSYNTHETIC trait → Entity type is PLANT
- COLONY trait → Entity type is COLONY
- Otherwise → Entity type is ORGANISM

### Enrichment Sources

When enriching an organism with external data, the system queries multiple authoritative sources to create a comprehensive picture of wonder and discovery:

1. **Local Library**: 
   - Curated aquatic plant database (scraped from Aquasabi/Flowgrow)
   - May need to scrape DB of tropical plant morphs/variants
   - Highest trust and specificity (does not need to override, but most trusted source)
   - Description, notes, reference images, biological traits
   - Links to Kew Gardens, iNaturalist, and other authoritative sources

2. **GBIF** (Global Biodiversity Information Facility): Taxonomic database
   - Scientific name, taxonomy (kingdom, phylum, order, family, genus)
   - Used for verification and scientific accuracy

3. **Wikipedia**: General knowledge
   - General description, habitat information

4. **iNaturalist**: Community observations
   - Common name aliases, occurrence data, reference images
   - Note: For morphs/variants (houseplants like Monstera Thai Constellation, Global Green Pothos, special Philodendrons), system pulls base species data (e.g., "Monstera deliciosa" for Thai Constellation) and stores morph-specific info in overflow/notes area
   - APIs can return base species info, but AI can give way more and better info about specific morphs/strains/variants than Google will

5. **AI Discovery**: Biological mechanisms - **THE WHOLE DEAL. SUPER SUPER SUPER IMPORTANT.**
   - User quickly and easily tells/shows their collection (tank, terrarium, or houseplants) and what's in it
   - System gives adorable little graphics, facts, and animations
   - User feels wonder, pride, and learns stuff
   - Scientific explanation of traits/adaptations:
     - Aquatic: "Did you know the iridescent stripe in Buenos Aires Tetras isn't pigment, it's actually guanine crystals???"
     - Houseplants: "Monstera Thai Constellations can't exist without hormones injected during the tissue culture process - without science and labs, they wouldn't exist!"
   - For morphs/variants: AI provides way more and better info about specific morphs/strains/variants than Google can (e.g., tissue culture process for Thai Constellations, specific care needs for Global Green Pothos)
   - Evolutionary advantages (for wild species) or human cultivation history (for cultivars)
   - Synergy notes (how species benefits others in ecosystem, or care requirements)
   - **Goal**: Not cutesy or twee, but acknowledges the awesome majesty of biology, time, nature, and human cultivation
   - **Future**: Ideal version includes little generated images/animations (watercolor-on-paper style) showing organisms with facts appearing

**Merge Strategy**: Local library has highest trust/specificity. GBIF taxonomy stored separately. iNaturalist common names added as aliases. Species library has overflow/notes area for data that doesn't fit schema (morphs, variants, etc.).

**Species Library Pattern**: 
- When a species is enriched for the first time, all enrichment data is stored in a shared species library
- Subsequent accessions of the same species use the cached library data instead of re-calling external APIs
- This creates a growing knowledge base that benefits all users
- **Data is cheap, text is tiny** - can rebuild the entire taxonomic database of the planet in JSON and not come near how much space a podcast app uses
- **Goal**: Everything common or semi-rare saved to database eventually, so AI calls will just be for enrichment of habitats, not organisms (except occasionally)

**Enrichment Types**:
- **Auto-Enrichment (Individual Species)**: When user adds a new species, system automatically enriches immediately (even before user confirms) and stores in species library. Data is cheap, can store basic fish names. Fast model (flash) for latency, but single-user so economics not a concern yet.
- **Manual Enrichment (Habitat/Ecosystem)**: Holistic analysis of entire habitat - this is manual to avoid running 22 times while user is setting up their first inventory. User triggers when ready to analyze the complete ecosystem.

**Enrichment Stages** (for new species - more stages if free APIs available, queue in background):
   - **Stage 1**: Local Library search (curated plant DB, links to Kew, iNaturalist)
   - **Stage 2**: GBIF search (taxonomy)
   - **Stage 3**: Wikipedia search (general knowledge)
   - **Stage 4**: iNaturalist search (aliases, images) - handles base species for morphs
   - **Stage 5**: AI Discovery (biological mechanisms - the "wonder" layer)
   - **Additional**: Any other free APIs that can be queued in background

**Error Handling**: If any stage fails, system continues to next stage. Only if all stages fail is enrichment marked as failed. As long as AI Discovery (Gemini) gets its data, we're good. Species library needs overflow/notes area for things that don't fit schema (e.g., specific morphs where iNaturalist has base species but not morph-specific data).

---

## User Intents

The system recognizes multiple user intents:

**Primary Intent (Meta)**: To be WOWED and AWED by their collection and the majesty of the world. This is why they open the app - to feel smart, happy, and proud about what they care for.

**Operational Intents**:

1. **ACCESSION_ENTITY**: Add new organisms to a habitat/container
   - Aquatic example: "I just added 12 Neon Tetras to The Shallows"
   - Houseplant example: "I added a Monstera Thai Constellation to my living room pot"
   - Extracts: species name(s) (including morph/variant names), quantity, target habitat/container
   - **Immediate enrichment**: System enriches species as soon as parsed from voice (before user confirms), saves to library
   - For morphs/variants: System pulls base species data from APIs, then AI provides detailed morph-specific information:
     - Tissue culture process (if applicable)
     - Specific care needs
     - How to differentiate from other similar morphs
     - Reference images
     - Discovery/patenting date or story
     - What makes THIS morph special (the wonder/specificity)

2. **MODIFY_HABITAT**: Create or update a habitat/container
   - Activation phrase likely: "I just got..." or "Create..." or "Add..." (flexible)
   - Aquatic example: "Create a 20 gallon freshwater tank called The Shallows"
   - Houseplant example: "Create a pot called Living Room Display" or "My Global Green Pothos is in a 6 inch pot on the windowsill"
   - Extracts: habitat/container name, size, unit, type, location
   - **If size not mentioned**: System saves with "---" or assumes standard size with flag, never blocks asking for it
   - User can fill in later via Mad-Libs on detail card, voice, or photo
   - **Spatial Graph**: Since most people have one maybe two racks tops, system can build a spatial graph of where habitats are. When user takes a picture of a tank that system knows the location of, and there's a plant next to it, and last week user said they added a plant next to that tank but didn't say the size, system can use spatial context to infer/update size. Not super important, but nice-to-have contextual intelligence. 

3. **LOG_OBSERVATION**: Record environmental measurements or biological events
   - **INCIDENTAL BUT SHOULDN'T BE BLOCKED** - It's not a maintenance app (other apps do that better), it's not research (other apps do that better). It's AWE and JOY and DISCOVERY and PRIDE.
   - Example: "pH in The Shallows is 6.8, temp 78"
   - Extracts: habitat, parameter values (pH, temp, ammonia, nitrates, humidity, growth measurements, molting status, etc.)

4. **REMOVE_ENTITY**: Remove organisms (died, got eaten, removed, etc.)
   - Example: "The cherry shrimp in The Shallows died"
   - Extracts: organism, habitat, reason

5. **QUERY**: Ask questions about the collection
   - Example: "How many shrimp do I have?"
   - Returns: Answer based on current collection data

---

## Critical User Journeys (CUJ)

### CUJ 1: Voice Accession

**Goal**: Add new organisms to a habitat/container using voice commands

**Steps**:
1. User activates voice input (holds button or similar)
2. User speaks natural language command:
   - Aquatic: "I just added 12 Neon Tetras to The Shallows"
   - Houseplant: "I added a Monstera Thai Constellation to my living room pot" or "Global Green Pothos in the kitchen window"
3. System transcribes speech to text
4. System parses intent and extracts:
   - Species name(s) (including morph/variant names like "Thai Constellation", "Global Green")
   - Quantity
   - Target habitat/container name (tank, terrarium, or pot)
   - Biological traits (inferred from species)
5. **System immediately enriches species** (before user confirms):
   - Checks species library - if exists, uses cached data
   - If new species/morph: Starts enrichment process (fast model for latency)
   - For morphs/variants: Pulls base species data from APIs (e.g., "Monstera deliciosa" for Thai Constellation), then AI provides detailed morph-specific info
   - Saves enrichment data to library (base species + morph-specific in overflow/notes)
   - Data is cheap, can store basic names (fish, plants, morphs)
6. System displays confirmation interface with editable "slots" (Mad-Libs style)
   - User can tap any field to edit: species name, morph/variant, quantity, habitat/container, traits
   - If user edits something that makes no sense: System can send whole thing back to AI with corrections to see what user is trying to say
7. User reviews and corrects if needed
8. User confirms
9. If species was only quickly identified before: System now does full enrichment prompt and adds to library
10. System creates organism entities in the specified habitat/container
11. System logs an accession event

**Key Point**: Entities DO auto-trigger enrichment. Habitats/containers do NOT auto-trigger holistic enrichment. The organisms would have started enriching the second the AI parsed them from voice.

**Two-Stage Enrichment**:
- **Flash/Lite Model**: Immediately fills out skeleton detail card with basic info (fast, low latency)
- **Pro Model**: Does full research in background while user reviews confirmation card
- User sees basic info immediately, full enrichment completes asynchronously

**Non-Blocking Data Entry**: If user doesn't mention pot size, container type, or any other detail:
- System saves with placeholder (---) or assumed value with flag
- Never prompts or blocks asking for missing data
- User can fill in later via Mad-Libs on item detail card, voice input, or photo
- System never says "you must tell me the pot size" - always progressive

**Morph/Variant Handling**: Applies to ALL organisms:
- **Houseplants**: Monstera Thai Constellation, Global Green Pothos, special Philodendrons
- **Fish**: Albino newts, Black Moscow Guppies, Golden Killifish, etc.
- **Frogs**: Various color morphs and variants
- **Aquatic Plants**: Cultivar variants and special strains
- APIs return base species info (Monstera deliciosa, Epipremnum aureum, etc.)
- AI Discovery provides way more and better info about the specific morph/variant than Google can
- Includes facts like: "Thai Constellations can't exist without hormones injected during tissue culture - without science and labs, they wouldn't exist!"
- Adorable illustrations show the specific morph/variant
- User learns about tissue culture processes, breeding history, specific care needs, cultivation history
- System distinguishes real morphs from marketing names (e.g., "Global Green" is real, but some names are just marketing)

**Fallback Behavior**: If intent is ambiguous or unclear:
- System shows strategy interface with friendly interpretation
- System suggests a specific command
- User can accept suggestion or provide more details

### CUJ 2: Photo Identification (Spatial Extraction)

**Goal**: Use camera to identify tanks/habitats, their positions, and inhabitants

**Single Camera Mode** (no separate modes):
1. User taps camera icon
2. Camera interface opens
3. User captures photo of rack/shelf with tanks/containers OR single organism
4. System analyzes image with prompt: "From this picture, identify as many individual fish tanks/habitats/etc. as there are, their relative positions, and anything you can see or confirm about them or the inhabitants. Include medium confidence guesses."
5. System returns one big block of data with:
   - All detected containers/tanks
   - Spatial positions (shelf level, horizontal position)
   - Size estimates
   - Species (plants and animals) visible in each container
   - Medium confidence guesses included
6. **System immediately checks all returned species against localDB**:
   - If in localDB: Uses cached enrichment data
   - If not in localDB: Immediately enriches and saves to library
7. System orchestrator turns data into Mad-Libs confirmation cards with options
8. User reviews detected containers and species
9. User can edit any field, deselect false positives, add missing species
10. User confirms
11. System creates multiple habitats and organisms from confirmed data

**Goal**: Everything common or semi-rare saved to database eventually, so AI calls will just be for enrichment of habitats, not organisms (except occasionally).

**Note**: Photo identification is primarily for **spatial extraction and layout discovery** - helping users quickly set up the "skeleton" of their room/habitat layout. Species identification is secondary and includes medium confidence guesses.

**Visual Progression**:
- System generates AI wireframe sketch (black and white) of their rack/tank/habitat layout
- As items are filled in and tanks are confirmed with inhabitants added, they start to fill in with color
- When full enrichment is done on a habitat, system prompts to generate a full little animation package for that tank with all the inhabitants
- Visual representation evolves from skeleton → filled → animated as data and enrichment complete

### CUJ 3: Text Entry (Voice Alternative)

**Goal**: Allow users who can't use voice to input commands via text

**Steps**:
1. User opens text entry field
2. User types command (e.g., "I added 10 Tetras to the 20 gallon")
3. System sends text to same parser as voice input
4. Follows same flow as voice accession (immediate enrichment, Mad-Libs confirmation, etc.)

**Rationale**: Accessibility - some users may not be able to use voice input.

### CUJ 4: Deep Research (Enrichment)

**Goal**: Gather comprehensive information about organisms or entire ecosystems from multiple authoritative sources

**Individual Species Enrichment (Auto)**:
1. User adds a new species (voice, text, or photo)
2. System automatically enriches this species immediately:
   - Checks species library - if exists, uses cached data
   - If new species: Queries all enrichment sources (Local Library, GBIF, Wikipedia, iNaturalist, AI Discovery)
   - Stores all enrichment data in shared species library
   - Includes overflow/notes area for data that doesn't fit schema (morphs, variants)
3. Subsequent users adding same species get instant enrichment from library
4. System displays enriched data in organism detail view with:
   - Adorable graphics, facts, animations
   - Wonder, pride, learning
   - Scientific mechanisms (e.g., "guanine crystals" fact)
   - All discovery content tied together (not separate sections)

**Habitat/Ecosystem Enrichment (Manual)**:
1. User has finished setting up a habitat (added all organisms)
2. User triggers "Deep Research" for entire habitat (manual trigger - avoids running 22 times during initial setup)
3. System analyzes complete ecosystem:
   - All organisms in habitat
   - Environmental parameters
   - Biological relationships
   - Generates holistic ecosystem narrative:
     - **Web of Life**: How organisms interact (shelter, filtration, symbiosis)
     - **Biomic Story**: Cohesive narrative of habitat's natural theme
     - **Evolutionary Tension**: Competition, dynamics, biological pressures
     - **Thoughts/Suggestions**: Things the AI loved, things user might want to think about
     - **Overall message**: "Look how fucking cool this thing you cared for is"
     - **Practical tips**: "If you move that light two inches higher, your moss will start growing higher reaching for it"
4. System displays comprehensive ecosystem analysis
5. **Note**: This ties into wonder and awe and CONSERVATORY concept. This is after the main goal of speak-tank-enrich-display-awe.

**Enrichment Stages** (for new species - more if possible, free APIs can be queued in background):
   - **Stage 1**: Local Library search (curated plant DB, links to Kew, iNaturalist)
   - **Stage 2**: GBIF search (taxonomy)
   - **Stage 3**: Wikipedia search (general knowledge)
   - **Stage 4**: iNaturalist search (aliases, images) - handles base species for morphs, stores morph-specific in overflow
   - **Stage 5**: AI Discovery (biological mechanisms - the "wonder" layer)
   - **Additional**: Any free APIs available, queued in background

**Error Handling**: If any stage fails, system continues to next stage. Only if all stages fail is enrichment marked as failed. As long as AI Discovery (Gemini) gets its data, we're good. Species library needs overflow/notes area for things that don't fit schema.

**Species Library**: All enrichment results stored in shared library. First enrichment calls APIs, subsequent uses cached data. Overflow/notes area for morphs, variants, and data that doesn't fit standard schema.

### CUJ 5: Observation Logging (Flexible Catch-All)

**Goal**: Record anything that doesn't have a dedicated field - flexible observation system

**Steps**:
1. User activates voice input or text entry
2. User speaks/types any observation:
   - Environmental: "pH in The Shallows is 6.8, temp 78"
   - Biological events: "The anubias is blooming"
   - Care activities: "I fed the tadpoles extra today"
   - Maintenance notes: "I noticed the water level in the top tank is low"
   - Anything else the user wants to record
3. System transcribes and attempts to parse:
   - If clear intent (LOG_OBSERVATION with parameters): Extracts habitat and parameter values
   - If ambiguous (unsure which habitat/entity): Creates observation event in feed without linking
4. If ambiguous: System just puts the words user said onto a Mad-Libs card, not connected to anything
   - Example: "Added X to Y" - both X and Y are editable slots
5. User can click on X or Y in the feed
6. User can either:
   - Type a new value
   - Select from existing entities
   - Use universal search for both (habitats and organisms)
7. System shows editable confirmation card
8. User links observation to specific habitat or entity
9. System saves linkage and adds to entity's aliases/context for future AI understanding
10. User confirms
11. System creates observation event, properly linked

**Note**: This is a flexible system for capturing anything. If AI isn't sure, it doesn't fail - it just creates an unlinked observation that user can manually connect. This builds context over time.

### CUJ 6: Expert Chat

**Goal**: Get answers to questions about collection, biology, or care

**Priority**: Way down the priority list, not even necessary or needed. Throw this on the backest of back burners.

**Steps** (for future implementation):
1. User opens chat interface
2. User types or speaks question
3. User selects mode:
   - **Grounded Mode**: Real-time web search with source links
   - **Reasoning Mode**: Deep analytical responses
4. System injects context:
   - User's current collection (organisms, habitats)
   - Local plant library data (if relevant to question)
5. System generates response with relevant information
6. In Grounded Mode: System displays clickable source links
7. User can continue conversation with follow-up questions

### CUJ 7: Habitat Ecosystem Narrative

**Goal**: Generate holistic analysis of a habitat's biological relationships - ties into wonder and awe and CONSERVATORY concept

**Steps**:
1. User selects a habitat
2. User triggers "Ecosystem Narrative" action (manual - after main goal of speak-tank-enrich-display-awe)
3. System analyzes:
   - Habitat environmental parameters
   - All organisms in habitat
   - Biological traits of organisms
   - Relationships between organisms
4. System generates comprehensive narrative:
   - **Web of Life**: How organisms interact (shelter, filtration, symbiosis)
   - **Biomic Story**: Cohesive narrative of habitat's natural theme
   - **Evolutionary Tension**: Competition, dynamics, biological pressures
   - **Thoughts/Suggestions**: Things the AI loved, things user might want to think about
   - **Overall message**: "Look how fucking cool this thing you cared for is"
   - **Practical tips**: "If you move that light two inches higher, your moss will start growing higher reaching for it"
5. System displays narrative to user

**Note**: This acknowledges the awesome majesty of biology, time, and nature. This is exactly the line we need to walk - if we fall too far to either side, it should be poetic but not twee. Beautiful and not wrong if it can't be educational. The goal is to inspire wonder while being accurate - poetic when appropriate, educational when possible, but always beautiful and never twee. 

### CUJ 8: Biological Discovery

**Goal**: Learn the scientific mechanisms behind an organism's traits - all tied together, not separate

**Steps**:
1. User views organism detail
2. System displays biological discovery (if enriched) - all content tied together:
   - **Mechanism**: Scientific explanation of how the trait/adaptation works (e.g., "guanine crystals" fact)
   - **Evolutionary Advantage**: Why this trait evolved in the wild
   - **Synergy Note**: How this species benefits others in captive ecosystem
   - **Graphics/Animations**: Adorable little visuals (future: watercolor-on-paper style)
   - **Facts**: Wonder-inducing scientific facts
3. User experiences wonder, pride, and learning
4. All discovery content presented together as cohesive experience, not separate sections

---

## Workflow Patterns

### Confirmation Pattern (Mad-Libs Everywhere, Never Blocking)

**Purpose**: All AI-parsed intents go through user confirmation before committing, but system never blocks on missing data

**Flow**:
1. System parses user input (voice, text, or photo)
2. System creates "pending action" with extracted data
3. **If data is missing** (e.g., pot size not mentioned):
   - System saves with placeholder (---) or assumed value with flag
   - Never prompts or blocks asking for missing data
   - User can fill in later via Mad-Libs on detail card, voice input, or photo
4. System displays confirmation interface with editable fields (Mad-Libs style)
5. User can:
   - Edit any field (species name, quantity, habitat, parameters)
   - Fill in missing fields (--- values)
   - Add/remove traits
   - Adjust parameter values
6. **If user edits something that makes no sense**: System can send whole thing back to AI with user's corrections to see what user is trying to say
7. User confirms or cancels
8. If confirmed: System commits action and creates entities/events (even with --- values)
9. If cancelled: System discards pending action

**Rationale**: AI parsing may be incorrect; user should verify before data is committed. But system never blocks - missing data can be filled in later. Mad-Libs interface makes editing intuitive and fun. Always progressive, never blocking.

**Missing Data Handling**:
- Missing pot size → Saved as "---" or assumed value with flag
- User can fill in later on item detail card via Mad-Libs
- User can clarify via voice: "That pot is 6 inches"
- User can take photo that shows size
- Or just leave it as --- forever (system doesn't care)

### Enrichment Pattern

**Purpose**: Gather external data to enhance organism records

**Flow**:
1. Species is mentioned/identified (voice, text, or photo)
2. **System immediately enriches** (before user confirms):
   - Checks species library - if exists, uses cached data
   - If new species: Queries all enrichment sources
   - Saves to shared species library
3. System displays enriched data in confirmation interface
4. User confirms or edits
5. If user confirms: Full enrichment completes, all data saved to library
6. System updates organism with enriched data
7. System marks enrichment as complete

**Key Distinction**:
- **Individual Species**: Auto-enriches immediately when parsed
- **Habitat/Ecosystem**: Manual trigger only (user decides when ready for holistic analysis)

**Rationale**: Auto-enrichment for species builds library efficiently. Manual enrichment for habitats prevents 22 enrichment calls during initial setup.

### Offline-First Pattern

**Purpose**: Ensure plant database and taxonomic data are always available

**Flow**:
1. Plant database and taxonomic data stored locally (scraped and bundled)
2. **Data is cheap, text is tiny** - can probably download entire world taxonomy locally
3. User actions create local records immediately
4. System attempts to sync with cloud when online
5. If offline: Records stored locally, databases still accessible
6. When online: System syncs local records to cloud
7. System merges local and cloud data (local pending events preserved, cloud entities replace local)

**Rationale**: Primary goal is ensuring database availability without external API dependency. Data storage is cheap, so local caching of taxonomic data is feasible.

### Multi-Modal Input Pattern

**Purpose**: Users can input data through multiple interfaces

**Options**:
- **Voice**: Natural language commands (primary)
- **Text Entry**: For users who can't use voice - types same commands, goes to same parser
- **Camera**: Photo identification for spatial extraction
- **Manual**: Direct editing in confirmation interface (Mad-Libs)

**Rationale**: Different situations and user needs call for different input methods. Accessibility requires text entry option.

---

## System Behaviors

### Entity Resolution

When user mentions a habitat or organism by name:
- System builds index with aliases (not hard - users don't buy tanks/fish every day, they set up once, add a ton the first day, maybe add a few things a month)
- Users won't have 10,323 tanks - it will be like 16
- System searches existing entities by name and aliases
- System performs fuzzy matching (handles typos, partial names)
- If exact match: System uses that entity
- If multiple matches: System marks as ambiguous, shows in confirmation card (doesn't block)
- If no match: System creates new entity (for habitats) or creates with best guess (for organisms) - never blocks asking for clarification
- **Never blocking**: System always creates entity, even if uncertain - user can correct in Mad-Libs confirmation or detail card later

### Trait Inference

When user mentions a species:
- System infers biological traits from species name
- System may infer: AQUATIC (if fish/water plant), PHOTOSYNTHETIC (if plant), INVERTEBRATE (if shrimp/snail), etc.
- User can edit inferred traits in confirmation interface

### Active Habitat Context

System maintains concept of "active habitat":
- User can set active habitat for context-aware operations
- Some operations default to active habitat if not specified
- UI may adapt based on active habitat's characteristics (biome theme)

### Event Sourcing

All changes create events:
- Entity accessions create ACCESSION events
- Habitat modifications create MODIFY_HABITAT events
- Observations create OBSERVATION events
- Removals create REMOVAL events
- Events are stored and can be viewed in activity feed
- Events contain original user input, parsed data, and metadata

### Real-Time Sync

When multiple devices/tabs are open:
- Changes on one device sync to others in real-time
- Local changes appear immediately (optimistic updates)
- Cloud changes overwrite local when received
- No conflict resolution (last-write-wins)

---

## User Goals (Explicit and Implicit)

### Primary Goal

**To be WOWED and AWED by their collection and the majesty of the world**. Users open the app because last time they left feeling **smart, happy, and proud**. The app is a beautiful digital representation of what they love and care about - it updates and adapts as they make changes, and they learn about what they have, develop pride and knowledge.

### Explicit Goals

1. **Minimize Data Entry**: Use AI to interpret natural language instead of forms
2. **Wonder and Discovery**: Connect to authoritative sources (scraped plant DB, Kew, iNaturalist, GBIF) to reveal fascinating biological mechanisms - this is about CONSERVATORY (wonder), not maintenance
3. **Rapid Accessioning**: Quickly add organisms via camera (spatial extraction) or voice/text
4. **Educational Value**: Learn about biological mechanisms, evolutionary advantages, and ecosystem relationships through adorable graphics, facts, and animations
5. **Plant Database Availability**: Ensure curated plant database and taxonomic data are always accessible (data is cheap, can store locally)

### Implicit Goals (Inferred)

1. **User Control**: Always confirm before committing (no auto-actions), all data user-editable. Mad-Libs everywhere.
2. **Species Library Efficiency**: Auto-enrich individual species immediately (creates library), manual enrich habitats (avoids 22 enrichment calls during initial setup)
3. **Data Portability**: Cloud backup is standard, local storage for databases
4. **Rapid Development**: System supports quick iteration and testing
5. **Always Editable**: Validation is guidance, not enforcement - user can always edit/correct
6. **Wonder First**: The whole deal is AI Discovery - quickly tell/show tank, get adorable graphics/facts/animations, feel wonder/pride/learning

---

## Data Relationships

### Habitat → Organisms
- One habitat contains many organisms
- Organisms reference their habitat
- Deleting habitat should handle orphaned organisms (not specified in current system)

### Organisms → Traits
- One organism has many traits
- Traits are mix-and-match (organism can be AQUATIC + PHOTOSYNTHETIC)
- Traits have parameters (pH, temp, etc.)

### Organisms → Groups
- Organisms can belong to user-defined groups
- Groups are collections for organization

### Events → Entities
- Events reference entities (habitats, organisms)
- Events record what happened and when
- Events contain original user input

### Enrichment → Organisms
- Enrichment data enhances organism records
- Enrichment auto-triggers for individual species
- Enrichment status tracked (none, queued, pending, complete, failed)
- Species library stores enrichment data shared across users
- Overflow/notes area for data that doesn't fit schema (morphs, variants)

---

## Edge Cases and Special Behaviors

### Ambiguous Input
- If system cannot parse intent: Shows strategy interface with suggestions
- User can accept suggestion or provide more details
- System attempts to interpret rather than rejecting
- If user edits confirmation card and it makes no sense: System can send back to AI with corrections

### Photo Identification Confidence
- System includes medium confidence guesses
- User can review and correct in Mad-Libs confirmation cards
- Goal is spatial extraction first, species ID secondary

### Rack Discovery False Positives
- User can deselect containers that were incorrectly identified
- Only selected containers create habitats
- All detected species immediately checked against localDB and enriched if needed

### Enrichment Failures
- If any enrichment stage fails: System continues to next stage
- Only if all stages fail: Enrichment marked as failed
- Partial enrichment is acceptable (some data better than none)
- As long as AI Discovery (Gemini) gets its data, we're good
- Species library has overflow/notes area for morphs, variants, and data that doesn't fit schema

### Offline Writes
- Local writes succeed immediately
- When online: System syncs to cloud
- No conflict resolution (cloud overwrites local)

### Duplicate Prevention
- System checks for existing organisms with same name in same habitat
- If duplicate found: System skips creation (does not create duplicate)

### Morph/Variant Handling
- When user adds specific morph (e.g., specific crested gecko morph):
- System pulls base species data from iNaturalist ("Crested Gecko")
- System stores morph-specific info in overflow/notes area
- Enrichment data includes both base species and morph-specific information

---

## Future Considerations (Not Yet Implemented)

These workflows are planned but not yet in the system:

1. **Historical Charts**: Display observation data over time in charts (component exists but not wired)
2. **Image Storage**: Persist photos to storage (currently base64 in memory only)
3. **Export/Sharing**: Export collection data or share organism cards
4. **Search/Filter**: Global search across all entities
5. **Multi-User Isolation**: User-scoped data (auth exists but data not isolated) - not necessary but possible
6. **Conflict Resolution**: Merge strategies for concurrent edits (currently last-write-wins)
7. **Generated Graphics/Animations**: Watercolor-on-paper style visuals showing organisms with facts appearing (UI polish, later)
8. **Expert Chat**: Way down priority list, back burner

---

## Summary

The Conservatory enables users to manage biological collections through:
- **Multimodal input** (voice, text, camera, manual)
- **AI-powered parsing** of natural language and images
- **Mad-Libs confirmation interfaces** everywhere for user verification
- **Immediate auto-enrichment** for individual species (builds shared library)
- **Manual enrichment** for holistic habitat/ecosystem analysis
- **External enrichment** from multiple authoritative sources
- **Offline-first operation** with local database storage (data is cheap)
- **Event tracking** of all changes
- **Educational content** about biological mechanisms - **THE WHOLE DEAL**
- **Non-blocking data entry** - save all data, never prompt for missing fields, user can fill in later

**Core Philosophy**: This is about **WONDER** and **DISCOVERY**, not maintenance. Users open the app to be WOWED and AWED by their collection and the majesty of the world. They leave feeling smart, happy, and proud. The system gives them adorable graphics, facts, and animations that inspire wonder, pride, and learning. "What does CONSERVATORY mean?" - return to this concept when uncertain.

**Core UX Principle**: **Save all data, ask user to confirm, but NEVER BLOCKING**. Missing data is saved as placeholders (---) or assumed values with flags. User can fill in later via Mad-Libs on detail cards, voice input, or photos. System never says "you must tell me X" - always progressive, never blocking.

The system prioritizes **user control** (Mad-Libs confirmations, always editable), **immediate enrichment** (species library building), **non-blocking UX** (never prompt for missing data), and **wonder-inducing discovery** (AI-generated biological mechanisms, graphics, facts) over automation and real-time collaboration features.
