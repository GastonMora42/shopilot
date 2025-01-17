// components/admin/EventForm/steps/SeatingMap/templates/layouts.ts
import { LayoutTemplate } from '@/types/editor';

export const seatingTemplates: LayoutTemplate[] = [
  {
      id: 'theater-standard',
      name: 'Teatro Estándar',
      description: 'Disposición clásica con sección VIP al frente',
      thumbnail: '/templates/theater-standard.png',
      sections: [
          {
              id: 'vip',
              name: 'VIP',
              type: 'VIP',
              color: '#EF4444',
              price: 2000,
              rowStart: 1,
              rowEnd: 5,
              columnStart: 1,
              columnEnd: 15
          },
          {
              id: 'regular',
              name: 'Regular',
              type: 'REGULAR',
              color: '#3B82F6',
              price: 1000,
              rowStart: 6,
              rowEnd: 15,
              columnStart: 1,
              columnEnd: 15
          }
      ],
      generateLayout: (params) => ({
          rows: 15,
          columns: 15,
          seats: [],
          sections: []
      }),
      
      seats: undefined
  },
  {
      id: 'theater-curved',
      name: 'Teatro Curvo',
      description: 'Disposición en arco para mejor visibilidad',
      thumbnail: '/templates/theater-curved.png',
      sections: [
          {
              id: 'vip',
              name: 'VIP',
              type: 'VIP',
              color: '#EF4444',
              price: 2000,
              rowStart: 1,
              rowEnd: 4,
              columnStart: 2,
              columnEnd: 14
          },
          {
              id: 'regular',
              name: 'Regular',
              type: 'REGULAR',
              color: '#3B82F6',
              price: 1000,
              rowStart: 5,
              rowEnd: 12,
              columnStart: 1,
              columnEnd: 15
          }
      ],
      generateLayout: (params) => ({
          rows: 12,
          columns: 15,
          seats: [],
          sections: []
      }),
      seats: undefined
  },
  {
      id: 'stadium',
      name: 'Estadio',
      description: 'Layout tipo estadio con secciones laterales',
      thumbnail: '/templates/stadium.png',
      sections: [
          {
              id: 'vip-center',
              name: 'VIP Central',
              type: 'VIP',
              color: '#EF4444',
              price: 2500,
              rowStart: 1,
              rowEnd: 10,
              columnStart: 5,
              columnEnd: 15
          },
          {
              id: 'regular-left',
              name: 'Regular Izquierda',
              type: 'REGULAR',
              color: '#3B82F6',
              price: 1000,
              rowStart: 1,
              rowEnd: 10,
              columnStart: 1,
              columnEnd: 4
          },
          {
              id: 'regular-right',
              name: 'Regular Derecha',
              type: 'REGULAR',
              color: '#3B82F6',
              price: 1000,
              rowStart: 1,
              rowEnd: 10,
              columnStart: 16,
              columnEnd: 20
          }
      ],
      generateLayout: (params) => ({
          rows: 10,
          columns: 20,
          seats: [],
          sections: []
      }),
      seats: undefined
  },
  {
      id: 'conference',
      name: 'Conferencia',
      description: 'Disposición tipo auditorio con pasillo central',
      thumbnail: '/templates/conference.png',
      sections: [
          {
              id: 'premium',
              name: 'Premium',
              type: 'VIP',
              color: '#EF4444',
              price: 2000,
              rowStart: 1,
              rowEnd: 5,
              columnStart: 1,
              columnEnd: 12
          }
      ],
      generateLayout: (params) => ({
          rows: 5,
          columns: 12,
          seats: [],
          sections: []
      }),
      seats: undefined
  }
];