
import React, { useRef, useState } from 'react';
import { Camera, RefreshCw, Check, X, Layers } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { IdentifyResult, RackContainer } from '../types';
import { RackReviewModal } from './RackReviewModal';
import { store } from '../services/store';

interface PhotoIdentifyProps {
  onConfirmRack: (containers: RackContainer[]) => void;
  /** @deprecated Use store.createActionFromVision instead */
  onConfirmObservation?: (result: IdentifyResult) => void;
}

export const PhotoIdentify: React.FC<PhotoIdentifyProps> = ({ onConfirmRack }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'single' | 'rack'>('single');
  const [isLoading, setIsLoading] = useState(false);
  const [idResult, setIdResult] = useState<IdentifyResult | null>(null);
  const [rackResult, setRackResult] = useState<RackContainer[] | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async (newMode: 'single' | 'rack') => {
    setMode(newMode);
    setIsOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera error:", err);
      setIsOpen(false);
    }
  };

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsLoading(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    setCapturedImage(canvas.toDataURL('image/jpeg'));
    (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());

    try {
      if (mode === 'single') {
        const result = await geminiService.identifyPhoto(base64);
        setIdResult(result);
      } else {
        const result = await geminiService.analyzeRackScene(base64);
        setRackResult(result.containers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIdResult(null);
    setRackResult(null);
    setCapturedImage(null);
  };

  const handleConfirmVision = (result: IdentifyResult) => {
    // Direct store action — bypasses voice simulator entirely
    store.createActionFromVision(result);
    handleClose();
  };

  if (rackResult) {
    return (
      <RackReviewModal 
        containers={rackResult} 
        onConfirm={(final) => { onConfirmRack(final); handleClose(); }}
        onClose={handleClose}
      />
    );
  }

  if (!isOpen) {
    return (
      <div className="flex gap-2">
        <button onClick={() => startCamera('rack')} className="bg-slate-800/80 p-3 rounded-full border border-slate-700 hover:bg-slate-700 transition-colors">
          <Layers className="w-6 h-6 text-cyan-400" />
        </button>
        <button onClick={() => startCamera('single')} className="bg-slate-800/80 p-3 rounded-full border border-slate-700 hover:bg-slate-700 transition-colors">
          <Camera className="w-6 h-6 text-emerald-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-md aspect-[3/4] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800">
        {!capturedImage ? (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute top-6 left-6 right-6 text-center">
              <span className="bg-black/50 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold text-white uppercase tracking-widest border border-white/10">
                {mode === 'single' ? 'Species ID Mode' : 'Rack Scan Mode'}
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-8 flex justify-center gap-6 px-8">
               <button onClick={handleClose} className="w-14 h-14 bg-white/10 backdrop-blur rounded-full flex items-center justify-center">
                <X className="w-6 h-6 text-white" />
              </button>
              <button onClick={capture} className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl">
                <div className="w-16 h-16 rounded-full border-2 border-white/40" />
              </button>
            </div>
          </>
        ) : (
          <div className="relative w-full h-full">
            <img src={capturedImage} className="w-full h-full object-cover opacity-50" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              {isLoading ? (
                <div className="space-y-4">
                  <RefreshCw className="w-12 h-12 text-emerald-400 animate-spin mx-auto" />
                  <p className="text-emerald-400 font-serif text-xl italic">Analyzing {mode === 'single' ? 'Species' : 'Rack'}...</p>
                </div>
              ) : idResult ? (
                <div className="bg-black/60 backdrop-blur-xl p-6 rounded-2xl border border-emerald-500/30">
                  <h3 className="text-2xl font-serif text-white mt-1">{idResult.common_name}</h3>
                  <p className="text-sm text-emerald-300/60 italic mt-1">{idResult.species}</p>
                  <p className="text-xs text-slate-400 mt-2">{Math.round(idResult.confidence * 100)}% confidence</p>
                  <p className="mt-6 flex gap-3">
                    <button onClick={handleClose} className="flex-1 py-3 bg-slate-800 rounded-xl">Cancel</button>
                    <button onClick={() => handleConfirmVision(idResult)} className="flex-1 py-3 bg-emerald-500 rounded-xl font-bold">Accession</button>
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
