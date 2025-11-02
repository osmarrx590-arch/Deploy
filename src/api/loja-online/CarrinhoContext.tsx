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

    return true;
  };

  const limparCarrinho = () => {
    carrinho.forEach(item => {
      liberarReservaEstoque(item.id, item.quantidade, 'carrinho');
    });

    setCarrinho([]);
    setCupom(null);
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

