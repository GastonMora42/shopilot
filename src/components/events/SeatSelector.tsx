// components/SeatSelector.tsx
'use client';

interface SeatSelectorProps {
  seatingChart: {
    rows: number;
    columns: number;
    sections: Array<{
      name: string;
      type: string;
      price: number;
      rowStart: number;
      rowEnd: number;
      columnStart: number;
      columnEnd: number;
    }>;
  };
  selectedSeats: string[];
  onSelect: (seats: string[]) => void;
}

export function SeatSelector({ 
  seatingChart, 
  selectedSeats, 
  onSelect 
}: SeatSelectorProps) {
  const handleSeatClick = (row: number, col: number) => {
    const section = seatingChart.sections.find(
      s => 
        row >= s.rowStart &&
        row <= s.rowEnd &&
        col >= s.columnStart &&
        col <= s.columnEnd
    );

    if (!section) return;

    const seatId = `${section.name}-${row}-${col}`;
    
    if (selectedSeats.includes(seatId)) {
      onSelect(selectedSeats.filter(s => s !== seatId));
    } else {
      onSelect([...selectedSeats, seatId]);
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        {Array.from({ length: seatingChart.rows }).map((_, row) => (
          <div key={row} className="flex gap-1 my-1">
            <span className="w-6 text-center">
              {String.fromCharCode(65 + row)}
            </span>
            {Array.from({ length: seatingChart.columns }).map((_, col) => {
              const section = seatingChart.sections.find(
                s => 
                  row >= s.rowStart &&
                  row <= s.rowEnd &&
                  col >= s.columnStart &&
                  col <= s.columnEnd
              );

              if (!section) return null;

              const seatId = `${section.name}-${row}-${col}`;
              const isSelected = selectedSeats.includes(seatId);

              return (
                <button
                  key={`${row}-${col}`}
                  className={`
                    w-8 h-8 rounded-sm transition-colors
                    ${isSelected ? 'bg-primary text-white' : 
                      section.type === 'VIP' ? 'bg-purple-200 hover:bg-purple-300' :
                      section.type === 'DISABLED' ? 'bg-gray-200 cursor-not-allowed' :
                      'bg-green-200 hover:bg-green-300'}
                  `}
                  onClick={() => handleSeatClick(row, col)}
                  disabled={section.type === 'DISABLED'}
                  title={`${section.name} - $${section.price}`}
                >
                  {col + 1}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}