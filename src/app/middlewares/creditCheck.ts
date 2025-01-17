// app/middlewares/creditCheck.ts
import { CreditService } from '@/app/services/creditService';

// app/middlewares/creditCheck.ts
export async function creditCheck(data: any, userId: string) {
    try {
      const requiredCredits = CreditService.calculateRequiredCredits(data);
      
      if (data.status === 'PUBLISHED') {
        const hasEnoughCredits = await CreditService.checkBalance(userId, requiredCredits);
        
        if (!hasEnoughCredits) {
          return {
            error: 'Insufficient credits',
            required: requiredCredits,
            message: 'No tienes suficientes créditos para publicar este evento'
          };
        }
      }
      
      return { success: true, requiredCredits: requiredCredits || 0 };
    } catch (error) {
      return {
        error: 'Error checking credits',
        message: error instanceof Error ? error.message : 'Error al verificar créditos',
        requiredCredits: 0
      };
    }
  }