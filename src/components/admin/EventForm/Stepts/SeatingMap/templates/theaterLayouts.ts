// templates/theaterLayouts.ts
export const theaterLayouts = {
    standard: {
      id: 'theater-standard',
      name: 'Teatro Estándar',
      sections: [
        {
          vip: { rows: 5, startFrom: 'front' },
          regular: { rows: 15, startFrom: 'back' }
        }
      ],
      aisles: { center: true, sides: true },
      rowSpacing: { vip: 1.2, regular: 1 }
    },
    curved: {
      id: 'theater-curved',
      name: 'Teatro Curvo',
      sections: [
        {
          vip: { rows: 5, curve: 0.2 },
          regular: { rows: 15, curve: 0.3 }
        }
      ]
    }
  }