// src/components/tickets/TransferProofForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Upload, Trash2, CheckCircle, Loader2 } from 'lucide-react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const file = e.target.files[0];
    
    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('La imagen es demasiado grande. El tamaño máximo es 10MB.');
      return;
    }
    
    setProofImage(file);
    setErrorMessage(null);
    
    // Crear una vista previa
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofImage) {
      setErrorMessage('Por favor, selecciona una imagen del comprobante de transferencia');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      
      await onSubmit({
        proofImage,
        notes
      });
    } catch (error) {
      console.error('Error al enviar el comprobante:', error);
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : 'Ocurrió un error al procesar el comprobante. Por favor, intenta nuevamente.'
      );
      setIsSubmitting(false);
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

      {errorMessage && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {errorMessage}
        </div>
      )}

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
                disabled={isSubmitting || isLoading}
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
                disabled={isSubmitting || isLoading}
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
            disabled={isSubmitting || isLoading}
          />
        </div>

        <Button
          type="submit"
          disabled={!proofImage || isSubmitting || isLoading}
          className="w-full bg-[#0087ca] hover:bg-[#0087ca]/90"
        >
          {isSubmitting || isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="animate-spin h-5 w-5" />
              <span>Procesando transferencia...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Enviar comprobante y finalizar compra</span>
            </div>
          )}
        </Button>
      </form>
    </div>
  );
}