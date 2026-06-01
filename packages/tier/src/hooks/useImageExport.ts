import { useCallback, useRef } from 'react';
import { toPng } from 'html-to-image';

export function useImageExport() {
  const ref = useRef<HTMLDivElement>(null);

  const exportImage = useCallback(async () => {
    if (!ref.current) return;
    const dataUrl = await toPng(ref.current, {
      backgroundColor: '#ffffff',
      pixelRatio: 2,
      cacheBust: true,
      filter: (node) => {
        if (node instanceof HTMLElement && node.dataset.exportExclude) {
          return false;
        }
        return true;
      },
    });
    const link = document.createElement('a');
    link.download = 'tier-list.png';
    link.href = dataUrl;
    link.click();
  }, []);

  return { ref, exportImage };
}
