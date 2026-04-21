'use client';
import { create } from 'zustand';
import { uploadApi } from '@/lib/api';
import type { Media, SessionGallery, UploadProgress } from '@/types';

interface MediaState {
  gallery: SessionGallery | null;
  selectedMediaIds: string[];
  uploadQueue: UploadProgress[];
  isLoadingGallery: boolean;
  error: string | null;

  loadGallery: () => Promise<void>;
  addToGallery: (media: Media) => void;
  updateMediaInGallery: (media: Media) => void;
  toggleMediaSelection: (id: string) => void;
  clearSelection: () => void;
  setSelectedMedia: (ids: string[]) => void;
  deleteMedia: (id: string) => Promise<void>;
  setUploadProgress: (filename: string, progress: Partial<UploadProgress>) => void;
  clearUploadQueue: () => void;
  setError: (error: string | null) => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  gallery: null,
  selectedMediaIds: [],
  uploadQueue: [],
  isLoadingGallery: false,
  error: null,

  loadGallery: async () => {
    set({ isLoadingGallery: true });
    try {
      const res = await uploadApi.getGallery();
      set({ gallery: res.data.data, isLoadingGallery: false });
    } catch (err: unknown) {
      const e = err as { displayMessage?: string };
      set({ error: e.displayMessage || 'Failed to load gallery', isLoadingGallery: false });
    }
  },

  addToGallery: (media) => {
    set((state) => {
      if (!state.gallery) {
        const empty: SessionGallery = { images: [], videos: [], audio: [], documents: [], total: 0 };
        const updated = { ...empty };
        const key = media.type === 'image' ? 'images' : media.type === 'video' ? 'videos' : media.type === 'audio' ? 'audio' : 'documents';
        updated[key] = [media, ...updated[key]];
        updated.total = 1;
        return { gallery: updated };
      }
      const g = { ...state.gallery };
      const key = media.type === 'image' ? 'images' : media.type === 'video' ? 'videos' : media.type === 'audio' ? 'audio' : 'documents';
      g[key] = [media, ...g[key]];
      g.total = g.total + 1;
      return { gallery: g };
    });
  },

  updateMediaInGallery: (media) => {
    set((state) => {
      if (!state.gallery) return state;

      const updateList = (list: Media[]) =>
        list.map((item) => (item.id === media.id ? { ...item, ...media } : item));

      return {
        gallery: {
          ...state.gallery,
          images: updateList(state.gallery.images),
          videos: updateList(state.gallery.videos),
          audio: updateList(state.gallery.audio),
          documents: updateList(state.gallery.documents),
        },
      };
    });
  },

  toggleMediaSelection: (id) => {
    const normalizedId = String(id);
    set((state) => {
      const normalizedSelection = state.selectedMediaIds.map((item) => String(item));
      const isSelected = normalizedSelection.includes(normalizedId);

      return {
        selectedMediaIds: isSelected
          ? normalizedSelection.filter((item) => item !== normalizedId)
          : [...new Set([...normalizedSelection, normalizedId])],
      };
    });
  },

  clearSelection: () => set({ selectedMediaIds: [] }),

  setSelectedMedia: (ids) => set({ selectedMediaIds: [...new Set(ids.map((id) => String(id)))] }),

  deleteMedia: async (id) => {
    await uploadApi.deleteMedia(id);
    set((state) => {
      if (!state.gallery) return state;
      const g = { ...state.gallery };
      g.images = g.images.filter((m) => m.id !== id);
      g.videos = g.videos.filter((m) => m.id !== id);
      g.audio = g.audio.filter((m) => m.id !== id);
      g.documents = g.documents.filter((m) => m.id !== id);
      g.total = Math.max(0, g.total - 1);
      return { gallery: g, selectedMediaIds: state.selectedMediaIds.filter((i) => i !== id) };
    });
  },

  setUploadProgress: (filename, progress) => {
    set((state) => ({
      uploadQueue: state.uploadQueue.map((u) =>
        u.file.name === filename ? { ...u, ...progress } : u
      ),
    }));
  },

  clearUploadQueue: () => set({ uploadQueue: [] }),

  setError: (error) => set({ error }),
}));