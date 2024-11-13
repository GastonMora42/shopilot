// components/events/ReviewStep.tsx

// Interfaz que define la estructura de los datos de la revisión.
interface ReviewData {
  name: string;
  date: string; // Suponiendo que 'date' es una cadena (ISO string o similar).
  location: string;
  description: string;
  seatingChart: {
    rows: number;
    columns: number;
    sections: Array<{
      name: string;
      type: 'REGULAR' | 'VIP' | 'DISABLED';
      price: number;
      rowStart: number;
      rowEnd: number;
      columnStart: number;
      columnEnd: number;
    }>;
  };
  orderTotal: number; // Total del pedido, si es relevante.
}

interface ReviewStepProps {
  data: ReviewData;
  onSubmit: () => void;
}
  
export function ReviewStep({ data, onSubmit }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-2">Información Básica</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p><strong>Nombre:</strong> {data.name}</p>
          <p><strong>Fecha:</strong> {new Date(data.date).toLocaleString()}</p>
          <p><strong>Ubicación:</strong> {data.location}</p>
          <p><strong>Descripción:</strong> {data.description}</p>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2">Configuración de Asientos</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p><strong>Filas:</strong> {data.seatingChart.rows}</p>
          <p><strong>Columnas:</strong> {data.seatingChart.columns}</p>
          <p><strong>Capacidad Total:</strong> {
            data.seatingChart.rows * data.seatingChart.columns
          } asientos</p>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2">Secciones</h3>
        <div className="bg-gray-50 p-4 rounded space-y-4">
          {data.seatingChart.sections.map((section, index) => (
            <div key={index}>
              <p><strong>{section.name}</strong></p>
              <p>Tipo: {section.type}</p>
              <p>Precio: ${section.price}</p>
              <p>Filas: {section.rowStart + 1} - {section.rowEnd + 1}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
