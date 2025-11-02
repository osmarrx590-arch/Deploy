// src/contexts/FavoritosContext.ts
import { createContext } from 'react';
import { FavoritosContextType } from '@/types/favoritos';

export const FavoritosContext = createContext<FavoritosContextType | undefined>(undefined);
