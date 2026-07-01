import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './BottomSheet.css';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Conteúdo extra exibido abaixo do título (ex: badges). */
  headerExtra?: React.ReactNode;
  /** Rodapé fixo (ex: botões de ação), renderizado fora da área de scroll. */
  footer?: React.ReactNode;
  /** Classe adicional aplicada ao painel, para permitir customizações pontuais. */
  panelClassName?: string;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  headerExtra,
  footer,
  panelClassName,
}: BottomSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="bottom-sheet-overlay"
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={`bottom-sheet-panel${panelClassName ? ` ${panelClassName}` : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="bottom-sheet-handle" />
        <div className="bottom-sheet-header">
          <div className="bottom-sheet-header-main">
            <h3 className="bottom-sheet-title">{title}</h3>
            {headerExtra}
          </div>
          <button className="bottom-sheet-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>
        <div className="bottom-sheet-content">
          {children}
        </div>
        {footer}
      </div>
    </div>,
    document.body,
  );
}
