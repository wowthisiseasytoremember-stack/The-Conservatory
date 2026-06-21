/**
 * Merge Flowgrow + Aquasabi into plant_library_enriched.json
 * Usage: node scripts/merge_enriched.js
 *
 * Combines:
 *   - src/data/plant_library.json     (Aquasabi base, 381 plants)
 *   - src/data/flowgrow_data.json     (Flowgrow plants)
 * Into:
 *   - src/data/plant_library_enriched.json
 *
 * Merge rule: match by scientific name (case-insensitive).
 * If both exist: keep Aquasabi entry as base, inject Flowgrow traits as enrichment.
 * If only Flowgrow: add as new entry with listingType='flowgrow'.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '../src/data');

const aquasabi = JSON.parse(readFileSync(join(DATA, 'plant_library.json'), 'utf-8'));
const flowgrow = JSON.parse(readFileSync(join(DATA, 'flowgrow_data.json'), 'utf-8'));

// Index Aquasabi by scientific name (lowercase)
const aqIndex = new Map();
aqIndex.set('cladophora aegagropila', { source: 'aquasabi', entry: null });
aquasabi.forEach(p => {
  const key = (p.scientificName || p.name).toLowerCase().trim();
  aqIndex.set(key, { source: 'aquasabi', entry: p });
});

const enriched = [...aquasabi]; // All Aquasabi entries go in as-is

let mergedCount = 0;
let addedCount = 0;

flowgrow.forEach(fg => {
  const key = (fg.scientificName || fg.name).toLowerCase().trim();
  const existing = aqIndex.get(key);

  if (existing && existing.entry) {
    // Merge: inject Flowgrow traits into Aquasabi entry
    const idx = enriched.findIndex(p =>
      (p.scientificName || p.name).toLowerCase().trim() === key
    );
    if (idx !== -1) {
      // Add Flowgrow traits as enrichment (don't overwrite Aquasabi's)
      enriched[idx].flowgrowTraits = fg.traits;
      enriched[idx].flowgrowUrl = fg.url;
      enriched[idx].flowgrowImages = fg.images;
      mergedCount++;
    }
  } else if (fg.scientificName !== fg.name || fg.name !== fg.id) {
    // New plant from Flowgrow — add as-is with listingType
    fg.listingType = 'flowgrow';
    enriched.push(fg);
    addedCount++;
  }
});

writeFileSync(join(DATA, 'plant_library_enriched.json'), JSON.stringify(enriched, null, 2));
console.log(`Enriched: ${aquasabi.length} Aquasabi + ${flowgrow.length} Flowgrow → ${enriched.length} total`);
console.log(`  Merged (Flowgrow enrichment on existing): ${mergedCount}`);
console.log(`  Added (new Flowgrow-only plants): ${addedCount}`);
