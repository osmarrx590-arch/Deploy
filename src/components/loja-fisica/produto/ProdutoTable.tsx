import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { formataPreco } from '@/contexts/moeda';
import { ProdutoTableData } from '@/types/produto';

interface ProdutoTableProps {
  produtos: ProdutoTableData[];
  onEdit: (produto: ProdutoTableData) => void;
  onDelete: (id: number) => void;
  sortConfig?: {
    key: string | null;
    direction: 'ascending' | 'descending';
  };
  onRequestSort?: (key: string) => void;
}

const ProdutoTable = ({ produtos, onEdit, onDelete, sortConfig, onRequestSort }: ProdutoTableProps) => {
  const handleSort = (key: string) => {
    if (onRequestSort) {
      onRequestSort(key);
    }
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('nome')}
            >
              Nome {getSortIcon('nome')}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('categoria')}
            >
              Categoria {getSortIcon('categoria')}
            </TableHead>
            <TableHead>Código</TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('custo')}
            >
              Custo {getSortIcon('custo')}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('venda')}
            >
              Venda {getSortIcon('venda')}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('estoque')}
            >
              Estoque {getSortIcon('estoque')}
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {produtos.map((produto) => (
            <TableRow key={produto.id}>
              <TableCell className="font-medium">{produto.nome}</TableCell>
              <TableCell>{produto.categoria}</TableCell>
              <TableCell>{produto.codigo}</TableCell>
              <TableCell>{formataPreco(produto.custo)}</TableCell>
              <TableCell>{formataPreco(produto.venda)}</TableCell>
              <TableCell>{produto.estoque}</TableCell>
              <TableCell>
                <Badge variant={produto.disponivel ? "default" : "secondary"}>
                  {produto.disponivel ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(produto)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(produto.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProdutoTable;
