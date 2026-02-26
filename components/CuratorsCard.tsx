import React from 'react';
import { Entity } from '../types';

interface CuratorsCardProps {
  entity: Entity;
  echoImageUrl: string;
  secretFact?: string;
  nativeRangeMapUrl?: string;
}

/**
 * A component that displays a beautiful, shareable "Curator's Card" for an organism.
 * Designed to evoke a high-end natural history exhibit placard or collector's item.
 */
export const CuratorsCard: React.FC<CuratorsCardProps> = ({
  entity, echoImageUrl, secretFact, nativeRangeMapUrl
}) => {
  const accentColor = '#4CAF50'; // A subtle green accent, like healthy growth

  return (
    <div className="relative w-[375px] h-[667px] bg-gradient-to-br from-gray-900 to-gray-800 text-white font-sans overflow-hidden shadow-2xl rounded-xl border border-gray-700">
      
      {/* Background flourishes */}
      <div className="absolute inset-0 opacity-10">
        <img src="/assets/leaf-pattern.png" alt="background pattern" className="w-full h-full object-cover" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 p-6 flex flex-col h-full">
        
        {/* Header - Name & Scientific Name */}
        <div className="text-center mb-6">
          <h2 className="text-4xl font-serif font-bold text-emerald-300 drop-shadow-md">{entity.name}</h2>
          <p className="text-base italic text-gray-400 mt-1">{entity.scientificName}</p>
        </div>

        {/* Echo Image */}
        <div className="flex-grow flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-emerald-900 opacity-20"></div>
          <img 
            src={echoImageUrl}
            alt={`Stylized echo of ${entity.name}`}
            className="max-w-[80%] max-h-[80%] object-contain filter drop-shadow-xl"
            style={{ transition: 'transform 0.3s ease-out' }}
          />
        </div>

        {/* Fact/Description */}
        {secretFact && (
          <div className="bg-gray-700/30 p-4 rounded-lg mb-4 border border-gray-600/50">
            <p className="text-sm italic text-gray-200 text-center leading-relaxed">"{secretFact}"</p>
          </div>
        )}

        {/* Native Range Map */}
        {nativeRangeMapUrl && (
          <div className="mb-4">
            <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-2 border-b border-gray-700 pb-1 text-center">Native Range</h3>
            <img src={nativeRangeMapUrl} alt="Native range map" className="w-full h-24 object-cover rounded-md border border-gray-700" />
          </div>
        )}

        {/* Footer */}
        <div className="flex-shrink-0 text-center mt-auto text-xs text-gray-500 pt-4 border-t border-gray-700">
          <p>From the Digital Conservatory of a Distinguished Curator.</p>
        </div>
      </div>
    </div>
  );
};
