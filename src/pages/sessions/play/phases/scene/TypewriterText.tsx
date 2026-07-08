import { useEffect, useState } from 'react';

type Props = {
  text: string;
  speedMs?: number;
};

/**
 * Efeito de digitação gradual simulado no client a partir de um texto já
 * completo — não existe (ainda) uma API de streaming real de narração no
 * backend, então isso não é "true streaming", apenas uma animação local.
 */
export function TypewriterText({ text, speedMs = 18 }: Props) {
  const [shown, setShown] = useState('');

  useEffect(() => {
    setShown('');
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speedMs);
    return () => clearInterval(interval);
  }, [text, speedMs]);

  return <>{shown}</>;
}
