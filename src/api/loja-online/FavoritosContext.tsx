// src/contexts/FavoritosProvider.tsx (ou o nome original do seu arquivo)
import React, { useState, ReactNode, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Produto } from '@/types/produto';
import { FavoritosContextType } from '@/types/favoritos';
import { FavoritosContext } from '@/contexts/FavoritosContext';
import { favoritosStorage } from '@/services/storageService';

export function FavoritosProvider({ children }: { children: ReactNode }) {
  const [favoritos, setFavoritos] = useState<Produto[]>(() => {
    return favoritosStorage.getItens();
  });

  const { toast } = useToast();

  const toggleFavorito = (produto: Produto) => {
    if (isFavorito(produto.id)) {
      removerFavorito(produto.id);
    } else {
      adicionarFavorito(produto);
    }
  };

  const adicionarFavorito = (produto: Produto) => {
    // Otimista: atualiza UI primeiro
    setFavoritos((prev) => [...prev, produto]);
    toast({
      title: "Produto favoritado!",
      description: `${produto.nome} foi adicionado aos seus favoritos.`,
    });

    // Enviar para o backend (fire-and-forget). Log no console para depuração.
    (async () => {
      const payload = { produtoId: produto.id };
      console.log('[favoritos] sending CREATE ->', payload);
      try {
        const res = await fetch('/favoritos/', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        let json = null;
        try { json = await res.json(); } catch (e) { /* ignore */ }
        console.log('[favoritos] backend response (CREATE):', res.status, json);
      } catch (err) {
        console.error('[favoritos] error sending CREATE:', err);
      }
    })();
  };

  const removerFavorito = (produtoId: number) => {
    // Otimista: atualiza UI primeiro
    setFavoritos((prev) => prev.filter((p) => p.id !== produtoId));
    toast({
      title: "Produto removido!",
      description: "Produto removido dos seus favoritos.",
    });

    // Enviar remoção para o backend
    (async () => {
      console.log('[favoritos] sending DELETE ->', { produtoId });
      try {
        const res = await fetch(`/favoritos/${produtoId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        let json = null;
        try { json = await res.json(); } catch (e) { /* ignore */ }
        console.log('[favoritos] backend response (DELETE):', res.status, json);
      } catch (err) {
        console.error('[favoritos] error sending DELETE:', err);
      }
    })();
  };

  const isFavorito = (produtoId: number) => {
    return favoritos.some((p) => p.id === produtoId);
  };

  useEffect(() => {
    favoritosStorage.saveItens(favoritos);
  }, [favoritos]);

  const value: FavoritosContextType = {
    favoritos,
    toggleFavorito,
    isFavorito,
    removerFavorito,
    adicionarFavorito
  };

  return (
    <FavoritosContext.Provider value={value}>
      {children}
    </FavoritosContext.Provider>
  );
}