
import { 
  db, collection, doc, addDoc, getDocs, 
  query, orderBy, limit, onSnapshot, serverTimestamp 
} from '../../firebase';
import { AppEvent, EventStatus } from '../../../types';
import { logger } from '../../logger';

export class EventRepository {
  private collectionName = 'events';

  async createEvent(eventData: any): Promise<string> {
    const docRef = await addDoc(collection(db, this.collectionName), {
      ...eventData,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  }

  async getRecentEvents(limitCount = 100): Promise<AppEvent[]> {
    const q = query(
      collection(db, this.collectionName), 
      orderBy('timestamp', 'desc'), 
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now(),
        raw_input: data.metadata?.originalTranscript || 'Manual Entry',
        status: EventStatus.PARSED,
        domain_event: {
          eventId: doc.id,
          type: data.type,
          timestamp: new Date().toISOString(),
          payload: data.payload,
          metadata: data.metadata
        }
      } as AppEvent;
    });
  }

  subscribeToEvents(onUpdate: (events: AppEvent[]) => void) {
    const q = query(
      collection(db, this.collectionName), 
      orderBy('timestamp', 'desc'), 
      limit(100)
    );
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => {
        const data = doc.data();
        const ts = data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now();
        return {
          id: doc.id,
          timestamp: ts,
          raw_input: data.metadata?.originalTranscript || 'Manual Entry',
          status: EventStatus.PARSED,
          domain_event: {
            eventId: doc.id,
            type: data.type,
            timestamp: new Date(ts).toISOString(),
            payload: data.payload,
            metadata: data.metadata
          }
        } as AppEvent;
      });
      onUpdate(events);
    });
  }
}

export const eventRepo = new EventRepository();
