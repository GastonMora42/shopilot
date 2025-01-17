import { IEvent } from "@/types/event";
import { Credit, CreditPackage } from "../models/Credit";

// services/creditService.ts
export class CreditService {
    // Verificar balance
    static async checkBalance(userId: string, requiredCredits: number) {
      const userCredits = await Credit.findOne({ userId });
      return userCredits?.balance >= requiredCredits;
    }
  
    // Calcular créditos necesarios para un evento
    static calculateRequiredCredits(event: IEvent): number {
      if (event.eventType === 'SEATED') {
        return event.seatingChart.rows * event.seatingChart.columns;
      } else {
        return event.generalTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
      }
    }
  
    // Reservar y deducir créditos
    static async deductCredits(userId: string, amount: number, eventId: string) {
      const userCredits = await Credit.findOne({ userId });
      if (!userCredits || userCredits.balance < amount) {
        throw new Error('Insufficient credits');
      }
  
      userCredits.balance -= amount;
      userCredits.transactions.push({
        type: 'USE',
        amount: -amount,
        eventId
      });
  
      await userCredits.save();
      return userCredits;
    }

    // Procesar compra de créditos
    static async purchaseCredits(userId: string, packageId: string, paymentId: string) {
      const creditPackage = await CreditPackage.findById(packageId);
      const userCredits = await Credit.findOne({ userId });
  
      if (!userCredits) {
        return await Credit.create({
          userId,
          balance: creditPackage.credits,
          transactions: [{
            type: 'PURCHASE',
            amount: creditPackage.credits,
            packageId,
            paymentId
          }]
        });
      }
  
      userCredits.balance += creditPackage.credits;
      userCredits.transactions.push({
        type: 'PURCHASE',
        amount: creditPackage.credits,
        packageId,
        paymentId
      });
  
      return await userCredits.save();
    }
  }