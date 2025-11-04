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
import apiServices from '@/services/apiServices';
import { mapBackendProdutoToLocal } from '@/lib/productMapper';

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
    console.log('🔍 [CategoriaList] Iniciando carregamento de categorias...');
    const categoriasStoradas = categoriaStorage.getAll();
    console.log('📦 [CategoriaList] Categorias no localStorage:', categoriasStoradas);

    // Se não há categorias salvas, inicializar com categorias dos produtos (fallback)
    if (categoriasStoradas.length === 0) {
      console.log('⚠️ [CategoriaList] Nenhuma categoria encontrada, criando do zero...');
      const produtos = produtoStorage.getAll();
      console.log('📦 [CategoriaList] Produtos encontrados:', produtos.length);
      const categoriasUnicas = Array.from(
        new Set(produtos.map(produto => produto.categoria))
      ).filter(categoria => categoria && categoria.trim() !== '');
      console.log('📂 [CategoriaList] Categorias únicas extraídas:', categoriasUnicas);

      const categoriasIniciais = categoriasUnicas.map((nome, index) => ({
        id: index + 1,
        nome
      }));

      categoriaStorage.save(categoriasIniciais);
      setCategorias(categoriasIniciais);
      console.log('✅ [CategoriaList] Categorias iniciais criadas:', categoriasIniciais);
    } else {
      setCategorias(categoriasStoradas);
      console.log('✅ [CategoriaList] Categorias carregadas do localStorage');
    }
  }, []);

  // Sincroniza categorias com o backend ao montar
  useEffect(() => {
    const syncCategorias = async () => {
      console.log('🔄 [CategoriaList] Tentando sincronizar com backend...');
      try {
        const cats = await apiServices.categoriaService.getAll();
        console.log('🌐 [CategoriaList] Resposta do backend:', cats);
        if (cats && Array.isArray(cats)) {
          const catsTyped = cats as Categoria[];
          setCategorias(catsTyped);
          categoriaStorage.save(catsTyped);
          console.log('✅ [CategoriaList] Categorias sincronizadas com backend:', catsTyped.length);

          // Ao sincronizar categorias, tentar também sincronizar os produtos do backend
          try {
            const produtosBackend = await apiServices.produtoService.getAll();
            if (Array.isArray(produtosBackend) && produtosBackend.length > 0) {
              // mapear produtos do backend para a forma local usando as categorias recém carregadas
              // import mapBackendProdutoToLocal no topo do arquivo é necessário
              // usamos um array vazio para empresas (se necessário, melhorar depois)
              const mapped = (produtosBackend as unknown[]).map(p => mapBackendProdutoToLocal(p, catsTyped, []));
              produtoStorage.save(mapped);
              console.log('[CategoriaList] Produtos sincronizados do backend para localStorage:', mapped.length);
            }
          } catch (prodErr) {
            console.debug('[CategoriaList] Falha ao sincronizar produtos do backend (não bloqueia):', prodErr);
          }
        }
      } catch (err) {
        console.warn('❌ [CategoriaList] Erro ao sincronizar com backend:', err);
        console.debug('Não foi possível carregar categorias do backend, usando localStorage');
      }
    };
    void syncCategorias();
  }, []);

  const categoriasFiltradas = categorias.filter(categoria =>
    categoria.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProdutosPorCategoria = (categoria: Categoria) => {
    console.log(`🔍 [getProdutosPorCategoria] Buscando produtos para categoria:`, categoria);
    const produtos = produtoStorage.getAll();
    console.log(`📦 [getProdutosPorCategoria] Total de produtos no storage:`, produtos.length);
    
    const catName = String(categoria.nome || '');
    const catId = Number(categoria.id);
    console.log(`🏷️ [getProdutosPorCategoria] Procurando por - Nome: "${catName}", ID: ${catId}`);

    const produtosFiltrados = produtos.filter(produto => {
      // produto.categoria pode ser nome ou id (string/number) ou objeto
      const prod = produto as unknown as Record<string, unknown>;
      const prodCatRaw = prod['categoria'] ?? prod['categoriaId'] ?? prod['categoria_id'] ?? '';

      console.log(`  📝 Produto "${prod['nome']}" - categoria raw completa:`, JSON.stringify(prodCatRaw), `(tipo: ${typeof prodCatRaw})`);

      // PRIMEIRO: verificar se é um objeto (mais comum) — comparar por id então por nome (case-sensitive)
      if (typeof prodCatRaw === 'object' && prodCatRaw !== null) {
        const catObj = prodCatRaw as Record<string, unknown>;
        const objId = Number(catObj['id'] ?? 0);
        const objNome = String(catObj['nome'] ?? '');

        console.log(`    🔍 É objeto - nome: "${objNome}", id: ${objId}`);

        if (objId && objId === catId) {
          console.log(`    ✅ Match por objeto.id: ${objId} === ${catId}`);
          return true;
        }

        if (objNome && objNome === catName) {
          console.log(`    ✅ Match por objeto.nome: "${objNome}" === "${catName}"`);
          return true;
        }
      }

      // SEGUNDO: verificar se é string (nome da categoria) — usar igualdade exata (case-sensitive)
      const prodCatStr = String(prodCatRaw ?? '');
      if (prodCatStr && prodCatStr !== '[object Object]' && prodCatStr === catName) {
        console.log(`    ✅ Match por string nome: "${prodCatStr}" === "${catName}"`);
        return true;
      }

      // TERCEIRO: verificar se é número (id da categoria)
      const prodCatNum = Number(prodCatRaw);
      if (!isNaN(prodCatNum) && prodCatNum === catId) {
        console.log(`    ✅ Match por número ID: ${prodCatNum} === ${catId}`);
        return true;
      }

      console.log(`    ❌ Sem match`);
      return false;
    });
    
    console.log(`📊 [getProdutosPorCategoria] Resultado: ${produtosFiltrados.length} produto(s) encontrado(s) para "${categoria.nome}"`);
    return produtosFiltrados.length;
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
          const updated = await apiServices.categoriaService.update?.(editingCategoria.id, { nome: novaCategoria, descricao: '' }) ?? null;
          if (updated) {
            const updatedTyped = updated as Categoria;
            const atualizadas = categorias.map((cat) => cat.id === editingCategoria.id ? { ...cat, nome: updatedTyped.nome || novaCategoria } : cat);
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
          const created = await apiServices.categoriaService.create?.({ nome: novaCategoria, descricao: '' }) ?? null;
          if (created) {
            const createdTyped = created as Categoria;
            const atualizadas = [...categorias, createdTyped];
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
        await apiServices.categoriaService.delete?.(deletingCategoria.id);
        const atualizadas = categorias.filter(cat => cat.id !== deletingCategoria.id);
        setCategorias(atualizadas);
        categoriaStorage.save(atualizadas);
        setDeletingCategoria(null);
        return;
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