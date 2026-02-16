
import admin from 'firebase-admin';
import fs from 'fs';

/**
 * CLEANUP SCRIPT: Enrichment Queue
 * 
 * Finds entities stuck in 'pending' for > 1 hour and resets them to 'queued' 
 * so they can be re-processed by the serial processor.
 */

const serviceAccountPath = 'C:\Users\wowth\Desktop\Projects\conservatory-admin-key.json';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'))),
    projectId: 'the-conservatory-d858b'
  });
}

const db = (admin.app().firestore as any)('theconservatory');

async function cleanup() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  console.log("🔍 Searching for stuck enrichment tasks...");
  
  const stuckEntities = await db.collection('entities')
    .where('enrichment_status', '==', 'pending')
    .get();

  if (stuckEntities.empty) {
    console.log("✅ No stuck entities found.");
    return;
  }

  let count = 0;
  const batch = db.batch();

  stuckEntities.docs.forEach((doc: any) => {
    const data = doc.data();
    const updatedAt = data.updated_at || 0;
    
    if (updatedAt < oneHourAgo) {
      batch.update(doc.ref, {
        enrichment_status: 'queued',
        updated_at: Date.now(),
        error_log: 'Enrichment timed out (stuck in pending > 1hr)'
      });
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`♻️ Reset ${count} stuck entities to 'queued'.`);
  } else {
    console.log("✅ All pending entities are recent.");
  }
}

cleanup().catch(err => {
  console.error("❌ Cleanup failed:", err);
  process.exit(1);
});
