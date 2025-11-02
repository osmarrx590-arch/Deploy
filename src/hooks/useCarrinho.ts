// src/hooks/useCarrinho.ts
import { useContext } from 'react';
import { CarrinhoContext } from '@/contexts/CarrinhoContext'; // Importa do novo local
import { CarrinhoContextData } from '@/types/carrinho';

export function useCarrinho(): CarrinhoContextData {
  const context = useContext(CarrinhoContext);
  if (context === undefined) {
    throw new Error('useCarrinho must be used within a CarrinhoProvider');
  }
  return context;
}