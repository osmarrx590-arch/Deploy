import { useContext } from 'react';
import { EmpresasContextType } from '@/types/empresa';
import { EmpresasContext } from '@/contexts/EmpresasContext';

export const useApi = () => {
  const context = useContext(EmpresasContext);
  if (!context) {
    throw new Error("useApi must be used within an EmpresasProvider");
  }
  return context;
};

// Se EmpresasContextType for usado apenas por useApi ou hooks relacionados,
// você pode mover sua definição para cá ou mantê-la em um arquivo `types` compartilhado.
// Por enquanto, vamos supor que ele foi importado corretamente do seu alias `@/types`.
