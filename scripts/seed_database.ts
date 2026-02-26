
import { db, collection, doc, writeBatch, serverTimestamp } from '../services/firebase';
import { v4 as uuidv4 } from 'uuid';
import { EntityType } from '../types';

/**
 * SEED SCRIPT: The Curator's Collection
 * Populates 3 Habitats and 20+ Organisms
 */

async function seed() {
  console.log("🌱 Starting curator seed process...");
  const batch = writeBatch(db);

  // --- HABITATS ---
  const habitats = [
    {
      id: 'hab-amazon-001',
      name: "Amazonian Blackwater Basin",
      type: EntityType.HABITAT,
      traits: [{ type: 'AQUATIC', parameters: { pH: 5.5, temp: 82, salinity: 'fresh' } }],
      overflow: { narrative: "A dark, tannin-rich sanctuary mimicking the Rio Negro. Fallen leaves and tangled roots provide shelter for delicate dwarf cichlids." },
      created_at: Date.now(),
      updated_at: Date.now()
    },
    {
      id: 'hab-dutch-002',
      name: "Emerald Dutch Garden",
      type: EntityType.HABITAT,
      traits: [{ type: 'AQUATIC', parameters: { pH: 6.8, temp: 75, salinity: 'fresh', co2: true } }],
      overflow: { narrative: "A high-tech precision aquascape focusing on vibrant plant contrasts and mathematical placement. Every leaf is a calculated stroke of art." },
      created_at: Date.now(),
      updated_at: Date.now()
    },
    {
      id: 'hab-monsoon-003',
      name: "Monsoon Terrarium",
      type: EntityType.HABITAT,
      traits: [{ type: 'TERRESTRIAL', parameters: { humidity: 85, temp: 78 } }],
      overflow: { narrative: "A vertical slice of a tropical cloud forest. Mist-clung mosses and epiphytes drape over volcanic stone." },
      created_at: Date.now(),
      updated_at: Date.now()
    }
  ];

  habitats.forEach(h => {
    const ref = doc(db, 'entities', h.id);
    batch.set(ref, h);
  });

  // --- ORGANISMS ---
  const organisms = [
    // Amazonian Residents
    { name: "Cardinal Tetra", scientificName: "Paracheirodon axelrodi", hab: 'hab-amazon-001', type: EntityType.ORGANISM, qty: 30, traits: [{ type: 'AQUATIC', parameters: {} }] },
    { name: "Apistogramma Agassizii", scientificName: "Apistogramma agassizii", hab: 'hab-amazon-001', type: EntityType.ORGANISM, qty: 2, traits: [{ type: 'AQUATIC', parameters: {} }] },
    { name: "Otocinclus Catfish", scientificName: "Otocinclus macrospilus", hab: 'hab-amazon-001', type: EntityType.ORGANISM, qty: 6, traits: [{ type: 'AQUATIC', parameters: {} }] },
    { name: "Amazon Frogbit", scientificName: "Limnobium laevigatum", hab: 'hab-amazon-001', type: EntityType.PLANT, qty: 15, traits: [{ type: 'PHOTOSYNTHETIC', parameters: { placement: 'floating' } }] },
    
    // Dutch Garden Residents
    { name: "Rotala rotundifolia 'H'ra'", scientificName: "Rotala rotundifolia", hab: 'hab-dutch-002', type: EntityType.PLANT, qty: 50, traits: [{ type: 'PHOTOSYNTHETIC', parameters: { lightReq: 'high' } }] },
    { name: "Amano Shrimp", scientificName: "Caridina multidentata", hab: 'hab-dutch-002', type: EntityType.ORGANISM, qty: 12, traits: [{ type: 'INVERTEBRATE', parameters: {} }] },
    { name: "Ludwigia palustris 'Super Red'", scientificName: "Ludwigia palustris", hab: 'hab-dutch-002', type: EntityType.PLANT, qty: 20, traits: [{ type: 'PHOTOSYNTHETIC', parameters: { lightReq: 'high' } }] },
    { name: "Siamese Algae Eater", scientificName: "Crossocheilus oblongus", hab: 'hab-dutch-002', type: EntityType.ORGANISM, qty: 3, traits: [{ type: 'AQUATIC', parameters: {} }] },
    { name: "Monte Carlo", scientificName: "Micranthemum 'Monte Carlo'", hab: 'hab-dutch-002', type: EntityType.PLANT, qty: 5, traits: [{ type: 'PHOTOSYNTHETIC', parameters: { placement: 'foreground' } }] },
    
    // Monsoon Residents
    { name: "Dart Frog 'Blue'", scientificName: "Dendrobates tinctorius", hab: 'hab-monsoon-003', type: EntityType.ORGANISM, qty: 4, traits: [{ type: 'TERRESTRIAL', parameters: {} }] },
    { name: "Creeping Fig", scientificName: "Ficus pumila", hab: 'hab-monsoon-003', type: EntityType.PLANT, qty: 1, traits: [{ type: 'PHOTOSYNTHETIC', parameters: {} }] },
    { name: "Bromeliad 'Neoregelia'", scientificName: "Neoregelia ampullacea", hab: 'hab-monsoon-003', type: EntityType.PLANT, qty: 3, traits: [{ type: 'PHOTOSYNTHETIC', parameters: { placement: 'epiphyte' } }] },
    { name: "Java Moss", scientificName: "Taxiphyllum barbieri", hab: 'hab-monsoon-003', type: EntityType.PLANT, qty: 10, traits: [{ type: 'PHOTOSYNTHETIC', parameters: {} }] },
    { name: "Springtails", scientificName: "Collembola", hab: 'hab-monsoon-003', type: EntityType.COLONY, qty: 1000, traits: [{ type: 'COLONY', parameters: {} }] },

    // Misc/Roaming
    { name: "Mystery Snail", scientificName: "Pomacea bridgesii", hab: 'hab-amazon-001', type: EntityType.ORGANISM, qty: 4, traits: [{ type: 'INVERTEBRATE', parameters: {} }] },
    { name: "Anubias Nana Petite", scientificName: "Anubias barteri var. nana", hab: 'hab-amazon-001', type: EntityType.PLANT, qty: 8, traits: [{ type: 'PHOTOSYNTHETIC', parameters: { placement: 'epiphyte' } }] },
    { name: "Java Fern", scientificName: "Microsorum pteropus", hab: 'hab-dutch-002', type: EntityType.PLANT, qty: 5, traits: [{ type: 'PHOTOSYNTHETIC', parameters: { placement: 'epiphyte' } }] },
    { name: "Bucephalandra 'Kedagang'", scientificName: "Bucephalandra sp.", hab: 'hab-dutch-002', type: EntityType.PLANT, qty: 12, traits: [{ type: 'PHOTOSYNTHETIC', parameters: { placement: 'epiphyte' } }] },
    { name: "Ember Tetra", scientificName: "Hyphessobrycon amandae", hab: 'hab-amazon-001', type: EntityType.ORGANISM, qty: 25, traits: [{ type: 'AQUATIC', parameters: {} }] },
    { name: "Vampire Crab", scientificName: "Geosesarma dennerle", hab: 'hab-monsoon-003', type: EntityType.ORGANISM, qty: 6, traits: [{ type: 'INVERTEBRATE', parameters: {} }] }
  ];

  organisms.forEach(o => {
    const id = uuidv4();
    const ref = doc(db, 'entities', id);
    batch.set(ref, {
      ...o,
      id,
      habitat_id: o.hab,
      aliases: [],
      enrichment_status: 'queued',
      created_at: Date.now(),
      updated_at: Date.now(),
      confidence: 1
    });
  });

  await batch.commit();
  console.log("✅ Seed complete! Collection is now live.");
}

seed().catch(console.error);
