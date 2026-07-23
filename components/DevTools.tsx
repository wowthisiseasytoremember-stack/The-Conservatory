// Developer tools and test harnesses can be added here.
// For example, a button to trigger the Echo Engine.

import React from 'react';
import { echoEngineService } from '../services/EchoEngine';
import { blueprintService } from '../services/BlueprintService';
import { enrichmentService } from '../services/enrichmentService';

export const DevTools: React.FC = () => {
  const handleTestEnrich = async () => {
    try {
      const testEntity: any = {
        id: 'test-id',
        name: "Anubias nana 'Petite'",
        scientificName: "Anubias barteri var. nana 'Petite'",
        type: 'PLANT'
      };
      const result = await enrichmentService.enrichEntity(testEntity);
      console.log("Enrichment Result:", result);
      alert("Enrichment complete. Check console for result.");
    } catch (error) {
      console.error(error);
      alert("Enrichment failed.");
    }
  };

  const handleGenerateEcho = async () => {
    try {
      // In a real scenario, we'd get the image from the selected entity.
      const placeholderBase64 = "base64-encoded-image-data";
      const imageUrl = await echoEngineService.generateEcho(placeholderBase64);
      console.log("Generated Echo Image URL:", imageUrl);
      alert(`Generated Echo Image URL: ${imageUrl}`);
    } catch (error) {
      console.error(error);
      alert("Failed to generate Echo.");
    }
  };

  const handleEvolveEcho = async () => {
    try {
      const placeholderUrl = "https://picsum.photos/seed/1/512";
      const growthEvent = "sprouted a new leaf";
      const imageUrl = await echoEngineService.evolveEcho(placeholderUrl, growthEvent);
      console.log("Evolved Echo Image URL:", imageUrl);
      alert(`Evolved Echo Image URL: ${imageUrl}`);
    } catch (error) {
      console.error(error);
      alert("Failed to evolve Echo.");
    }
  };

  const handleScanRack = async () => {
    try {
      const placeholderBase64 = "base64-encoded-image-data";
      const outlines = await blueprintService.scanRack(placeholderBase64);
      console.log("Scanned Habitat Outlines:", outlines);
      alert(`Scanned ${outlines.length} habitat outlines. Check the console for details.`);
    } catch (error) {
      console.error(error);
      alert("Failed to scan rack.");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50">
      <h3 className="text-lg font-bold mb-2">Dev Tools</h3>
      <div className="flex flex-col space-y-2">
        <button 
          onClick={handleTestEnrich}
          className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
        >
          Test Enrich Entity
        </button>
        <button 
          onClick={handleGenerateEcho}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Test Generate Echo
        </button>
        <button 
          onClick={handleEvolveEcho}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Test Evolve Echo
        </button>
        <button 
          onClick={handleScanRack}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
        >
          Test Scan Rack
        </button>
      </div>
    </div>
  );
};
