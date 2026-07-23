
import { 
  db, collection, doc, getDoc, getDocs, setDoc, 
  query, where, orderBy, onSnapshot 
} from '../../firebase';
import { Entity, EntityType } from '../../../types';
import { logger } from '../../logger';

export class HabitatRepository {
  private collectionName = 'entities';

  async getAllHabitats(): Promise<Entity[]> {
    const q = query(
      collection(db, this.collectionName), 
      where('type', '==', EntityType.HABITAT),
      orderBy('updated_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entity));
  }

  async getInhabitants(habitatId: string): Promise<Entity[]> {
    const q = query(
      collection(db, this.collectionName),
      where('habitat_id', '==', habitatId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entity));
  }

  /**
   * Safe atomic update for habitat metadata
   */
  async updateHabitat(id: string, updates: Partial<Entity>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await setDoc(docRef, { ...updates, updated_at: Date.now() }, { merge: true });
  }
}

export const habitatRepo = new HabitatRepository();
