// middlewares/creditCheck.ts
import { Credit } from "../models/Credit";
import { CreditService } from "../services/creditService";

interface CreditCheckResult {
  error?: boolean;
  message?: string;
  requiredCredits: number;
  success?: boolean;
}

export async function creditCheck(event: any, userId: string): Promise<CreditCheckResult> {
  try {
    const requiredCredits = CreditService.calculateRequiredCredits(event);
    
    const userCredits = await Credit.findOne({ userId });
    if (!userCredits || userCredits.balance < requiredCredits) {
      return {
        error: true,
        message: `No tienes suficientes créditos. Necesitas ${requiredCredits} créditos para publicar este evento.`,
        requiredCredits
      };
    }

    return {
      success: true,
      requiredCredits
    };

  } catch (error) {
    console.error('Error en creditCheck:', error);
    return {
      error: true,
      message: 'Error al verificar créditos',
      requiredCredits: 0
    };
  }
}