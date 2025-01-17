// components/admin/EventForm/steps/SeatingMap/templates/index.ts
import { EditorSeat, EditorSection, LayoutConfig } from '@/types/editor';
import { GRID_SIZE } from '../constants';

interface TemplateConfig {
  id: string;
  rowRange: [number, number];
  seatsPerRow: number;
  aislePositions?: number[];
}

export const generateSeats = (
  sectionConfig: TemplateConfig
): EditorSeat[] => {
  const seats: EditorSeat[] = [];
  const [startRow, endRow] = sectionConfig.rowRange;

  for (let row = startRow; row <= endRow; row++) {
    for (let col = 1; col <= sectionConfig.seatsPerRow; col++) {
      if (sectionConfig.aislePositions?.includes(col)) continue;

      seats.push({
        id: `seat-${row}-${col}`,
        row,
        column: col,
        sectionId: sectionConfig.id,
        status: 'ACTIVE',
        label: `${String.fromCharCode(65 + row - 1)}${col}`,
        position: {
          x: col * GRID_SIZE,
          y: row * GRID_SIZE
        },
        screenPosition: {
          x: col * GRID_SIZE,
          y: row * GRID_SIZE
        }
      });
    }
  }

  return seats;
};

export const templates = [
  {
    id: 'theater-style',
    name: 'Teatro Tradicional',
    description: 'Disposición clásica con secciones VIP frontales',
    thumbnail: '/templates/theater.svg',
    sections: [
      {
        id: 'regular',
        name: 'Regular',
        type: 'REGULAR' as const,
        price: 1000,
        rowStart: 1,
        rowEnd: 14,
        columnStart: 1,
        columnEnd: 12,
        color: '#3B82F6',
        aislePositions: [6, 7]
      },
      {
        id: 'vip',
        name: 'VIP',
        type: 'VIP' as const,
        price: 2000,
        rowStart: 15,
        rowEnd: 18,
        columnStart: 1,
        columnEnd: 12,
        color: '#EF4444',
        aislePositions: [6, 7]
      }
    ],
    generateLayout: (params: { totalRows: number; seatsPerRow: number }) => {
      const seats = generateSeats({
        id: 'regular',
        rowRange: [1, params.totalRows],
        seatsPerRow: params.seatsPerRow,
        aislePositions: [Math.floor(params.seatsPerRow / 2)]
      });
      return { seats, sections: templates[0].sections };
    }
  }
];