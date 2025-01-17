import { CreditService } from "../services/creditService";
import { Event } from '@/app/models/Event'; // Asegúrate de que la ruta de importación sea correcta
import type { IEvent } from '@/types'; // Importa la interfaz si la tienes
// controllers/eventController.ts
export const createEvent = async (req: { body: any; user: { id: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { error: any; required?: any; }): void; new(): any; }; }; }) => {
    try {
      const eventData = req.body;
      const userId = req.user.id;
  
      // Calcular créditos necesarios
      const requiredCredits = CreditService.calculateRequiredCredits(eventData);
  
      // Verificar balance
      if (!await CreditService.checkBalance(userId, requiredCredits)) {
        return res.status(400).json({
          error: 'Insufficient credits',
          required: requiredCredits
        });
      }
  
      // Crear evento
      const event = await Event.create({
        ...eventData,
        organizerId: userId
      });
  
      // Deducir créditos si el evento se publica directamente
      if (event.status === 'PUBLISHED') {
        await CreditService.deductCredits(userId, requiredCredits, event._id);
      }
  
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: error });
    }
  };