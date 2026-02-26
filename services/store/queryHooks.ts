import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, collection, query, orderBy, getDocs, doc, setDoc, updateDoc } from '../firebase';
import { Entity, AppEvent, EntityGroup } from '../../types';
import { logger } from '../logger';

/**
 * Modern data fetching hooks using TanStack Query.
 * Replaces the manual Firestore sync logic in rootStore.ts.
 */

export const useEntities = () => {
  return useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      logger.debug("Fetching entities from Firestore");
      const q = query(collection(db, 'entities'), orderBy('updated_at', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entity));
    }
  });
};

export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const q = query(collection(db, 'events'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppEvent));
    }
  });
};

export const useUpdateEntity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Entity> }) => {
      const entityRef = doc(db, 'entities', id);
      await updateDoc(entityRef, { ...updates, updated_at: Date.now() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
    }
  });
};
