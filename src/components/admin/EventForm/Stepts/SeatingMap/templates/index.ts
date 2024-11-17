import { Section } from "../../SeatedTickets/types";
import { Seat } from "../types";

// components/admin/EventForm/steps/SeatingMap/templates/index.ts
export interface LayoutTemplate {
    id: string;
    name: string;
    description: string;
    thumbnail: string; // URL o componente SVG
    generateLayout: (params: TemplateParams) => LayoutConfig;
  }
  
  interface TemplateParams {
    totalRows: number;
    seatsPerRow: number;
    aislePositions?: number[];
    sectionConfigs: {
      id: string;
      name: string;
      type: 'REGULAR' | 'VIP' | 'DISABLED';
      color: string;
      price: number;
      rowRange: [number, number];
    }[];
  }
  
  interface LayoutConfig {
    seats: Seat[];
    sections: Section[];
  }
  
  export const PREDEFINED_TEMPLATES: LayoutTemplate[] = [
    {
      id: 'theater-style',
      name: 'Teatro Tradicional',
      description: 'Disposición clásica con secciones VIP frontales',
      thumbnail: '/templates/theater.svg',
      generateLayout: ({ totalRows, seatsPerRow, sectionConfigs }) => {
        const seats: Seat[] = [];
        const sections = sectionConfigs.map(config => ({
          id: config.id,
          name: config.name,
          type: config.type,
          color: config.color,
          price: config.price
        }));
  
        // Generate seats with proper spacing and sections
        for (let row = 0; row < totalRows; row++) {
          for (let col = 0; col < seatsPerRow; col++) {
            const section = sectionConfigs.find(
              config => row >= config.rowRange[0] && row <= config.rowRange[1]
            );
  
            if (section) {
              seats.push({
                id: `seat-${row}-${col}`,
                row,
                column: col,
                position: {
                  x: col * 30 + (col >= seatsPerRow / 2 ? 60 : 0), // Add aisle space
                  y: row * 30
                },
                sectionId: section.id,
                label: `${String.fromCharCode(65 + row)}${col + 1}`,
                status: 'ACTIVE'
              });
            }
          }
        }
  
        return { seats, sections };
      }
    },
    // Más templates...
  ];
  
 