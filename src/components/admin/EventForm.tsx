// components/admin/EventForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EventFormData {
 name: string;
 description: string;
 date: string;
 location: string;
 seatingChart: {
   rows: number;
   columns: number;
   sections: {
     name: string;
     type: 'REGULAR' | 'VIP' | 'DISABLED';
     price: number;
     rowStart: number;
     rowEnd: number;
     columnStart: number;
     columnEnd: number;
   }[];
 };
}

interface Section {
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
  price: number;  // Si se usa esta propiedad
  type: string;   // Si se usa esta propiedad
}


export default function EventForm() {
 const router = useRouter();
 const [isLoading, setIsLoading] = useState(false);
 const [eventData, setEventData] = useState<EventFormData>({
   name: '',
   description: '',
   date: '',
   location: '',
   seatingChart: {
     rows: 10,
     columns: 10,
     sections: [
       {
         name: 'Regular',
         type: 'REGULAR',
         price: 1000,
         rowStart: 0,
         rowEnd: 7,
         columnStart: 0,
         columnEnd: 10
       },
       {
         name: 'VIP',
         type: 'VIP',
         price: 2000,
         rowStart: 8,
         rowEnd: 10,
         columnStart: 0,
         columnEnd: 10
       }
     ]
   }
 });

 const generateSeats = async (eventId: string, seatingChart: { rows: number; columns: number; sections: Section[] }) => {
  const seats = [];
  for (let row = 0; row < seatingChart.rows; row++) {
    for (let col = 0; col < seatingChart.columns; col++) {
      // Encontrar la sección a la que pertenece este asiento
      const section = seatingChart.sections.find(
        (s: Section) => 
          row >= s.rowStart && 
          row <= s.rowEnd && 
          col >= s.columnStart && 
          col <= s.columnEnd
      );

      if (section) {
        seats.push({
          eventId,
          row,
          column: col,
          number: `${String.fromCharCode(65 + row)}${col + 1}`,
          status: 'AVAILABLE',
          price: section.price,
          type: section.type
        });
      }
    }
  }
  
  return seats;
};

// Modificar el handleSubmit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // 1. Crear el evento
    const eventResponse = await fetch('/api/events/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!eventResponse.ok) {
      throw new Error('Error al crear el evento');
    }

    const event = await eventResponse.json();

    // 2. Generar y crear los asientos
    const seats = await generateSeats(event._id, eventData.seatingChart);
    
    const seatsResponse = await fetch('/api/seats/create-bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ seats }),
    });

    if (!seatsResponse.ok) {
      throw new Error('Error al crear los asientos');
    }

    router.push(`/admin/events/${event._id}`);
  } catch (error) {
    console.error('Error:', error);
    // Mostrar error al usuario
  } finally {
    setIsLoading(false);
  }
};

 const handleSectionChange = (index: number, field: string, value: string | number) => {
   setEventData(prev => ({
     ...prev,
     seatingChart: {
       ...prev.seatingChart,
       sections: prev.seatingChart.sections.map((section, i) => 
         i === index ? { ...section, [field]: value } : section
       )
     }
   }));
 };

 return (
   <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6">
     <div>
       <label className="block text-sm font-medium text-gray-700 mb-2">
         Nombre del Evento
       </label>
       <input
         type="text"
         required
         className="w-full p-2 border rounded-md"
         value={eventData.name}
         onChange={(e) => setEventData(prev => ({
           ...prev,
           name: e.target.value
         }))}
       />
     </div>

     <div>
       <label className="block text-sm font-medium text-gray-700 mb-2">
         Descripción
       </label>
       <textarea
         required
         rows={4}
         className="w-full p-2 border rounded-md"
         value={eventData.description}
         onChange={(e) => setEventData(prev => ({
           ...prev,
           description: e.target.value
         }))}
       />
     </div>

     <div className="grid grid-cols-2 gap-4">
       <div>
         <label className="block text-sm font-medium text-gray-700 mb-2">
           Fecha y Hora
         </label>
         <input
           type="datetime-local"
           required
           className="w-full p-2 border rounded-md"
           value={eventData.date}
           onChange={(e) => setEventData(prev => ({
             ...prev,
             date: e.target.value
           }))}
         />
       </div>

       <div>
         <label className="block text-sm font-medium text-gray-700 mb-2">
           Ubicación
         </label>
         <input
           type="text"
           required
           className="w-full p-2 border rounded-md"
           value={eventData.location}
           onChange={(e) => setEventData(prev => ({
             ...prev,
             location: e.target.value
           }))}
         />
       </div>
     </div>

     <div className="border-t pt-6">
       <h3 className="text-lg font-medium text-gray-900 mb-4">
         Configuración de Asientos
       </h3>
       
       <div className="grid grid-cols-2 gap-4 mb-6">
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">
             Filas
           </label>
           <input
             type="number"
             min="1"
             required
             className="w-full p-2 border rounded-md"
             value={eventData.seatingChart.rows}
             onChange={(e) => setEventData(prev => ({
               ...prev,
               seatingChart: {
                 ...prev.seatingChart,
                 rows: parseInt(e.target.value)
               }
             }))}
           />
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">
             Columnas
           </label>
           <input
             type="number"
             min="1"
             required
             className="w-full p-2 border rounded-md"
             value={eventData.seatingChart.columns}
             onChange={(e) => setEventData(prev => ({
               ...prev,
               seatingChart: {
                 ...prev.seatingChart,
                 columns: parseInt(e.target.value)
               }
             }))}
           />
         </div>
       </div>

       <div className="space-y-4">
         <h4 className="text-md font-medium text-gray-900">Secciones</h4>
         {eventData.seatingChart.sections.map((section, index) => (
           <div key={index} className="border p-4 rounded-md">
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Nombre de la Sección
                 </label>
                 <input
                   type="text"
                   required
                   className="w-full p-2 border rounded-md"
                   value={section.name}
                   onChange={(e) => handleSectionChange(index, 'name', e.target.value)}
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Tipo
                 </label>
                 <select
                   className="w-full p-2 border rounded-md"
                   value={section.type}
                   onChange={(e) => handleSectionChange(index, 'type', e.target.value)}
                 >
                   <option value="REGULAR">Regular</option>
                   <option value="VIP">VIP</option>
                   <option value="DISABLED">Discapacitados</option>
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Precio
                 </label>
                 <input
                   type="number"
                   required
                   min="0"
                   className="w-full p-2 border rounded-md"
                   value={section.price}
                   onChange={(e) => handleSectionChange(index, 'price', parseInt(e.target.value))}
                 />
               </div>

               <div className="col-span-2 grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Fila Inicio
                   </label>
                   <input
                     type="number"
                     required
                     min="0"
                     className="w-full p-2 border rounded-md"
                     value={section.rowStart}
                     onChange={(e) => handleSectionChange(index, 'rowStart', parseInt(e.target.value))}
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Fila Fin
                   </label>
                   <input
                     type="number"
                     required
                     min="0"
                     className="w-full p-2 border rounded-md"
                     value={section.rowEnd}
                     onChange={(e) => handleSectionChange(index, 'rowEnd', parseInt(e.target.value))}
                   />
                 </div>
               </div>
             </div>
           </div>
         ))}
       </div>
     </div>

     <button
       type="submit"
       disabled={isLoading}
       className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
     >
       {isLoading ? 'Creando...' : 'Crear Evento'}
     </button>
   </form>
 );
}