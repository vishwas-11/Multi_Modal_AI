'use client';
import { useCallback, useState } from 'react';
import { uploadApi } from '@/lib/api';
import { useMediaStore } from '@/store/useMediaStore';
import type { Media, UploadProgress } from '@/types';

export const useUpload = () => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const { addToGallery, setSelectedMedia, selectedMediaIds } = useMediaStore();

  const uploadFiles = useCallback(async (files: File[]): Promise<Media[]> => {
    const initial: UploadProgress[] = files.map((f) => ({
      file: f,
      progress: 0,
      speed: 0,
      eta: 0,
      status: 'uploading',
    }));
    setUploads(initial);

    try {
      const res = await uploadApi.uploadFiles(files, (progress, speed, eta) => {
        setUploads((prev) =>
          prev.map((u) => ({ ...u, progress, speed, eta, status: 'uploading' }))
        );
      });

      // Mark as processing
      setUploads((prev) => prev.map((u) => ({ ...u, progress: 100, status: 'processing' })));

      const result = res.data.data;
      const mediaList = Array.isArray(result) ? result : [result];

      // Add to gallery and mark done
      mediaList.forEach((m) => addToGallery(m));
      // Auto-select uploaded media for the next chat message.
      const uploadedIds = mediaList.map((m) => String(m.id));
      setSelectedMedia([...selectedMediaIds, ...uploadedIds]);
      setUploads((prev) =>
        prev.map((u, i) => ({ ...u, status: 'done', result: mediaList[i] }))
      );

      setTimeout(() => setUploads([]), 3000);
      return mediaList;
    } catch (err: unknown) {
      const e = err as { displayMessage?: string };
      setUploads((prev) =>
        prev.map((u) => ({ ...u, status: 'error', error: e.displayMessage || 'Upload failed' }))
      );
      throw err;
    }
  }, [addToGallery, selectedMediaIds, setSelectedMedia]);

  const uploadClipboard = useCallback(async (imageData: string): Promise<Media> => {
    try {
      const res = await uploadApi.uploadClipboard(imageData);
      addToGallery(res.data.data);
      setSelectedMedia([...selectedMediaIds, String(res.data.data.id)]);
      return res.data.data;
    } catch (err: unknown) {
      const e = err as { displayMessage?: string };
      throw new Error(e.displayMessage || 'Clipboard upload failed');
    }
  }, [addToGallery, selectedMediaIds, setSelectedMedia]);

  const clearUploads = useCallback(() => setUploads([]), []);

  return { uploads, uploadFiles, uploadClipboard, clearUploads };
};