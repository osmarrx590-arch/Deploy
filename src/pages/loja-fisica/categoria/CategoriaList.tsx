import { Edit, Plus, Trash2, ArrowUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { produtosLocais } from '@/data/produtos_locais';
import { produtoStorage } from '@/services/storageService';
import { categoriaStorage } from '@/services/storageService';
import { Categoria } from '@/types/categoria';

const ITEMS_PER_PAGE = 5;

const CategoriaList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'ascending' | 'descending';
  }>({ 
    key: null, 
    direction: 'ascending' 
  });
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [deletingCategoria, setDeletingCategoria] = useState<Categoria | null>(null);

  useEffect(() => {
    const categoriasStoradas = categoriaStorage.getAll();

    // Se não há categorias salvas, inicializar com categorias dos produtos (fallback)
    if (categoriasStoradas.length === 0) {
      const produtos = produtoStorage.getAll();
      const categoriasUnicas = Array.from(
        new Set(produtos.map(produto => produto.categoria))
      ).filter(categoria => categoria && categoria.trim() !== '');

      const categoriasIniciais = categoriasUnicas.map((nome, index) => ({
        id: index + 1,
        nome
      }));

      categoriaStorage.save(categoriasIniciais);
      setCategorias(categoriasIniciais);
    } else {
      setCategorias(categoriasStoradas);
    }
  }, []);

  // Backend base URL
  const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

  // Sincroniza categorias com o backend ao montar
  useEffect(() => {
    const syncCategorias = async () => {
      try {
        const res = await fetch(`${backendUrl}/categorias/`);
        if (res.ok) {
          const cats = await res.json();
          setCategorias(cats);
          categoriaStorage.save(cats);
        }
      } catch (err) {
        console.debug('Não foi possível carregar categorias do backend, usando localStorage');
      }
    };
    void syncCategorias();
  }, [backendUrl]);

  const categoriasFiltradas = categorias.filter(categoria =>
    categoria.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProdutosPorCategoria = (categoria: Categoria) => {
    const produtos = produtoStorage.getAll();
    return produtos.filter(produto =>
      (produto.categoria || 'Sem Categoria') === categoria.nome
    ).length;
  };

  const handleOpenDialog = (categoria?: Categoria) => {
    setEditingCategoria(categoria || null);
    setNovaCategoria(categoria ? categoria.nome : '');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNovaCategoria('');
    setEditingCategoria(null);
  };

  const handleSaveCategoria = () => {
    if (novaCategoria.trim().length < 3) {
      alert("O nome da categoria deve ter pelo menos 3 caracteres.");
      return;
    }
    if (
      categorias.some(
        (cat) =>
          cat.nome.toLowerCase() === novaCategoria.toLowerCase() &&
          (!editingCategoria || cat.id !== editingCategoria.id)
      )
    ) {
      alert("Esta categoria já existe.");
      return;
    }

    const performSave = async () => {
      if (editingCategoria) {
        // Tenta atualizar no backend
        try {
          const res = await fetch(`${backendUrl}/categorias/${editingCategoria.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: novaCategoria, descricao: '' })
          });
          if (res.ok) {
            const updated = await res.json();
            const atualizadas = categorias.map((cat) => cat.id === editingCategoria.id ? { ...cat, nome: updated.nome } : cat);
            setCategorias(atualizadas);
            categoriaStorage.save(atualizadas);
            handleCloseDialog();
            return;
          }
        } catch (err) {
          console.debug('PUT /categorias falhou, utilizando fallback local');
        }

        // fallback local
        const atualizadas = categorias.map((cat) => cat.id === editingCategoria.id ? { ...cat, nome: novaCategoria } : cat);
        setCategorias(atualizadas);
        categoriaStorage.save(atualizadas);
      } else {
        // Criar categoria no backend
        try {
          const res = await fetch(`${backendUrl}/categorias/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: novaCategoria, descricao: '' })
          });
          if (res.ok) {
            const created = await res.json();
            const atualizadas = [...categorias, created];
            setCategorias(atualizadas);
            categoriaStorage.save(atualizadas);
            handleCloseDialog();
            return;
          }
        } catch (err) {
          console.debug('POST /categorias falhou, utilizando fallback local');
        }

        // fallback local
        const nova = { id: Date.now(), nome: novaCategoria };
        const atualizadas = [...categorias, nova];
        setCategorias(atualizadas);
        categoriaStorage.save(atualizadas);
      }
      handleCloseDialog();
    };

    void performSave();
  };

  const handleDeleteCategoria = (categoria: Categoria) => {
    setDeletingCategoria(categoria);
  };

  const confirmDelete = () => {
    if (!deletingCategoria) return;
    const produtosNaCategoria = getProdutosPorCategoria(deletingCategoria);
    if (produtosNaCategoria > 0) {
      alert("Não é possível excluir uma categoria que possui produtos.");
      setDeletingCategoria(null);
      return;
    }

    const performDelete = async () => {
      try {
        const res = await fetch(`${backendUrl}/categorias/${deletingCategoria.id}`, { method: 'DELETE' });
        if (res.ok) {
          const atualizadas = categorias.filter(cat => cat.id !== deletingCategoria.id);
          setCategorias(atualizadas);
          categoriaStorage.save(atualizadas);
          setDeletingCategoria(null);
          return;
        }
      } catch (err) {
        console.debug('DELETE /categorias falhou, utilizando fallback local');
      }

      // fallback local
      const atualizadas = categorias.filter(cat => cat.id !== deletingCategoria.id);
      setCategorias(atualizadas);
      categoriaStorage.save(atualizadas);
      setDeletingCategoria(null);
    };

    void performDelete();
  };

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedCategorias = [...categoriasFiltradas].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue, bValue;

    if (sortConfig.key === 'produtos') {
      aValue = getProdutosPorCategoria(a);
      bValue = getProdutosPorCategoria(b);
    } else {
      aValue = a[sortConfig.key as keyof Categoria];
      bValue = b[sortConfig.key as keyof Categoria];
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortConfig.direction === 'ascending' ? comparison : -comparison;
    }

    if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedCategorias.length / ITEMS_PER_PAGE);
  const paginatedItems = sortedCategorias.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const SortableTableHead = ({
    children,
    sortKey,
    className = "",
  }: {
    children: React.ReactNode;
    sortKey: string;
    className?: string;
  }) => (
    <TableHead className={className}>
      <Button
        variant="ghost"
        onClick={() => requestSort(sortKey)}
        className="w-full justify-start font-bold hover:text-primary/80"
      >
        {children}
      </Button>
    </TableHead>
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Categorias</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Buscar categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead sortKey="nome">Nome da Categoria</SortableTableHead>
              <SortableTableHead sortKey="produtos" className="text-center">Quantidade de Produtos</SortableTableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((categoria) => (
              <TableRow key={categoria.id}>
                <TableCell>{categoria.nome}</TableCell>
                <TableCell className="text-center">
                  {getProdutosPorCategoria(categoria)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(categoria)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteCategoria(categoria)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : 'hover:cursor-pointer'}`}
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
                className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'hover:cursor-pointer'}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Modal de adicionar/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nome da categoria"
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              className="w-full"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveCategoria()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategoria}>
              {editingCategoria ? 'Salvar Alterações' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={!!deletingCategoria} onOpenChange={(open) => !open && setDeletingCategoria(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{deletingCategoria?.nome}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default CategoriaList;