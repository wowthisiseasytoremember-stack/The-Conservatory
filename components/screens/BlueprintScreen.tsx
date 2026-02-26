import React, { useState, useEffect } from 'react';
import { blueprintService, HabitatOutline } from '../services/BlueprintService';
import { useConservatory } from '../services/store';
import { AssignHabitatModal } from '../components/AssignHabitatModal';
import { BiomeTheme, Habitat, Entity, EntityType } from '../types';
import { motion } from 'framer-motion';

const MOCK_RACK_IMAGE_URL = "https://picsum.photos/seed/rack/800/600";

export const BlueprintScreen: React.FC = () => {
  const [outlines, setOutlines] = useState<HabitatOutline[]>([]);
  const [selectedOutline, setSelectedOutline] = useState<HabitatOutline | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedOutlineForAssignment, setSelectedOutlineForAssignment] = useState<HabitatOutline | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { habitats, addHabitat, updateHabitat, assignHabitatToBlueprint, getHabitatInhabitants } = useConservatory();

  useEffect(() => {
    // On mount, automatically scan a mock rack image.
    const scan = async () => {
      const mockBase64 = "base64-encoded-image-data";
      const result = await blueprintService.scanRack(mockBase64);
      setOutlines(result);
    };
    scan();
  }, []);

  const getBiomeColorClass = (theme: BiomeTheme) => {
    switch (theme) {
      case 'blackwater': return 'bg-amber-800/50';
      case 'tanganyika': return 'bg-blue-800/50';
      case 'paludarium': return 'bg-emerald-800/50';
      case 'marine': return 'bg-cyan-800/50';
      default: return 'bg-gray-700/50';
    }
  };

  const handleAssignHabitat = (habitatId: string) => {
    if (selectedOutlineForAssignment) {
      assignHabitatToBlueprint(habitatId, selectedOutlineForAssignment);
      setIsAssignModalOpen(false);
      setSelectedOutlineForAssignment(null);
    }
  };

  const handleOutlineClick = (outline: HabitatOutline) => {
    setSelectedOutlineForAssignment(outline);
    setIsAssignModalOpen(true);
  };

  return (
    <div 
      className="w-full h-full p-4 bg-gray-900 text-white"
      onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
      onTouchMove={(e) => setMousePosition({ x: e.touches[0].clientX, y: e.touches[0].clientY })}
    >
      <h2 className="text-2xl font-bold mb-4">The Blueprint of Worlds</h2>
      <div className="relative w-full max-w-4xl mx-auto border-2 border-dashed border-gray-600">
        <img src={MOCK_RACK_IMAGE_URL} alt="Rack of habitats" className="w-full h-auto" />

        {outlines.map((outline, index) => {
          const assignedHabitat = habitats.find(
            (h) =>
              h.blueprintCoords?.x === outline.x &&
              h.blueprintCoords?.y === outline.y &&
              h.blueprintCoords?.width === outline.width &&
              h.blueprintCoords?.height === outline.height
          );
          const isAssigned = !!assignedHabitat;

          return (
            <div
              key={index}
              className={`absolute transition-all duration-300 rounded-lg overflow-hidden
                ${isAssigned ? getBiomeColorClass(assignedHabitat!.biomeTheme) : 'border-2 border-dashed border-blue-400 cursor-pointer hover:bg-blue-400 hover:bg-opacity-20'}`}
              style={{
                left: `${outline.x}%`,
                top: `${outline.y}%`,
                width: `${outline.width}%`,
                height: `${outline.height}%`,
              }}
              onClick={() => !isAssigned && handleOutlineClick(outline)}
            >
              {isAssigned && (
                <div className="absolute inset-0 flex flex-wrap items-center justify-center p-1 opacity-80">
                  {getHabitatInhabitants(assignedHabitat!.id).map((inhabitant, i) => {
                    const parallaxX = (mousePosition.x / window.innerWidth - 0.5) * 10;
                    const parallaxY = (mousePosition.y / window.innerHeight - 0.5) * 10;
                    return (
                      <motion.img
                        key={inhabitant.id}
                        src={(inhabitant as any).currentEchoUrl || `https://picsum.photos/seed/${inhabitant.id}/64`}
                        alt={inhabitant.name}
                        className="w-8 h-8 object-contain pointer-events-none absolute"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1, 
                          x: `${(i * 20) % 80 + 5}%`,
                          y: `${Math.floor(i / 4) * 20 + 5}%`,
                          translateX: parallaxX,
                          translateY: parallaxY,
                          rotate: [0, (i % 2 === 0 ? 1 : -1) * 2, 0] // Subtle rotation
                        }}
                        transition={{
                          opacity: { duration: 0.5 },
                          scale: { duration: 0.5 },
                          translateX: { type: "spring", stiffness: 100, damping: 10 },
                          translateY: { type: "spring", stiffness: 100, damping: 10 },
                          rotate: { repeat: Infinity, duration: 5 + Math.random() * 5, ease: "easeInOut" }
                        }}
                      />
                    );
                  })}
                  <div className="absolute inset-0 flex items-center justify-center text-white text-lg font-bold p-2 text-shadow">
                    {assignedHabitat!.name}
                  </div>
                </div>
              )}
              {!isAssigned && (
                <div className="absolute -top-6 left-0 text-blue-400 text-xs">Unassigned {index + 1}</div>
              )}
            </div>
          );
        })}
      </div>

      <AssignHabitatModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        habitats={habitats}
        onAssign={handleAssignHabitat}
      />
    </div>
  );
};
