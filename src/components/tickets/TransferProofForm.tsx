// src/components/tickets/TransferProofForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Upload, Trash2, CheckCircle } from 'lucide-react';

interface TransferProofFormProps {
  bankData: {
    accountName: string;
    cbu: string;
    bank: string;
    additionalNotes?: string;
  };
  onSubmit: (data: { proofImage: File; notes: string }) => Promise<void>;
  isLoading: boolean;
}

export function TransferProofForm({ bankData, onSubmit, isLoading }: TransferProofFormProps) {
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const file = e.target.files[0];
    setProofImage(file);
    
    // Crear una vista previa
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofImage) return;
    
    try {
      await onSubmit({
        proofImage,
        notes
      });
    } catch (error) {
      console.error('Error al enviar el comprobante:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-blue-50">
        <h3 className="text-lg font-medium mb-4">Datos para la transferencia</h3>
        <div className="space-y-2">
          <p><strong>Nombre:</strong> {bankData.accountName}</p>
          <p><strong>CBU/CVU:</strong> {bankData.cbu}</p>
          <p><strong>Banco:</strong> {bankData.bank}</p>
          {bankData.additionalNotes && (
            <p><strong>Notas:</strong> {bankData.additionalNotes}</p>
          )}
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Comprobante de transferencia
          </label>
          
          {!imagePreview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="proof-upload"
                required
              />
              <label 
                htmlFor="proof-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Haz clic para seleccionar o arrastra una imagen
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF hasta 10MB
                </p>
              </label>
            </div>
          ) : (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Vista previa" 
                className="max-h-64 rounded-lg mx-auto"
              />
              <button
                type="button"
                onClick={() => {
                  setProofImage(null);
                  setImagePreview(null);
                }}
                className="absolute top-2 right-2 bg-red-100 text-red-600 p-2 rounded-full"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Notas adicionales (opcional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Número de transacción, hora, etc."
            rows={3}
          />
        </div>

        <Button
          type="submit"
          disabled={!proofImage || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white rounded-full border-opacity-50 border-t-transparent" />
              Enviando...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Enviar comprobante y finalizar compra
            </>
          )}
        </Button>
      </form>
    </div>
  );
}