// components/steps/BasicInfoStep.tsx
interface BasicInfoStepProps {
    data: {
      name: string;
      description: string;
      date: string;
      location: string;
    };
    onChange: (data: Partial<BasicInfoStepProps['data']>) => void;
  }
  
  export function BasicInfoStep({ data, onChange }: BasicInfoStepProps) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">
            Nombre del Evento
          </label>
          <input
            id="name"
            type="text"
            className="w-full p-2 border rounded"
            value={data.name}
            onChange={e => onChange({ name: e.target.value })}
            placeholder="Ej: Concierto en Vivo"
            required
          />
        </div>
  
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="description">
            Descripción
          </label>
          <textarea
            id="description"
            className="w-full p-2 border rounded"
            rows={4}
            value={data.description}
            onChange={e => onChange({ description: e.target.value })}
            placeholder="Describe tu evento..."
            required
          />
        </div>
  
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="date">
              Fecha y Hora
            </label>
            <input
              id="date"
              type="datetime-local"
              className="w-full p-2 border rounded"
              value={data.date}
              onChange={e => onChange({ date: e.target.value })}
              required
            />
          </div>
  
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="location">
              Ubicación
            </label>
            <input
              id="location"
              type="text"
              className="w-full p-2 border rounded"
              value={data.location}
              onChange={e => onChange({ location: e.target.value })}
              placeholder="Ej: Teatro Nacional"
              required
            />
          </div>
        </div>
  
        <div className="text-sm text-gray-500 mt-4">
          <p>
            Tip: Proporciona información clara y detallada para que los asistentes 
            sepan exactamente qué esperar de tu evento.
          </p>
        </div>
      </div>
    );
  }