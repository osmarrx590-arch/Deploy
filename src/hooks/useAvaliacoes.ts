// src/hooks/useAvaliacoes.ts
import { useContext } from 'react';
import { AvaliacoesContext } from '@/contexts/AvaliacoesContext'; // Importa do novo local
import { AvaliacoesContextType } from '@/types/avaliacoes';

// Hook personalizado para consumir o contexto de avaliações
export function useAvaliacoes(): AvaliacoesContextType {
  const context = useContext(AvaliacoesContext);
  if (context === undefined) {
    throw new Error('useAvaliacoes must be used within an AvaliacoesProvider');
  }
  return context;
}