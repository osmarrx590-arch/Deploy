import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { produtoStorage, categoriaStorage } from '@/services/storageService';
import { produtoService } from '@/services/apiServices';
import { useApi } from '@/hooks/useApi';
import ProdutoTable from '@/components/loja-fisica/produto/ProdutoTable';
import ProdutoDialog from '@/components/loja-fisica/produto/ProdutoDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { PlusCircleIcon, SlidersHorizontal, Loader2 } from "lucide-react";
import { Produto, ProdutoTableData } from '@/types/produto';
import { mapBackendProdutoToLocal } from '@/lib/productMapper';

import { EmpresaData } from '@/types/empresa';
import { ProdutoFormSubmitData } from '@/types/produto';

const ListarProdutos = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('todas');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [deletingprodutoId, setDeletingprodutoId] = useState<number | null>(null);
  const { toast } = useToast();
  const { getEmpresas } = useApi();
  const [empresas, setEmpresas] = useState<EmpresaData[]>([]);
  const [categorias, setCategorias] = useState(categoriaStorage.getAll());
  const navigate = useNavigate();
  const { slug } = useParams();
  const ITEMS_PER_PAGE = 5;
  const queryClient = useQueryClient();
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'ascending' | 'descending';
  }>({
    key: null,
    direction: 'ascending'
  });

  const { data: produtos = [], isFetching: isFetchingProdutos } = useQuery({
    queryKey: ['produtos'],
    // Carregar do backend primeiro; se falhar, usar fallback do localStorage
    queryFn: async () => {
      try {
        const ps = await produtoService.getAll();
        const categoriasLocal = categoriaStorage.getAll();
        const mapped = ps.map(p => mapBackendProdutoToLocal(p, categoriasLocal, empresas));
        produtoStorage.save(mapped);
        return mapped;
      } catch (err) {
        return produtoStorage.getAll();
      }
    },
  });

  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterEstoque, setFilterEstoque] = useState('');
  const [loading, setLoading] = useState(false);

  const uniqueCategorias = Array.from(new Set(categorias.map(c => c.nome)));

  const clearFilters = () => {
    setFilterCategoria('');
    setFilterEstoque('');
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchEmpresas = async () => {
      const empresasData = await getEmpresas();
      if (empresasData.length === 0) {
        setEmpresas([{ id: 1, nome: 'Empresa Padrão' }]);
      } else {
        setEmpresas(empresasData);
      }
    };
    fetchEmpresas();
  }, [getEmpresas]);

  // Carregar categorias do backend para resolver categoria_id -> nome
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        // Tenta usar storageService local (já no useState) como fallback
        const res = await fetch((import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000') + '/categorias/');
        if (res.ok) {
          const cats = await res.json();
          // cats deve ser array de { id, nome, descricao }
          setCategorias(cats);
          // salvar no localStorage também
          categoriaStorage.save(cats);
        }
      } catch (err) {
        // fallback: manter categorias do localStorage (já em state)
        console.debug('Falha ao carregar categorias do backend, usando localStorage');
      }
    };
    fetchCategorias();
  }, []);

  useEffect(() => {
    if (slug) {
      const produto = produtos.find(p => p.id === Number(slug));
      if (produto) {
        setEditingProduto(produto);
        setIsDialogOpen(true);
      }
    }
  }, [slug, produtos]);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduto(null);
    if (slug) {
      navigate('/loja-fisica/produtos');
    }
  };

  // Filtro de produtos considerando categoria e estoque
  const filteredProdutos = produtos.filter((produto: Produto) => {
    const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.descricao.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategoria = !filterCategoria || produto.categoria === filterCategoria;

    let matchesEstoque = true;
    if (filterEstoque === "baixo") matchesEstoque = produto.estoque < 10;
    else if (filterEstoque === "medio") matchesEstoque = produto.estoque >= 10 && produto.estoque <= 50;
    else if (filterEstoque === "alto") matchesEstoque = produto.estoque > 50;

    return matchesSearch && matchesCategoria && matchesEstoque;
  });

  const sortedProdutos = [...filteredProdutos].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key as keyof Produto];
    const bValue = b[sortConfig.key as keyof Produto];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortConfig.direction === 'ascending' ? comparison : -comparison;
    }

    if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedProdutos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  
  const paginatedProdutos: ProdutoTableData[] = sortedProdutos.slice(startIndex, startIndex + ITEMS_PER_PAGE).map(produto => ({
    id: produto.id,
    nome: produto.nome,
    categoria: produto.categoria,
    descricao: produto.descricao,
    custo: produto.custo,
    venda: produto.venda,
    codigo: produto.codigo,
    estoque: produto.estoque,
    disponivel: produto.disponivel,
    empresaId: produto.empresaId,
    empresa: empresas.find(emp => emp.id === produto.empresaId)?.nome || 'Empresa não encontrada',
    imagem: produto.imagem
  }));

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleSearchClick = () => {
    setCurrentPage(1);
    toast({
      description: searchTerm ? `Pesquisando por "${searchTerm}"` : "Mostrando todos os produtos",
    });
  };

  const handleCategoriaChange = (value: string) => {
    setSelectedCategoria(value);
    setCurrentPage(1);
  };

  const handleEdit = (produto: ProdutoTableData) => {
    navigate(`/loja-fisica/produtos/${produto.id}`);
  };

  const handleDelete = (id: number) => {
    setDeletingprodutoId(id);
  };

  const confirmDelete = async () => {
    if (deletingprodutoId === null) return;
    const id = deletingprodutoId;
    setLoading(true);
    try {
      // Deletar no backend
      await produtoService.delete(id);

      // Recarregar produtos (query será refetch e sincronizará o localStorage via queryFn)
      queryClient.invalidateQueries({ queryKey: ['produtos'] });

      toast({ description: 'O produto foi removido com sucesso.' });
    } catch (error: unknown) {
      const message = (() => {
        if (typeof error === 'object' && error !== null && 'message' in error) {
          const m = (error as { message?: unknown }).message;
          if (typeof m === 'string') return m;
        }
        return String(error);
      })();
      toast({ variant: 'destructive', description: `Não foi possível remover o produto no servidor: ${message || 'erro de rede'}` });
    } finally {
      setLoading(false);
      setDeletingprodutoId(null);
    }
  };

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleSubmit = async (data: ProdutoFormSubmitData) => {
    try {
      // Build payload matching backend ProdutoIn model (categoria_id, empresa_id)
      if (editingProduto) {
        const payload = {
          nome: data.nome,
          categoria_id: Number(data.categoria),
          descricao: data.descricao || '',
          custo: Number(data.custo || 0),
          venda: Number(data.venda || 0),
          codigo: data.codigo || '',
          estoque: Number(data.estoque || 0),
          disponivel: data.disponivel ?? true,
          empresa_id: Number(data.empresaId),
          imagem: data.imagem || editingProduto.imagem || '',
          slug: data.nome.toLowerCase().replace(/\s+/g, '-'),
        };

  await produtoService.update(editingProduto.id, payload);
        queryClient.invalidateQueries({ queryKey: ['produtos'] });
        setEditingProduto(null);
        toast({ description: `O produto "${data.nome}" foi atualizado com sucesso.` });
      } else {
        const payload = {
          nome: data.nome,
          categoria_id: Number(data.categoria),
          descricao: data.descricao || '',
          custo: Number(data.custo || 0),
          venda: Number(data.venda || 0),
          codigo: data.codigo || '',
          estoque: Number(data.estoque || 0),
          disponivel: data.disponivel ?? true,
          empresa_id: Number(data.empresaId),
          imagem: data.imagem || '',
          slug: data.nome.toLowerCase().replace(/\s+/g, '-'),
        };

  await produtoService.create(payload);
        queryClient.invalidateQueries({ queryKey: ['produtos'] });
        toast({ description: `O produto "${data.nome}" foi cadastrado com sucesso.` });
      }

      // Close dialog after success
      handleCloseDialog();
    } catch (error: unknown) {
      const message = (() => {
        if (typeof error === 'object' && error !== null && 'message' in error) {
          const m = (error as { message?: unknown }).message;
          if (typeof m === 'string') return m;
        }
        return String(error);
      })();

      toast({
        variant: "destructive",
        description: message || "Ocorreu um erro ao tentar salvar o produto.",
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Lista de Produtos</CardTitle>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircleIcon className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-gray-200">
                  <div className="p-2">
                    <Label className="text-sm font-medium">Categoria</Label>
                    <select
                      value={filterCategoria}
                      onChange={(e) => {
                        setFilterCategoria(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full mt-1 p-2 text-sm rounded border border-gray-300 bg-orange-50"
                    >
                      <option value="">Todas Categorias</option>
                      {uniqueCategorias.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    
                    <Label className="text-sm font-medium mt-2 block">Estoque</Label>
                    <select
                      value={filterEstoque}
                      onChange={(e) => {
                        setFilterEstoque(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full mt-1 p-2 text-sm rounded border border-gray-300 bg-orange-50"
                    >
                      <option value="">Todos Níveis</option>
                      <option value="baixo">Baixo (&lt; 10)</option>
                      <option value="medio">Médio (10-50)</option>
                      <option value="alto">Alto (&gt; 50)</option>
                    </select>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      className="w-full mt-2"
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <ProdutoTable 
                produtos={paginatedProdutos} 
                onEdit={handleEdit}
                onDelete={handleDelete}
                sortConfig={sortConfig}
                onRequestSort={requestSort}
              />
              
              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        className={`hover:cursor-pointer ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}

              {paginatedProdutos.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  {searchTerm || filterCategoria || filterEstoque ? 
                    'Nenhum produto encontrado com os filtros selecionados.' : 
                    'Nenhum produto disponível.'}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ProdutoDialog
        isOpen={isDialogOpen}
        onOpenChange={handleCloseDialog}
        onSubmit={handleSubmit}
        empresas={empresas}
        categorias={categorias}
        initialData={editingProduto}
        slug={slug}
      />

      <AlertDialog open={deletingprodutoId !== null} onOpenChange={() => setDeletingprodutoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ListarProdutos;

