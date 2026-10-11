import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X, ExternalLink } from 'lucide-react';
import { formatTxHash } from '../utils/crypto';
import { Badge } from './ui/badge';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  txHash?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  onViewTx?: (txHash: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss, onViewTx }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-sm p-4 border shadow-2xl backdrop-blur-md transition-all duration-150 ${
            toast.type === 'success'
              ? 'bg-zinc-950 border-emerald-500/50 text-zinc-100 shadow-emerald-950/20'
              : toast.type === 'warning'
              ? 'bg-zinc-950 border-amber-500/50 text-zinc-100 shadow-amber-950/20'
              : toast.type === 'error'
              ? 'bg-zinc-950 border-rose-500/60 text-zinc-100 shadow-rose-950/20'
              : 'bg-zinc-950 border-zinc-700 text-zinc-100 shadow-black/50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              {toast.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-400" />}
              {toast.type === 'error' && <AlertTriangle className="h-4 w-4 text-rose-400" />}
              {toast.type === 'info' && <Info className="h-4 w-4 text-zinc-300" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white font-sans">{toast.title}</div>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed font-sans">{toast.message}</p>

              {toast.txHash && (
                <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-500">TX: {formatTxHash(toast.txHash)}</span>
                  {onViewTx && (
                    <button
                      onClick={() => onViewTx(toast.txHash!)}
                      className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <span>VIEW LEDGER</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-zinc-500 hover:text-zinc-300 p-0.5 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
