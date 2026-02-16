import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SEED SCRIPT: Species Library
 * 
 * Takes the enriched JSON from Aquasabi scraper and uploads it to Firestore
 * in the 'species_library' collection within the 'theconservatory' database.
 */

// Initialize Admin SDK
const serviceAccountPath = 'C:\\Users\\wowth\\Desktop\\Projects\\conservatory-admin-key.json';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'))),
    projectId: 'the-conservatory-d858b'
  });
}

// In Admin SDK v11.4.0+, to target a specific database
const conservatoryDb = getFirestore('theconservatory');

async function seed() {
  const filePath = path.join(__dirname, '../src/data/plant_library_enriched.json');
  
  if (!fs.existsSync(filePath)) {
    console.error("❌ Enriched plant library not found at:", filePath);
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`📦 Loaded ${data.length} plants from JSON.`);

  // Attempt to write to the 'theconservatory' named database
  const collectionRef = conservatoryDb.collection('species_library');
  
  // Use batches for efficiency (Firestore limit is 500 per batch)
  const BATCH_SIZE = 400;
  let count = 0;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = conservatoryDb.batch();
    const chunk = data.slice(i, i + BATCH_SIZE);

    chunk.forEach((plant: any) => {
      // Create a clean ID (lowercase scientific name or slug)
      const plantId = plant.id || plant.name.toLowerCase().replace(/\s+/g, '-');
      const docRef = collectionRef.doc(plantId);
      
      batch.set(docRef, {
        ...plant,
        type: 'PLANT', // All these are plants
        source: 'aquasabi',
        updated_at: FieldValue.serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
    count += chunk.length;
    console.log(`✅ Uploaded batch: ${count}/${data.length} plants...`);
  }

  console.log("⭐ Seeding complete!");
}

seed().catch(err => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
