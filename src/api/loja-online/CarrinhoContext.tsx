// src/contexts/CarrinhoProvider.tsx (ou o nome original do seu arquivo)
import React, { useState, useEffect } from 'react';
import { reservarEstoque, liberarReservaEstoque, getEstoqueDisponivel } from '@/services/estoqueReservaService';
import { Produto, ItemCarrinho } from '@/types/produto';
import { CarrinhoContextData } from '@/types/carrinho';
import { CarrinhoContext } from '@/contexts/CarrinhoContext';
import { carrinhoStorage } from '@/services/storageService';

export function CarrinhoProvider({ children }: { children: React.ReactNode }) {
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>(() => {
    return carrinhoStorage.getItens();
  });

  const [cupom, setCupom] = useState<{ nome: string; desconto: number } | null>(() => {
    return carrinhoStorage.getCupom();
  });

  useEffect(() => {
    carrinhoStorage.saveItens(carrinho);
  }, [carrinho]);

  useEffect(() => {
    carrinhoStorage.saveCupom(cupom);
  }, [cupom]);

  const adicionarAoCarrinho = (produto: Produto): boolean => {
    const itemExistente = carrinho.find(item => item.id === produto.id);
    const quantidadeAtual = itemExistente?.quantidade || 0;
    const novaQuantidade = quantidadeAtual + 1;

    const estoqueDisponivel = getEstoqueDisponivel(produto.id);
    if (estoqueDisponivel < novaQuantidade) {
      console.warn(`Estoque insuficiente para ${produto.nome}. Disponível: ${estoqueDisponivel}`);
      return false;
    }

    if (!reservarEstoque(produto.id, 1, 'carrinho')) {
      return false;
    }

    setCarrinho(carrinhoAtual => {
      if (itemExistente) {
        return carrinhoAtual.map(item =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...carrinhoAtual, { ...produto, quantidade: 1 }];
    });

    // Fire-and-forget: sincronizar com backend
    (async () => {
      try {
        await fetch('/carrinho/items', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ produtoId: produto.id, quantidade: 1 }),
        });
      } catch (err) {
        console.debug('Erro ao sincronizar item do carrinho com backend:', err);
      }
    })();

    return true;
  };

  const removerDoCarrinho = (produtoId: number) => {
    const itemRemovido = carrinho.find(item => item.id === produtoId);
    if (itemRemovido) {
      liberarReservaEstoque(produtoId, itemRemovido.quantidade, 'carrinho');
    }

    setCarrinho(carrinhoAtual =>
      carrinhoAtual.filter(item => item.id !== produtoId)
    );

    // Fire-and-forget: informar backend
    (async () => {
      try {
        await fetch(`/carrinho/items/${produtoId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
      } catch (err) {
        console.debug('Erro ao remover item do carrinho no backend:', err);
      }
    })();
  };

  const atualizarQuantidade = (produtoId: number, quantidade: number): boolean => {
    if (quantidade < 1) {
      removerDoCarrinho(produtoId);
      return true;
    }

    const itemAtual = carrinho.find(item => item.id === produtoId);
    if (!itemAtual) return false;

    const diferenca = quantidade - itemAtual.quantidade;

    if (diferenca > 0) {
      if (!reservarEstoque(produtoId, diferenca, 'carrinho')) {
        return false;
      }
    } else if (diferenca < 0) {
      liberarReservaEstoque(produtoId, Math.abs(diferenca), 'carrinho');
    }

    setCarrinho(carrinhoAtual =>
      carrinhoAtual.map(item =>
        item.id === produtoId
          ? { ...item, quantidade }
          : item
      )
    );

    // Fire-and-forget: enviar atualização ao backend (substituir carrinho item quantidade)
    (async () => {
      try {
        // simplificar: reenviar todo o carrinho ao backend
        await fetch('/carrinho/', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itens: carrinho.map(i => ({ produtoId: i.id, quantidade: i.quantidade })) }),
        });
      } catch (err) {
        console.debug('Erro ao atualizar carrinho no backend:', err);
      }
    })();
    return true;
  };

  const limparCarrinho = () => {
    carrinho.forEach(item => {
      liberarReservaEstoque(item.id, item.quantidade, 'carrinho');
    });

    setCarrinho([]);
    setCupom(null);

    (async () => {
      try {
        // substituir por carrinho vazio
        await fetch('/carrinho/', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itens: [] }),
        });
      } catch (err) {
        console.debug('Erro ao limpar carrinho no backend:', err);
      }
    })();
  };

  const subtotalCarrinho = carrinho.reduce(
    (total, item) => total + item.venda * item.quantidade,
    0
  );

  const descontoCupom = cupom ? subtotalCarrinho * (cupom.desconto / 100) : 0;
  const totalCarrinho = subtotalCarrinho - descontoCupom;
  const quantidadeItens = carrinho.reduce((total, item) => total + item.quantidade, 0);

  const aplicarCupom = (codigo: string) => {
    const cupons = {
      'PRIMEIRA10': { nome: 'PRIMEIRA10', desconto: 10 },
      'CHOPP20': { nome: 'CHOPP20', desconto: 20 },
    };

    const cupomEncontrado = cupons[codigo as keyof typeof cupons];
    if (cupomEncontrado) {
      setCupom(cupomEncontrado);
    }
  };

  const removerCupom = () => {
    setCupom(null);
  };

  const value: CarrinhoContextData = {
    carrinho,
    adicionarAoCarrinho,
    removerDoCarrinho,
    atualizarQuantidade,
    limparCarrinho,
    totalCarrinho,
    subtotalCarrinho,
    quantidadeItens,
    descontoCupom,
    cupom,
    aplicarCupom,
    removerCupom,
    getEstoqueDisponivel,
  };

  return (
    <CarrinhoContext.Provider value={value}>
      {children}
    </CarrinhoContext.Provider>
  );
}

