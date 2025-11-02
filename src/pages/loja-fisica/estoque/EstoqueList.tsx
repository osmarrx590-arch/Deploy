import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { obterMovimentacoes, fetchMovimentacoesFromBackend, MovimentacaoEstoque } from '@/services/movimentacaoEstoqueService';
import { Calendar, Download, Filter } from 'lucide-react';
import EstoqueTable from '@/components/loja-fisica/estoque/EstoqueTable';

const EstoqueList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [origemFiltro, setOrigemFiltro] = useState<string>('todos');
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [sortConfig, setSortConfig] = useState<{ 
    key: string | null; 
    direction: 'ascending' | 'descending' 
  }>({ 
    key: 'data', 
    direction: 'descending' 
  });

  const ITEMS_PER_PAGE = 10;

  // Carregar movimentações ao montar o componente
  useEffect(() => {
    let mounted = true;

    const carregarMovimentacoesLocais = () => {
      const dados = obterMovimentacoes();
      if (mounted) setMovimentacoes(dados);
    };

    // Carrega dados locais primeiro (rápido)
    carregarMovimentacoesLocais();

    // Tenta buscar do backend e atualizar local se obtiver resultado
    (async () => {
      const remote = await fetchMovimentacoesFromBackend();
      if (mounted) setMovimentacoes(remote);
    })();

    // Atualizar a cada 10 segundos sincronizando com backend
    const interval = setInterval(async () => {
      const remote = await fetchMovimentacoesFromBackend();
      if (mounted) setMovimentacoes(remote);
    }, 10000);

    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Filtragem das movimentações
  const filteredMovimentacoes = movimentacoes.filter(movimentacao => {
    const matchesSearch = movimentacao.produtoNome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFiltro === 'todos' || movimentacao.tipo === tipoFiltro;
    const matchesOrigemFiltro = origemFiltro === 'todos' || movimentacao.origem === origemFiltro;
    
    return matchesSearch && matchesTipo && matchesOrigemFiltro;
  });

  // Ordenação das movimentações
  const sortedMovimentacoes = [...filteredMovimentacoes].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue: string | number | Date = a[sortConfig.key as keyof MovimentacaoEstoque];
    let bValue: string | number | Date = b[sortConfig.key as keyof MovimentacaoEstoque];
    
    // Tratamento especial para data
    if (sortConfig.key === 'data') {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }
    
    if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
    return 0;
  });

  // Paginação
  const totalPages = Math.ceil(sortedMovimentacoes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMovimentacoes = sortedMovimentacoes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Calcular estatísticas
  const totalEntradas = filteredMovimentacoes.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.quantidade, 0);
  const totalSaidas = filteredMovimentacoes.filter(m => m.tipo === 'saida').reduce((sum, m) => sum + m.quantidade, 0);
  // Contar cancelamentos através das observações das entradas
  const totalCancelamentos = filteredMovimentacoes.filter(m => 
    m.tipo === 'entrada' && m.observacoes?.toLowerCase().includes('cancelamento')
  ).reduce((sum, m) => sum + m.quantidade, 0);

  const exportarRelatorio = () => {
    const csvContent = [
      ['Produto', 'Data', 'Tipo', 'Quantidade', 'Origem', 'Referência', 'Observações'].join(','),
      ...sortedMovimentacoes.map(m => [
        m.produtoNome,
        new Date(m.data).toLocaleString(),
        m.tipo,
        m.quantidade,
        m.origem,
        m.referencia || '',
        m.observacoes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movimentacoes-estoque-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Movimentações de Estoque</h1>
        <Button onClick={exportarRelatorio} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Total de Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{totalEntradas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Total de Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{totalSaidas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Cancelamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{totalCancelamentos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Input
          type="text"
          placeholder="Buscar por produto..."
          value={searchTerm}
          onChange={handleSearch}
          className="cursor-pointer"
        />
        
        <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={origemFiltro} onValueChange={setOrigemFiltro}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as origens</SelectItem>
            <SelectItem value="produto_cadastro">Cadastro de Produto</SelectItem>
            <SelectItem value="venda_online">Venda Online</SelectItem>
            <SelectItem value="venda_fisica">Venda Física</SelectItem>
            <SelectItem value="cancelamento_venda_online">Cancelamento Venda Online</SelectItem>
            <SelectItem value="cancelamento_venda_fisica">Cancelamento Venda Física</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {filteredMovimentacoes.length} de {movimentacoes.length} registros
          </span>
        </div>
      </div>

      <EstoqueTable 
        movimentacoes={paginatedMovimentacoes}
        sortConfig={sortConfig}
        onRequestSort={requestSort}
      />

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className={`hover:cursor-pointer ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="hover:cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className={`hover:cursor-pointer ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default EstoqueList;
