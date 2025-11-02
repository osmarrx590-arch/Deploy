import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { empresaStorage } from '@/services/storageService';
import { Empresa, NotaFiscal } from '@/types'; // Supondo que os tipos estejam aqui ou em outro arquivo compartilhado
import { EmpresasContext } from '@/contexts/EmpresasContext';
import { EmpresaFormData, CriarNotaFiscalData, EmpresasContextType } from '@/types/empresa';

// Re-use unified types
type CadastroEmpresaData = EmpresaFormData;

interface EmpresasProviderProps {
  children: ReactNode;
}

export const EmpresasProvider: React.FC<EmpresasProviderProps> = ({ children }) => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  const getEmpresas = useCallback(async () => {
    try {
      const empresasData = empresaStorage.getAll();
      setEmpresas(empresasData);
      return empresasData;
    } catch (error) {
      console.error("Erro ao obter empresas:", error);
      return [];
    }
  }, []);

  const addEmpresa = useCallback(async (empresa: Omit<Empresa, 'id' | 'slug'>) => {
    try {
      const novaEmpresa: Empresa = {
        ...empresa,
        id: Math.floor(Math.random() * 1000000), // Consider using a UUID generator for robust IDs
        slug: empresa.nome.toLowerCase().replace(/\s+/g, '-'),
        status: empresa.status || 'ativo'
      };
      empresaStorage.add(novaEmpresa);
      await getEmpresas();
    } catch (error) {
      console.error("Erro ao adicionar empresa:", error);
    }
  }, [getEmpresas]);

  const updateEmpresa = useCallback(async (id: number, empresaData: Omit<Empresa, 'id' | 'slug' | 'notasFiscais'>) => {
    try {
      const empresaCompleta: Empresa = {
        ...empresaData,
        id,
        slug: empresaData.nome.toLowerCase().replace(/\s+/g, '-')
      };
      const empresas = empresaStorage.getAll();
      const index = empresas.findIndex(e => e.id === id);
      if (index !== -1) {
        empresas[index] = empresaCompleta;
        empresaStorage.save(empresas);
      }
      await getEmpresas();
    } catch (error) {
      console.error("Erro ao atualizar empresa:", error);
    }
  }, [getEmpresas]);

  const removeEmpresa = useCallback(async (id: number) => {
    try {
      const empresas = empresaStorage.getAll();
      const updatedEmpresas = empresas.filter(e => e.id !== id);
      empresaStorage.save(updatedEmpresas);
      await getEmpresas();
    } catch (error) {
      console.error("Erro ao remover empresa:", error);
    }
  }, [getEmpresas]);

  const addNotaFiscal = useCallback(async (empresaId: number, notaFiscal: Omit<NotaFiscal, 'id' | 'empresaId'>) => {
    try {
      const empresas = empresaStorage.getAll();
      const index = empresas.findIndex(e => e.id === empresaId);
      if (index === -1) throw new Error('Empresa não encontrada');
      const empresa = empresas[index];
      const notas = Array.isArray(empresa.notasFiscais) ? empresa.notasFiscais : [];
      const newId = notas.length > 0 ? Math.max(...notas.map(n => n.id || 0)) + 1 : Date.now();
      const novaNota: NotaFiscal = { ...notaFiscal, id: newId, empresaId };
        notas.push(novaNota);
        empresas[index] = { ...empresa, notasFiscais: notas };
        empresaStorage.save(empresas);
        await getEmpresas();
        return; // Changed to return void
    } catch (error) {
      console.error("Erro ao adicionar nota fiscal:", error);
    }
  }, [getEmpresas]);

  const getNotasFiscais = useCallback(async (empresaId: number) => {
    try {
      const empresas = empresaStorage.getAll();
      const empresa = empresas.find(e => e.id === empresaId);
      if (!empresa) return [];
      return Array.isArray(empresa.notasFiscais) ? empresa.notasFiscais : [];
    } catch (error) {
      console.error("Erro ao obter notas fiscais:", error);
      return [];
    }
  }, []);

  const removeNotaFiscal = useCallback(async (empresaId: number, notaFiscalId: number) => {
    try {
      const empresas = empresaStorage.getAll();
      const index = empresas.findIndex(e => e.id === empresaId);
      if (index === -1) throw new Error('Empresa não encontrada');
      const empresa = empresas[index];
      const notas = Array.isArray(empresa.notasFiscais) ? empresa.notasFiscais.filter(n => n.id !== notaFiscalId) : [];
      empresas[index] = { ...empresa, notasFiscais: notas };
      empresaStorage.save(empresas);
      await getEmpresas();
    } catch (error) {
      console.error("Erro ao remover nota fiscal:", error);
    }
  }, [getEmpresas]);

  const cadastrarEmpresa = useCallback(async (data: CadastroEmpresaData) => {
    try {
      const novaEmpresa: Empresa = {
        nome: data.nome,
        endereco: data.endereco,
        telefone: data.telefone,
        email: data.email,
        cnpj: data.cnpj,
        status: data.status || 'ativo',
        id: Math.floor(Math.random() * 1000000), // Consider using a UUID generator for robust IDs
        slug: data.nome.toLowerCase().replace(/\s+/g, '-')
      };
      empresaStorage.add(novaEmpresa);

      if (data.notaFiscal) {
        // Se houver nota fiscal vinculada no cadastro inicial, insere na empresa criada
        const empresas = empresaStorage.getAll();
        const index = empresas.findIndex(e => e.id === novaEmpresa.id);
        if (index !== -1) {
          const notas = empresas[index].notasFiscais ?? [];
          const notaId = notas.length > 0 ? Math.max(...notas.map(n => n.id || 0)) + 1 : Date.now();
          const nota = { ...data.notaFiscal, id: notaId, empresaId: novaEmpresa.id } as NotaFiscal;
          empresas[index] = { ...empresas[index], notasFiscais: [...notas, nota] };
          empresaStorage.save(empresas);
        }
      }

      await getEmpresas();
    } catch (error) {
      console.error("Erro ao cadastrar empresa:", error);
      throw error;
    }
  }, [getEmpresas]);

  const getEmpresaById = useCallback(async (id: number) => {
    try {
      const empresasData = empresaStorage.getAll();
      return empresasData.find(empresa => empresa.id === id) || null;
    } catch (error) {
      console.error("Erro ao obter empresa por ID:", error);
      return null;
    }
  }, []);

  const getNotasFiscaisByEmpresa = useCallback(async (empresaId: number) => {
    try {
      const empresas = empresaStorage.getAll();
      const empresa = empresas.find(e => e.id === empresaId);
      if (!empresa) return [];
      return Array.isArray(empresa.notasFiscais) ? empresa.notasFiscais : [];
    } catch (error) {
      console.error("Erro ao obter notas fiscais por empresa:", error);
      return [];
    }
  }, []);

  const createNotaFiscal = useCallback(async (data: CriarNotaFiscalData) => {
    try {
      const notaFiscalData: Omit<NotaFiscal, 'id' | 'empresaId'> = {
        numero: data.numero,
        data: data.data,
        serie: data.serie || '1', // Use a default series if not provided
        descricao: data.descricao || ''
      };
      // criar e persistir nota vinculada à empresa
      const empresas = empresaStorage.getAll();
      const index = empresas.findIndex(e => e.id === data.empresaId);
      if (index === -1) throw new Error('Empresa não encontrada');
      const empresa = empresas[index];
      const notas = Array.isArray(empresa.notasFiscais) ? empresa.notasFiscais : [];
      const newId = notas.length > 0 ? Math.max(...notas.map(n => n.id || 0)) + 1 : Date.now();
      const novaNota: NotaFiscal = { ...notaFiscalData, id: newId, empresaId: data.empresaId };
        notas.push(novaNota);
        empresas[index] = { ...empresa, notasFiscais: notas };
        empresaStorage.save(empresas);
        await getEmpresas();
        return; // Changed to return void
    } catch (error) {
      console.error("Erro ao criar nota fiscal:", error);
      throw error;
    }
  }, [getEmpresas]);

  const deleteEmpresa = useCallback(async (id: number) => {
    try {
      const empresas = empresaStorage.getAll();
      const updatedEmpresas = empresas.filter(e => e.id !== id);
      empresaStorage.save(updatedEmpresas);
      await getEmpresas();
    } catch (error) {
      console.error("Erro ao deletar empresa:", error);
      throw error;
    }
  }, [getEmpresas]);

  const value: EmpresasContextType = {
    empresas,
    getEmpresas,
    addEmpresa,
    updateEmpresa,
    removeEmpresa,
    addNotaFiscal,
    getNotasFiscais,
    removeNotaFiscal,
    cadastrarEmpresa,
    getEmpresaById,
    getNotasFiscaisByEmpresa,
    createNotaFiscal,
    deleteEmpresa,
  };

  return (
    <EmpresasContext.Provider value={value}>
      {children}
    </EmpresasContext.Provider>
  );
};

// Export ApiProvider as an alias if desired, but keep it as a component export
export const ApiProvider = EmpresasProvider;

// Removed: export const useApi = ...
// Removed: export const EmpresasContextType = ... (if moved)