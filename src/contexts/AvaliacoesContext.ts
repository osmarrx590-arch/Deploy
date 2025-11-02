// src/contexts/AvaliacoesContext.ts
import { createContext } from 'react';
import { AvaliacoesContextType } from '@/types/avaliacoes';

// Define e exporta o objeto de contexto
export const AvaliacoesContext = createContext<AvaliacoesContextType | undefined>(undefined);