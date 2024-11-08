// components/DebugPanel.tsx
'use client';

const DebugPanel = ({ eventId }: { eventId: string }) => {
  const updateSeatStatus = async (seatId: string, status: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/seats/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatId, status })
      });
      const data = await response.json();
      console.log('Seat update result:', data);
      window.location.reload(); // Recargar para ver cambios
    } catch (error) {
      console.error('Error updating seat:', error);
    }
  };

  return process.env.NODE_ENV === 'development' ? (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
      <h3 className="font-bold mb-2">Debug Controls</h3>
      <div className="space-y-2">
        <div>
          <input 
            type="text" 
            id="seatId" 
            placeholder="Seat ID (e.g. A4)"
            className="border p-1 mr-2"
          />
          <select id="status" className="border p-1 mr-2">
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="OCCUPIED">OCCUPIED</option>
            <option value="RESERVED">RESERVED</option>
          </select>
          <button
            onClick={() => {
              const seatId = (document.getElementById('seatId') as HTMLInputElement).value;
              const status = (document.getElementById('status') as HTMLSelectElement).value;
              updateSeatStatus(seatId, status);
            }}
            className="bg-blue-500 text-white px-2 py-1 rounded"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  ) : null;
};

export default DebugPanel;