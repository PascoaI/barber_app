'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

type ConfirmSaveModalProps = {
  isOpen: boolean;
  title?: string;
  message?: string;
  onGoHome: () => void;
  onStay: () => void;
  onClose: () => void;
};

export default function ConfirmSaveModal({
  isOpen,
  title = 'Alterações salvas!',
  message = 'Suas alterações foram salvas com sucesso.',
  onGoHome,
  onStay,
  onClose
}: ConfirmSaveModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="booking-card w-full max-w-md rounded-2xl border border-borderc bg-surface shadow-soft p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="button button-secondary mb-3 w-full"
          onClick={onClose}
          aria-label="Fechar modal"
        >
          Fechar
        </button>
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-text-secondary mb-5">{message}</p>
        <div className="form-row">
          <button type="button" className="button button-primary" onClick={onGoHome}>
            Ir para Home
          </button>
          <button type="button" className="button button-secondary" onClick={onStay}>
            Continuar nesta página
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
