import { createContext } from 'react';
import { EmpresasContextType } from '@/types/empresa';

export const EmpresasContext = createContext<EmpresasContextType | undefined>(undefined);