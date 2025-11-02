import React, { useState } from 'react';
import { checkoutService } from '@/services/apiServices';
import { Button } from '@/components/ui/button';

type MPPreference = {
  id?: string;
  init_point?: string;
  point_of_interaction?: {
    transaction_data?: { qr_code?: string };
  };
};

interface Props { pedidoId: number }

const CheckoutMpQRCode: React.FC<Props> = ({ pedidoId }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [preference, setPreference] = useState<MPPreference | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await checkoutService.createSession(pedidoId, 'pix');
      // res may contain preference directly or nested; normalize
      const pref = (res && (res.preference ?? res)) as MPPreference;
      setPreference(pref);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Erro ao criar sessão');
    } finally {
      setLoading(false);
    }
  };

  const qr = preference?.point_of_interaction?.transaction_data?.qr_code;

  return (
    <div className="p-4 bg-white rounded-md shadow-sm">
      <h3 className="text-lg font-medium mb-2">Pagamento (Mercado Pago)</h3>
      <div className="space-y-2">
        <Button onClick={handleCreate} disabled={loading}>{loading ? 'Gerando...' : 'Gerar QR / Checkout'}</Button>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {preference && (
          <div>
            <div className="text-sm text-gray-600 mb-2">Preferência: {String(preference.id ?? '')}</div>
            {qr ? (
              <img src={`data:image/png;base64,${qr}`} alt="QR PIX" />
            ) : (
              preference.init_point && <a href={preference.init_point} target="_blank" rel="noreferrer">Abrir Checkout</a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutMpQRCode;
