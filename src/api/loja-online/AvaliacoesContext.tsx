// src/contexts/AvaliacoesProvider.tsx (ou o nome original do seu arquivo)
import React, { useState, ReactNode, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Avaliacao, AvaliacoesContextType } from '@/types/avaliacoes';
import { AvaliacoesContext } from '@/contexts/AvaliacoesContext';
import { avaliacoesStorage } from '@/services/storageService';
import apiServices from '@/services/apiServices';

export function AvaliacoesProvider({ children }: { children: ReactNode }) {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>(() => {
    return avaliacoesStorage.getItens();
  });

  const { toast } = useToast();

  useEffect(() => {
    avaliacoesStorage.saveItens(avaliacoes);
  }, [avaliacoes]);

  const avaliarProduto = (produtoId: number, rating: number, comentario?: string) => {
    setAvaliacoes((prev) => {
      const index = prev.findIndex((a) => a.produtoId === produtoId);
      const novaAvaliacao: Avaliacao = {
        produtoId,
        rating,
        comentario: comentario || undefined,
        dataAvaliacao: new Date().toISOString()
      };

      if (index >= 0) {
        const newAvaliacoes = [...prev];
        newAvaliacoes[index] = novaAvaliacao;
        return newAvaliacoes;
      }
      return [...prev, novaAvaliacao];
    });

    toast({
      title: "Produto avaliado!",
      description: `Você deu ${rating} estrelas para este produto.`,
    });

    // Enviar para o backend (fire-and-forget). Log no console para depuração.
    (async () => {
      const payload = { produtoId, rating, comentario };
      console.log('[avaliacoes] sending CREATE/UPDATE ->', payload);
      try {
        const json = await apiServices.avaliacaoService.create(payload);
        console.log('[avaliacoes] backend response (CREATE/UPDATE):', json);
      } catch (err) {
        console.error('[avaliacoes] error sending CREATE/UPDATE:', err);
      }
    })();
  };

  const removerAvaliacao = (produtoId: number) => {
    // Otimista: remove localmente
    setAvaliacoes((prev) => prev.filter((a) => a.produtoId !== produtoId));
    toast({
      title: "Avaliação removida",
      description: "Sua avaliação foi removida.",
    });

    // Enviar remoção para o backend
    (async () => {
      console.log('[avaliacoes] sending DELETE ->', { produtoId });
      try {
        const json = await apiServices.avaliacaoService.remove(produtoId);
        console.log('[avaliacoes] backend response (DELETE):', json);
      } catch (err) {
        console.error('[avaliacoes] error sending DELETE:', err);
      }
    })();
  };

  const getAvaliacao = (produtoId: number) => {
    return avaliacoes.find((a) => a.produtoId === produtoId)?.rating || 0;
  };

  const getComentario = (produtoId: number) => {
    return avaliacoes.find((a) => a.produtoId === produtoId)?.comentario || '';
  };

  const getAvaliacaoCompleta = (produtoId: number) => {
    return avaliacoes.find((a) => a.produtoId === produtoId);
  };

  const value = {
    avaliacoes,
    avaliarProduto,
    removerAvaliacao,
    getAvaliacao,
    getComentario,
    getAvaliacaoCompleta
  };

  return (
    <AvaliacoesContext.Provider value={value as AvaliacoesContextType}>
      {children}
    </AvaliacoesContext.Provider>
  );
}