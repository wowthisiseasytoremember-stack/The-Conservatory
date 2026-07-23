import { v4 as uuidv4 } from 'uuid';
import { db, writeBatch, doc, collection, serverTimestamp } from '../../firebase';
import { PendingAction, Entity, EntityType, DomainEvent, AppEvent, EventStatus } from '../../../types';
import { imageService } from '../../imageService';
import { taxonomyService } from '../../taxonomy';
import { logger } from '../../logger';

export class ActionCommittalUseCase {
  async execute(action: PendingAction, currentEntities: Entity[]): Promise<void> {
    const batch = writeBatch(db);
    
    // 1. Prepare Payload & Event
    const safePayload = JSON.parse(JSON.stringify(action));
    delete safePayload.status;
    delete safePayload.isAmbiguous;

    const eventType = action.intent === 'ACCESSION_ENTITY' ? 'ENTITY_ACCESSIONED' : 
                      action.intent === 'MODIFY_HABITAT' ? 'MODIFY_HABITAT' : 'OBSERVATION_LOGGED';

    // 2. Handle Image Upload (if any)
    let uploadedImageUrl: string | undefined;
    if (safePayload.imageBase64) {
      try {
        uploadedImageUrl = await imageService.uploadImage(safePayload.imageBase64, 'observations');
        safePayload.photoUrl = uploadedImageUrl;
      } catch (e) {
        logger.error({ err: e }, "Image upload failed in UseCase");
      }
    }

    // 3. Queue Event Record
    const eventRef = doc(collection(db, 'events'));
    batch.set(eventRef, {
      type: eventType,
      timestamp: serverTimestamp(),
      payload: safePayload,
      metadata: {
        source: 'voice',
        originalTranscript: action.transcript
      }
    });

    // 4. Intent-specific Processing
    if (action.intent === 'ACCESSION_ENTITY') {
      await this.processAccession(action, safePayload, uploadedImageUrl, currentEntities, batch);
    } else if (action.intent === 'MODIFY_HABITAT') {
      this.processHabitatModification(safePayload, uploadedImageUrl, currentEntities, batch);
    }

    // 5. Commit Atomically
    await batch.commit();
    logger.info({ intent: action.intent }, "Action committed via UseCase");
  }

  private async processAccession(action: any, safePayload: any, imageUrl: string | undefined, entities: Entity[], batch: any) {
    const targetHabitatId = safePayload.targetHabitatId || 
      entities.find(e => e.type === EntityType.HABITAT && e.name.toLowerCase().trim() === (safePayload.targetHabitatName || '').toLowerCase().trim())?.id;

    for (const cand of action.candidates || []) {
      const id = uuidv4();
      let type = EntityType.ORGANISM;
      if (cand.traits?.some((t: any) => t.type === 'PHOTOSYNTHETIC')) type = EntityType.PLANT;

      let entityData: any = {
        name: cand.commonName,
        scientificName: cand.scientificName, 
        habitat_id: targetHabitatId,
        traits: cand.traits || [],
        type,
        quantity: cand.quantity || 1,
        created_at: Date.now(),
        updated_at: Date.now(),
        enrichment_status: 'queued',
        overflow: { images: imageUrl ? [imageUrl] : [] }
      };

      try {
        entityData = await taxonomyService.autoEnrich(entityData);
      } catch (e) {}

      batch.set(doc(db, 'entities', id), entityData);
    }
  }

  private processHabitatModification(safePayload: any, imageUrl: string | undefined, entities: Entity[], batch: any) {
    const habitatName = safePayload.habitatParams?.name || `New Habitat`;
    const id = uuidv4();
    const habitatData = {
      name: habitatName,
      type: EntityType.HABITAT,
      traits: [{ type: 'AQUATIC', parameters: { salinity: 'fresh' } }],
      created_at: Date.now(),
      updated_at: Date.now(),
      enrichment_status: 'queued',
      overflow: { illustration: imageUrl }
    };
    batch.set(doc(db, 'entities', id), habitatData);
  }
}

export const actionCommittalUseCase = new ActionCommittalUseCase();
