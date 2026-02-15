import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface ToastAction {
  label: string;
  onClick: () => void | Promise<void>;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // milliseconds, 0 = persistent
  action?: ToastAction; // Optional action button
}

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastComponent: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss (unless loading or duration is 0)
    if (toast.type !== 'loading' && toast.duration !== 0) {
      const duration = toast.duration || 5000;
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(toast.id), 300); // Wait for fade out
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-cyan-400" />,
    loading: <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
  };

  const colors = {
    success: 'bg-emerald-500/10 border-emerald-500/30',
    error: 'bg-red-500/10 border-red-500/30',
    info: 'bg-cyan-500/10 border-cyan-500/30',
    loading: 'bg-amber-500/10 border-amber-500/30'
  };

  return (
    <div
      className={`
        ${colors[toast.type]}
        border rounded-xl p-4 shadow-lg backdrop-blur-md
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {icons[toast.type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium">{toast.message}</p>
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.onClick();
                setIsVisible(false);
                setTimeout(() => onDismiss(toast.id), 300);
              }}
              className="mt-2 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition-colors font-bold"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        {toast.type !== 'loading' && (
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onDismiss(toast.id), 300);
            }}
            className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm" style={{ zIndex: 100 }}>
      {toasts.map(toast => (
        <ToastComponent key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

// Toast manager hook
let toastIdCounter = 0;
const toastListeners = new Set<(toasts: Toast[]) => void>();
let currentToasts: Toast[] = [];

export const toastManager = {
  show(message: string, type: ToastType = 'info', duration?: number, options?: { action?: ToastAction }): string {
    const id = `toast-${++toastIdCounter}`;
    const toast: Toast = { id, message, type, duration, action: options?.action };
    currentToasts = [...currentToasts, toast];
    toastListeners.forEach(listener => listener([...currentToasts]));
    return id;
  },

  success(message: string, duration?: number, options?: { action?: ToastAction }): string {
    return this.show(message, 'success', duration, options);
  },

  error(message: string, duration?: number, options?: { action?: ToastAction }): string {
    return this.show(message, 'error', duration || 7000, options); // Errors stay longer
  },

  info(message: string, duration?: number): string {
    return this.show(message, 'info', duration);
  },

  loading(message: string): string {
    return this.show(message, 'loading', 0); // Persistent until dismissed
  },

  dismiss(id: string): void {
    currentToasts = currentToasts.filter(t => t.id !== id);
    toastListeners.forEach(listener => listener([...currentToasts]));
  },

  update(id: string, updates: Partial<Toast>): void {
    currentToasts = currentToasts.map(t => 
      t.id === id ? { ...t, ...updates } : t
    );
    toastListeners.forEach(listener => listener([...currentToasts]));
  },

  subscribe(listener: (toasts: Toast[]) => void): () => void {
    toastListeners.add(listener);
    listener([...currentToasts]); // Initial call
    return () => toastListeners.delete(listener);
  }
};
