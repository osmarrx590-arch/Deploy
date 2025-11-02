import { useEffect, useState } from 'react';
import type { PedidoLocal } from '@/types/pedido';

export default function usePedidosLocais(pollInterval = 10000) {
  const [pedidos, setPedidos] = useState<PedidoLocal[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('pedidos_locais') || '[]');
    } catch (e) {
      return [];
    }
  });

  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const read = () => {
      try {
        setPedidos(JSON.parse(localStorage.getItem('pedidos_locais') || '[]'));
      } catch (e) {
        setPedidos([]);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pedidos_locais' || e.key === null) read();
    };

    const handleCustom = () => read();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('pedidos_locais_updated', handleCustom);

    const timer = setInterval(() => setNow(Date.now()), pollInterval);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('pedidos_locais_updated', handleCustom);
      clearInterval(timer);
    };
  }, [pollInterval]);

  return { pedidos, now };
}
