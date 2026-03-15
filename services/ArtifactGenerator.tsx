import { Entity } from '../types';
import { echoEngineService } from './EchoEngine';
import { renderToString } from 'react-dom/server';
import { CuratorsCard } from '../components/CuratorsCard';
import html2canvas from 'html2canvas';

/**
 * A service for generating shareable artifacts, like the "Curator's Card".
 */
class ArtifactGeneratorService {

  /**
   * Generates a "Curator's Card" image for a given entity.
   * 
   * @param entity The entity to create the card for.
   * @returns A base64 encoded data URL of the generated card image.
   */
  async generateCard(entity: Entity): Promise<string> {
    try {
      // 1. Generate the Echo image for the card.
      const echoImageUrl = await echoEngineService.generateEcho(entity.currentEchoUrl || "placeholder"); // Use currentEchoUrl if available
      const secretFact = entity.aweInspiringFacts?.[0]?.fact;
      const nativeRangeMapUrl = (entity.overflow as any)?.nativeRangeMapUrl; // Assuming this path

      // 2. Create a temporary, off-screen element to render the React component.
      const cardElement = document.createElement('div');
      cardElement.style.position = 'absolute';
      cardElement.style.left = '-9999px';
      document.body.appendChild(cardElement);

      // We need to render the component to an HTML string and then set it.
      // A better way would be to use a library that can render a component to canvas directly.
      const cardHtml = renderToString(
        <CuratorsCard 
          entity={entity} 
          echoImageUrl={echoImageUrl} 
          secretFact={secretFact} 
          nativeRangeMapUrl={nativeRangeMapUrl} 
        />
      );
      cardElement.innerHTML = cardHtml;

      // 3. Use html2canvas to render the element to an image.
      const canvas = await html2canvas(cardElement.firstChild as HTMLElement);
      const dataUrl = canvas.toDataURL('image/png');

      // 4. Clean up the temporary element.
      document.body.removeChild(cardElement);

      return dataUrl;

    } catch (error) {
      console.error("Error generating Curator's Card:", error);
      throw new Error("Failed to generate Curator's Card.");
    }
  }
}

export const artifactGeneratorService = new ArtifactGeneratorService();
