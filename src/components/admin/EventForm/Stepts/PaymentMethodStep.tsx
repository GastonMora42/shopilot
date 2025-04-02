// src/components/admin/EventForm/Stepts/PaymentMethodStep.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Asegurar que los tipos coincidan con la interfaz de User
interface BankAccountData {
  accountName: string;
  cbu: string;
  bank: string;
  additionalNotes?: string;
}

interface PaymentMethodStepProps {
  paymentMethod: 'MERCADOPAGO' | 'BANK_TRANSFER';
  bankAccountData?: BankAccountData;
  onChange: (data: { 
    paymentMethod: 'MERCADOPAGO' | 'BANK_TRANSFER', 
    bankAccountData?: BankAccountData
  }) => void;
  hasMercadoPagoLinked: boolean;
  hasBankAccountConfigured: boolean;
}

export const PaymentMethodStep: React.FC<PaymentMethodStepProps> = ({
  paymentMethod,
  bankAccountData,
  onChange,
  hasMercadoPagoLinked,
  hasBankAccountConfigured
}) => {
  const { data: session } = useSession();
  const [selectedMethod, setSelectedMethod] = useState<'MERCADOPAGO' | 'BANK_TRANSFER'>(
    paymentMethod || 'MERCADOPAGO'
  );
  
  // Inicialización segura de datos bancarios
  const defaultBankData: BankAccountData = {
    accountName: '',
    cbu: '',
    bank: '',
    additionalNotes: ''
  };
  
  // Type-safe acceso a los datos de la cuenta bancaria
  const userBankAccount = session?.user?.bankAccount || null;
  
  // Inicializar datos bancarios con valores seguros
  const [bankData, setBankData] = useState<BankAccountData>(
    bankAccountData || 
    (userBankAccount ? {
      accountName: userBankAccount.accountName || '',
      cbu: userBankAccount.cbu || '',
      bank: userBankAccount.bank || '',
      additionalNotes: userBankAccount.additionalNotes || ''
    } : defaultBankData)
  );

  const [useCustomBankData, setUseCustomBankData] = useState(!hasBankAccountConfigured);

  useEffect(() => {
    if (selectedMethod === 'BANK_TRANSFER' && useCustomBankData) {
      onChange({ 
        paymentMethod: selectedMethod,
        bankAccountData: bankData
      });
    } else {
      onChange({ 
        paymentMethod: selectedMethod,
        bankAccountData: undefined
      });
    }
  }, [selectedMethod, bankData, useCustomBankData, onChange]);

  const handleBankDataChange = (field: keyof BankAccountData, value: string) => {
    setBankData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Método de Pago</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card 
          className={`p-6 cursor-pointer transition-all ${
            selectedMethod === 'MERCADOPAGO' 
            ? 'border-[#0087ca] bg-blue-50'
            : 'hover:border-gray-400'
          }`}
          onClick={() => setSelectedMethod('MERCADOPAGO')}
        >
          <h4 className="font-medium mb-2">MercadoPago</h4>
          <p className="text-sm text-gray-600">
            Cobra automáticamente a través de MercadoPago. Necesitas tener una cuenta vinculada.
          </p>
          {!hasMercadoPagoLinked && selectedMethod === 'MERCADOPAGO' && (
            <div className="mt-4 text-red-500 text-sm">
              <p className="mb-2">
                Necesitas vincular tu cuenta de MercadoPago en la sección de configuración.
              </p>
              <Button
                asChild
                size="sm"
                className="bg-[#0087ca] hover:bg-[#0087ca]/90"
              >
                <Link href="/admin/settings">
                  Ir a Configuración
                </Link>
              </Button>
            </div>
          )}
        </Card>

        <Card 
          className={`p-6 cursor-pointer transition-all ${
            selectedMethod === 'BANK_TRANSFER' 
            ? 'border-[#0087ca] bg-blue-50'
            : 'hover:border-gray-400'
          }`}
          onClick={() => setSelectedMethod('BANK_TRANSFER')}
        >
          <h4 className="font-medium mb-2">Transferencia Bancaria</h4>
          <p className="text-sm text-gray-600">
            Los compradores verán tus datos bancarios y podrán enviarte comprobantes que deberás aprobar manualmente.
          </p>
        </Card>
      </div>

      {selectedMethod === 'BANK_TRANSFER' && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium">Datos Bancarios</h4>
            
            {hasBankAccountConfigured && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useProfileBankData"
                  checked={!useCustomBankData}
                  onChange={() => setUseCustomBankData(!useCustomBankData)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="useProfileBankData" className="text-sm text-gray-700">
                  Usar datos de mi perfil
                </label>
              </div>
            )}
          </div>
          
          {hasBankAccountConfigured && !useCustomBankData ? (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                Se utilizarán los datos bancarios configurados en tu perfil.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <span className="block text-xs font-medium text-gray-500">Nombre de la cuenta</span>
                  <span className="block">{userBankAccount?.accountName}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500">CBU/CVU</span>
                  <span className="block">{userBankAccount?.cbu}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500">Banco</span>
                  <span className="block">{userBankAccount?.bank}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la cuenta
                </label>
                <Input
                  value={bankData.accountName}
                  onChange={(e) => handleBankDataChange('accountName', e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CBU o CVU
                </label>
                <Input
                  value={bankData.cbu}
                  onChange={(e) => handleBankDataChange('cbu', e.target.value)}
                  placeholder="Ej: 0000000000000000000000"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banco
                </label>
                <Input
                  value={bankData.bank}
                  onChange={(e) => handleBankDataChange('bank', e.target.value)}
                  placeholder="Ej: Banco Nación"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas adicionales
                </label>
                <Textarea
                  value={bankData.additionalNotes || ''}
                  onChange={(e) => handleBankDataChange('additionalNotes', e.target.value)}
                  placeholder="Instrucciones o información adicional para el comprador"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};