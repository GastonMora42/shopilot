import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Seat } from '../types';
import { Section } from '@/types/event';

interface SeatingPreviewProps {
  seats: Seat[];
  sections: Section[];
  width: number;
  height: number;
  onSeatClick?: (seatId: string) => void;
  onSectionClick?: (sectionId: string) => void;
  viewMode?: '2d' | '3d';
  showLabels?: boolean;
}

export const SeatingPreview: React.FC<SeatingPreviewProps> = ({
  seats,
  sections,
  width,
  height,
  onSeatClick,
  onSectionClick,
  viewMode = '2d',
  showLabels = true
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const { scale, transform, bounds } = useMemo(() => {
    if (seats.length === 0) return { scale: 1, transform: 'translate(0, 0)', bounds: null };

    const bounds = seats.reduce(
      (acc, seat) => ({
        minX: Math.min(acc.minX, seat.position.x),
        maxX: Math.max(acc.maxX, seat.position.x),
        minY: Math.min(acc.minY, seat.position.y),
        maxY: Math.max(acc.maxY, seat.position.y)
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );

    const contentWidth = bounds.maxX - bounds.minX + 40;
    const contentHeight = bounds.maxY - bounds.minY + 40;
    const baseScale = Math.min(width / contentWidth, height / contentHeight, 1);
    const finalScale = baseScale * zoom;

    return {
      scale: finalScale,
      transform: `translate(${-bounds.minX * finalScale + pan.x}px, ${-bounds.minY * finalScale + pan.y}px)`,
      bounds
    };
  }, [seats, width, height, zoom, pan]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      setZoom(prev => Math.max(0.5, Math.min(2, prev - e.deltaY * 0.001)));
    } else {
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  function onViewModeChange(arg0: string): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between p-2 bg-white border-b">
        <div className="space-x-2">
          <button
            onClick={() => setZoom(1)}
            className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
          >
            Reset Zoom
          </button>
          <select 
            value={viewMode}
            onChange={(e) => onViewModeChange?.(e.target.value as '2d' | '3d')}
            className="px-2 py-1 text-sm bg-gray-100 rounded"
          >
            <option value="2d">2D</option>
            <option value="3d">3D</option>
          </select>
        </div>
        <div className="flex items-center space-x-4">
          {sections.map(section => (
            <div 
              key={section.id}
              className="flex items-center space-x-2"
              onClick={() => onSectionClick?.(section.id)}
            >
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: section.color }}
              />
              <span className="text-sm">{section.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="relative flex-1 overflow-hidden bg-gray-50 rounded-lg"
        onWheel={handleWheel}
      >
        <motion.div
          className="absolute"
          style={{
            transform,
            scale: scale
          }}
        >
          {seats.map((seat) => {
            const section = sections.find(s => s.id === seat.sectionId);
            return (
              <motion.div
                key={seat.id}
                initial={false}
                whileHover={{ scale: 1.1 }}
                onClick={() => onSeatClick?.(seat.id)}
                className="absolute flex items-center justify-center w-6 h-6 rounded cursor-pointer"
                style={{
                  backgroundColor: section?.color || '#gray-300',
                  opacity: seat.status === 'DISABLED' ? 0.5 : 1,
                  x: seat.position.x - 12,
                  y: seat.position.y - 12,
                  transform: viewMode === '3d' ? 'perspective(500px) rotateX(30deg)' : undefined
                }}
              >
                {showLabels && (
                  <span className="text-xs font-medium text-white">
                    {seat.label}
                  </span>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};