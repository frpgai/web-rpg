import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import './Tooltip.css';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

interface PopoverPos {
  top: number;
  left: number;
}

export function Tooltip({ text, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<PopoverPos>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.top - 8,              // 8px acima do trigger (viewport)
      left: rect.left + rect.width / 2, // centro do trigger (viewport)
    });
  }, []);

  function handleShow() {
    calcPos();
    setVisible(true);
  }

  function handleHide() {
    setVisible(false);
  }

  function handleToggle() {
    if (!visible) calcPos();
    setVisible((v) => !v);
  }

  // Fecha ao scroll/resize para não ficar deslocado
  useEffect(() => {
    if (!visible) return;
    const hide = () => setVisible(false);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [visible]);

  const popover = visible ? (
    <div
      className="tooltip-popover"
      style={{ top: pos.top, left: pos.left }}
    >
      <div className="tooltip-content">{text}</div>
    </div>
  ) : null;

  return (
    <div
      ref={triggerRef}
      className="tooltip-container"
      onMouseEnter={handleShow}
      onMouseLeave={handleHide}
      onClick={handleToggle}
    >
      <div className="tooltip-trigger-row">
        <span className="tooltip-underline">{children}</span>
        <span className="tooltip-icon">ⓘ</span>
      </div>
      {ReactDOM.createPortal(popover, document.body)}
    </div>
  );
}
