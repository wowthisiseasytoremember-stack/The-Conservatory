import React from 'react';
import { Share } from '@capacitor/share';
import { X, Share2 } from 'lucide-react';

interface ShareCuratorsCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  entityName: string;
}

export const ShareCuratorsCardModal: React.FC<ShareCuratorsCardModalProps> = ({
  isOpen, onClose, imageUrl, entityName
}) => {
  if (!isOpen) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        title: `My Digital Conservatory: ${entityName}`,
        text: `Check out my ${entityName} in The Conservatory!`, 
        url: imageUrl,
        dialogTitle: 'Share your Curator's Card',
      });
    } catch (error) {
      console.error("Error sharing card:", error);
      alert("Failed to share card. Make sure you're on a supported device.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 w-full max-w-md border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[95vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-black/20">
          <h2 className="text-xl font-serif font-bold text-white">Share Curator's Card</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 flex-grow overflow-y-auto flex flex-col items-center justify-center">
          <img src={imageUrl} alt={`Curator's Card for ${entityName}`} className="max-w-full h-auto rounded-lg border border-slate-700" />
          <p className="text-sm text-slate-400 mt-4 text-center">Your beautiful card is ready to share!</p>
        </div>
        <div className="p-4 border-t border-slate-800 bg-black/20 flex gap-3">
          <button 
            onClick={handleShare}
            className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors"
          >
            <Share2 className="w-5 h-5" /> Share
          </button>
          <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
