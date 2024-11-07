
import { Button } from "../ui/Button";

interface BuyerFormProps {
  onSubmit: (buyerInfo: {
    name: string;
    email: string;
    dni: string;
    phone?: string;
  }) => void;
  isLoading?: boolean;
}

export function BuyerForm({ onSubmit, isLoading }: BuyerFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    onSubmit({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      dni: formData.get('dni') as string,
      phone: formData.get('phone') as string,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nombre completo
        </label>
        <input
          type="text"
          name="name"
          id="name"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="dni" className="block text-sm font-medium text-gray-700">
          DNI
        </label>
        <input
          type="text"
          name="dni"
          id="dni"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Teléfono (opcional)
        </label>
        <input
          type="tel"
          name="phone"
          id="phone"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Procesando...' : 'Continuar con el pago'}
      </Button>
    </form>
  );
}