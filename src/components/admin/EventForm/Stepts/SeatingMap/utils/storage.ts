// components/admin/EventForm/steps/SeatingMap/utils/storage.ts
import { LayoutConfig } from '../types/layout';

export interface SavedLayout extends LayoutConfig {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    eventName?: string;
    venue?: string;
    totalSeats?: number;
  };
}

export const StorageService = {
  saveLayout: async (layout: LayoutConfig, name: string): Promise<SavedLayout> => {
    const savedLayout: SavedLayout = {
      ...layout,
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        totalSeats: layout.seats.length
      }
    };

    try {
      // Guardar en localStorage por ahora, luego se puede cambiar a API
      const savedLayouts = await StorageService.getLayouts();
      savedLayouts.push(savedLayout);
      localStorage.setItem('savedLayouts', JSON.stringify(savedLayouts));
      
      return savedLayout;
    } catch (error) {
      console.error('Error saving layout:', error);
      throw new Error('No se pudo guardar el layout');
    }
  },

  getLayouts: async (): Promise<SavedLayout[]> => {
    try {
      const layouts = localStorage.getItem('savedLayouts');
      return layouts ? JSON.parse(layouts) : [];
    } catch (error) {
      console.error('Error getting layouts:', error);
      return [];
    }
  },

  getLayoutById: async (id: string): Promise<SavedLayout | null> => {
    try {
      const layouts = await StorageService.getLayouts();
      return layouts.find(layout => layout.id === id) || null;
    } catch (error) {
      console.error('Error getting layout:', error);
      return null;
    }
  }
};

