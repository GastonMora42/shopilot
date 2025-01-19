import { IEvent } from "@/types/event";
import { Credit, CreditPackage } from "../models/Credit";

// services/creditService.ts
// services/creditService.ts
export class CreditService {
  static calculateRequiredCredits(event: any): number {
    if (event.eventType === 'SEATED') {
      // Contar los asientos reales basados en las secciones
      let totalSeats = 0;
      event.seatingChart.sections.forEach((section: any) => {
        const rowCount = (section.rowEnd - section.rowStart + 1);
        const colCount = (section.columnEnd - section.columnStart + 1);
        totalSeats += rowCount * colCount;
      });
      return totalSeats;
    } else if (event.eventType === 'GENERAL') {
      // Sumar todas las cantidades de tickets generales
      return event.generalTickets.reduce((total: number, ticket: any) => {
        return total + ticket.quantity;
      }, 0);
    }
    return 0;
  }
  static async checkBalance(userId: string, requiredCredits: number) {
    const userCredits = await Credit.findOne({ userId });
    if (!userCredits) return false;
    return userCredits.balance >= requiredCredits;
  }

  static async deductCredits(userId: string, amount: number, eventId: string) {
    const userCredits = await Credit.findOne({ userId });
    if (!userCredits || userCredits.balance < amount) {
      throw new Error('Creditos insuficientes');
    }

    userCredits.balance -= amount;
    userCredits.transactions.push({
      type: 'USE',
      amount: -amount,
      eventId,
      timestamp: new Date()
    });

    await userCredits.save();
    return userCredits;
  }
}