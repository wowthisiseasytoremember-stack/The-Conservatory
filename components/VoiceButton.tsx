
import React, { useState, useCallback, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { store } from '../services/store';

interface VoiceButtonProps {
  onResult?: (text: string) => void;
  onTranscription?: (text: string) => void; // Legacy support
  onActive?: () => void;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ onResult, onTranscription, onActive }) => {
  const handleResult = onResult || onTranscription || (() => {});
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setInterimText(interimTranscript);
      store.setLiveTranscript(interimTranscript || finalTranscript);
      
      if (finalTranscript) {
        handleResult(finalTranscript.trim());
      }
    };

    recognition.onstart = () => {
      setIsRecording(true);
      onActive?.();
    };
    recognition.onend = () => {
      setIsRecording(false);
      setInterimText('');
      store.setLiveTranscript('');
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setInterimText('');
      store.setLiveTranscript('');
      
      // Show error toast with retry for retryable errors
      import('../components/Toast').then(({ toastManager }) => {
        const errorMessages: Record<string, string> = {
          'no-speech': 'No speech detected. Please try again.',
          'audio-capture': 'Microphone access denied. Please check permissions.',
          'not-allowed': 'Microphone permission denied.',
          'network': 'Network error. Please check your connection.',
          'aborted': 'Speech recognition aborted.',
        };
        
        const message = errorMessages[event.error] || `Voice recognition error: ${event.error}`;
        
        // Retryable errors: no-speech, network, aborted
        const retryableErrors = ['no-speech', 'network', 'aborted'];
        const canRetry = retryableErrors.includes(event.error);
        
        toastManager.error(
          message,
          6000,
          canRetry ? {
            action: {
              label: 'Retry',
              onClick: async () => {
                // Retry by restarting recognition
                startRecording();
              }
            }
          } : undefined
        );
      });
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [handleResult, onActive]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Using Pointer Events for true push-to-talk feel
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
      {interimText && (
        <div className="mb-4 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500/30 text-emerald-400 text-sm animate-pulse max-w-xs text-center truncate">
          {interimText}
        </div>
      )}
      <button
        onPointerDown={startRecording}
        onPointerUp={stopRecording}
        onPointerLeave={stopRecording}
        className={`
          w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform active:scale-90
          ${isRecording 
            ? 'bg-red-500 shadow-red-500/50 scale-110' 
            : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30'
          }
        `}
      >
        {isRecording ? (
          <MicOff className="w-8 h-8 text-white" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}
      </button>
      <p className="mt-3 text-xs uppercase tracking-widest text-emerald-500/70 font-bold">
        {isRecording ? "Listening..." : "Hold to Talk"}
      </p>
    </div>
  );
};
