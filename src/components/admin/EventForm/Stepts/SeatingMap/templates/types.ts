import { SectionType } from "@/types/event";

// templates/types.ts
export interface LayoutTemplate {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    defaultConfig: {
      rows: number;
      columns: number;
      aisles: number[];
      sections: Array<{
        name: string;
        type: SectionType;
        rows: [number, number];
        columns: [number, number];
        price: number;
        color: string;
      }>;
    };
  }