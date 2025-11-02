// src/contexts/CarrinhoContext.ts
import { createContext } from 'react';
import { CarrinhoContextData } from '@/types/carrinho';

export const CarrinhoContext = createContext<CarrinhoContextData | undefined>(undefined);
