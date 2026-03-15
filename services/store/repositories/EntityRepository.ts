
import { 
  db, collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  query, orderBy, writeBatch, serverTimestamp, onSnapshot 
} from '../../firebase';
import { Entity, EntityGroup } from '../../../types';
import { logger } from '../../logger';

export class EntityRepository {
  private collectionName = 'entities';

  async getById(id: string): Promise<Entity | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Entity : null;
  }

  async update(id: string, updates: Partial<Entity>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await setDoc(docRef, { ...updates, updated_at: Date.now() }, { merge: true });
  }

  async getAll(): Promise<Entity[]> {
    const q = query(collection(db, this.collectionName), orderBy('updated_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entity));
  }

  subscribe(onUpdate: (entities: Entity[]) => void) {
    const q = query(collection(db, this.collectionName), orderBy('updated_at', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const entities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entity));
      onUpdate(entities);
    });
  }
}

export const entityRepo = new EntityRepository();
