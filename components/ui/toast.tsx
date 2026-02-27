'use client';
import * as React from 'react';

type Toast = { id: number; message: string };
const ToastCtx = React.createContext<{ push: (msg: string) => void } | null>(null);

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const push = (message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  };

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed right-4 bottom-4 z-[70] grid gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="rounded-xl border border-borderc bg-surface px-3 py-2 text-sm shadow-soft">{t.message}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastCtx);
  return { toast: (msg: string) => ctx?.push(msg) };
}
