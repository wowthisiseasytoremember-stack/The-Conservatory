
import { v4 as uuidv4 } from 'uuid';
import { Entity, AppEvent, EventStatus } from '../types';

/**
 * MockFirestoreService provides an in-memory alternative to Firebase Firestore.
 * Useful for automated tests and development without a network connection.
 */
export class MockFirestoreService {
  private entities: Map<string, any> = new Map();
  private events: Map<string, any> = new Map();

  async setDoc(collection: string, id: string, data: any) {
    if (collection === 'entities') {
      this.entities.set(id, { ...data, id });
    } else {
      this.events.set(id, { ...data, id });
    }
    console.log(`[MockFirestore] setDoc ${collection}/${id}`, data);
    return Promise.resolve();
  }

  async addDoc(collectionName: string, data: any) {
    const id = uuidv4();
    if (collectionName === 'entities') {
      this.entities.set(id, { ...data, id });
    } else {
      this.events.set(id, { ...data, id });
    }
    console.log(`[MockFirestore] addDoc ${collectionName}/${id}`, data);
    return Promise.resolve({ id });
  }

  async updateDoc(collectionName: string, id: string, data: any) {
    const existing = collectionName === 'entities' ? this.entities.get(id) : this.events.get(id);
    if (!existing) {
      console.warn(`[MockFirestore] updateDoc ${collectionName}/${id} - Document not found`);
      return Promise.resolve();
    }
    const updated = { ...existing, ...data };
    if (collectionName === 'entities') {
      this.entities.set(id, updated);
    } else {
      this.events.set(id, updated);
    }
    console.log(`[MockFirestore] updateDoc ${collectionName}/${id}`, data);
    return Promise.resolve();
  }


  async commitBatch(operations: any[]) {
    console.log(`[MockFirestore] Committing batch with ${operations.length} operations`);
    for (const op of operations) {
      const pathParts = op.ref.path.split('/');
      const collection = pathParts[0];
      const id = pathParts[1];

      if (op.type === 'set' || op.type === 'update') {
        if (collection === 'entities') {
          this.entities.set(id, { ...op.data, id });
        } else {
          this.events.set(id, { ...op.data, id });
        }
      }
    }
    return Promise.resolve();
  }

  getEntities() {
    return Array.from(this.entities.values());
  }

  getEvents() {
    return Array.from(this.events.values());
  }

  clear() {
    this.entities.clear();
    this.events.clear();
  }
}

export const mockFirestore = new MockFirestoreService();
