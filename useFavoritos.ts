// src/hooks/useFavoritos.ts
import { useContext } from 'react';
import { FavoritosContext } from '@/contexts/FavoritosContext'; // Importa do novo local
import { FavoritosContextType } from '@/types/favoritos';

export function useFavoritos(): FavoritosContextType {
  const context = useContext(FavoritosContext);
  if (context === undefined) {
    throw new Error('useFavoritos must be used within a FavoritosProvider');
  }
  return context;
}
