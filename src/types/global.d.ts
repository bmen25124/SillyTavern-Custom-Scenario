import { FullExportData } from './types/types.js';

declare global {
  interface SillyTavernContext {
    characters: FullExportData[];
    createCharacterData: { extensions: Record<string, any> };
    convertCharacterBook: (characterBook: any) => {
      entries: {};
      originalData: any;
    };
    updateWorldInfoList: () => Promise<void>;
    loadWorldInfo: (name: string) => Promise<any | null>;
    saveWorldInfo: (name: string, data: any, immediately?: boolean) => Promise<void>;
    humanizedDateTime: () => string;
    getCharacters: () => Promise<void>;
    uuidv4: () => string;
    getRequestHeaders: () => {
      'Content-Type': string;
      'X-CSRF-Token': any;
    };
  }

  const SillyTavern: {
    getContext(): SillyTavernContext;
    // Add other methods as needed
  };
}

export {};
