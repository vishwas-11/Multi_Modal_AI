'use client';
import { useEffect, useCallback } from 'react';

interface UseClipboardPasteOptions {
  onPaste: (imageData: string, mimeType: string) => void;
  enabled?: boolean;
}

export const useClipboardPaste = ({ onPaste, enabled = true }: UseClipboardPasteOptions) => {
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      if (!enabled) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (!blob) continue;

          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
              // Strip data:image/xxx;base64, prefix
              const base64 = result.split(',')[1];
              onPaste(base64, item.type);
            }
          };
          reader.readAsDataURL(blob);
          e.preventDefault();
          break;
        }
      }
    },
    [enabled, onPaste]
  );

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste, enabled]);
};