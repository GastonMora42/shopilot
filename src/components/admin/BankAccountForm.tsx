// src/components/admin/BankAccountForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Loader2 } from 'lucide-react';

interface BankAccountData {
  accountName: string;
  cbu: string;
  bank: string;
  additionalNotes?: string;
}

interface BankAccountFormProps {
  initialData?: BankAccountData;
  onSave: (data: BankAccountData) => Promise<void>;
}

export function BankAccountForm({ initialData, onSave }: BankAccountFormProps) {
  const [bankData, setBankData] = useState<BankAccountData>(initialData || {
    accountName: '',
    cbu: '',
    bank: '',
    additionalNotes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    success?: boolean;
    error?: string;
  }>({});

  const handleChange = (field: keyof BankAccountData, value: string) => {
    setBankData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bankData.accountName || !bankData.cbu || !bankData.bank) {
      setSaveStatus({
        error: 'Los campos nombre, CBU y banco son obligatorios'
      });
      return;
    }

    setIsSaving(true);
    setSaveStatus({});
    
    try {
      await onSave(bankData);
      setSaveStatus({ success: true });
    } catch (error) {
      setSaveStatus({ 
        error: error instanceof Error ? error.message : 'Error al guardar datos bancarios' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {saveStatus.success && (
        <div className="p-4 bg-green-100 text-green-700 rounded-lg">
          Datos bancarios guardados correctamente
        </div>
      )}
      
      {saveStatus.error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          {saveStatus.error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de la cuenta
        </label>
        <Input
          value={bankData.accountName}
          onChange={(e) => handleChange('accountName', e.target.value)}
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
          onChange={(e) => handleChange('cbu', e.target.value)}
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
          onChange={(e) => handleChange('bank', e.target.value)}
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
          onChange={(e) => handleChange('additionalNotes', e.target.value)}
          placeholder="Instrucciones o información adicional para el comprador"
          rows={3}
        />
      </div>
      
      <Button
        type="submit"
        disabled={isSaving}
        className="bg-[#0087ca] hover:bg-[#0087ca]/90"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Guardando...
          </>
        ) : (
          'Guardar datos bancarios'
        )}
      </Button>
    </form>
  );
}