// components/admin/EventForm/steps/SeatingMap/components/SeatingPreview.tsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Seat } from '../types';
import { Section } from '../../SeatedTickets/types';

interface SeatingPreviewProps {
  seats: Seat[];
  sections: Section[];
  width: number;
  height: number;
}

export const SeatingPreview: React.FC<SeatingPreviewProps> = ({
  seats,
  sections,
  width,
  height
}) => {
  const { scale, transform } = useMemo(() => {
    if (seats.length === 0) return { scale: 1, transform: 'translate(0, 0)' };

    // Calculate bounds
    const bounds = seats.reduce(
      (acc, seat) => ({
        minX: Math.min(acc.minX, seat.position.x),
        maxX: Math.max(acc.maxX, seat.position.x),
        minY: Math.min(acc.minY, seat.position.y),
        maxY: Math.max(acc.maxY, seat.position.y)
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );

    // Calculate scale and translation
    const contentWidth = bounds.maxX - bounds.minX + 40;
    const contentHeight = bounds.maxY - bounds.minY + 40;
    const scale = Math.min(width / contentWidth, height / contentHeight, 1);

    return {
      scale,
      transform: `translate(${-bounds.minX * scale + 20}px, ${-bounds.minY * scale + 20}px)`
    };
  }, [seats, width, height]);

  return (
    <div
      className="relative overflow-hidden bg-gray-50 rounded-lg"
      style={{ width, height }}
    >
      <div
        className="absolute"
        style={{
          transform: transform,
          scale: scale
        }}
      >
        {seats.map((seat) => {
          const section = sections.find(s => s.id === seat.sectionId);
          return (
            <motion.div
              key={seat.id}
              initial={false}
              className="absolute w-4 h-4 rounded"
              style={{
                backgroundColor: section?.color || '#gray-300',
                opacity: seat.status === 'DISABLED' ? 0.5 : 1,
                x: seat.position.x - 8,
                y: seat.position.y - 8
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

