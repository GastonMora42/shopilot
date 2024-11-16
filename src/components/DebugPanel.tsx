// components/DebugPanel.tsx
'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2 } from 'lucide-react';

interface SeatUpdate {
  row: number;
  column: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
}

const DebugPanel = ({ eventId }: { eventId: string }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'AVAILABLE' | 'OCCUPIED' | 'RESERVED'>('AVAILABLE');

  const convertDisplayIdToRowCol = (displayId: string): { row: number; column: number } | null => {
    // Formato esperado: "A4" -> { row: 1, column: 4 }
    const match = displayId.match(/^([A-Z])(\d+)$/);
    if (!match) return null;

    const row = match[1].charCodeAt(0) - 64; // A -> 1, B -> 2, etc.
    const column = parseInt(match[2]);
    return { row, column };
  };

  const updateSeatStatus = async (seatUpdate: SeatUpdate) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/seats/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatId: `${seatUpdate.row}-${seatUpdate.column}`,
          status: seatUpdate.status
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar asiento');
      }

      // Recargar solo si fue exitoso
      window.location.reload();
    } catch (error) {
      console.error('Error updating seat:', error);
      alert(error instanceof Error ? error.message : 'Error al actualizar asiento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = useCallback(() => {
    const displayId = `${selectedRow}${selectedColumn}`;
    const rowCol = convertDisplayIdToRowCol(displayId);

    if (!rowCol) {
      alert('Formato de asiento inválido. Use formato "A4"');
      return;
    }

    updateSeatStatus({
      row: rowCol.row,
      column: rowCol.column,
      status: selectedStatus
    });
  }, [selectedRow, selectedColumn, selectedStatus]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50 min-w-[300px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">Debug Controls</h3>
        {isLoading && <Loader2 className="animate-spin h-4 w-4" />}
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Fila (A-Z)"
            value={selectedRow}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              if (value === '' || /^[A-Z]$/.test(value)) {
                setSelectedRow(value);
              }
            }}
            maxLength={1}
            className="w-24"
          />
          <Input
            type="number"
            placeholder="Columna"
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            min={1}
            max={50}
            className="w-24"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as SeatUpdate['status'])}
          className="w-full border p-2 rounded"
        >
          <option value="AVAILABLE">Disponible</option>
          <option value="OCCUPIED">Ocupado</option>
          <option value="RESERVED">Reservado</option>
        </select>

        <Button
          onClick={handleSubmit}
          disabled={isLoading || !selectedRow || !selectedColumn}
          className="w-full"
        >
          {isLoading ? 'Actualizando...' : 'Actualizar Asiento'}
        </Button>

        <div className="text-xs text-gray-500 mt-2">
          Ejemplo: A4 = Fila A, Columna 4
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;