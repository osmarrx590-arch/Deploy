
import React from 'react';
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MovimentacaoEstoque } from '@/services/movimentacaoEstoqueService';
import EstoqueTableHeader from './EstoqueTableHeader';

interface EstoqueTableProps {
  movimentacoes: MovimentacaoEstoque[];
  sortConfig: {
    key: string | null;
    direction: 'ascending' | 'descending';
  };
  onRequestSort: (key: string) => void;
}

const EstoqueTable: React.FC<EstoqueTableProps> = ({ 
  movimentacoes, 
  sortConfig, 
  onRequestSort 
}) => {
  const getTipoVariant = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return 'default';
      case 'saida':
        return 'destructive';
      case 'cancelamento':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getOrigemLabel = (origem: string) => {
    const labels = {
      'produto_cadastro': 'Cadastro',
      'venda_online': 'Venda Online',
      'venda_fisica': 'Venda Física',
      'cancelamento_pedido': 'Cancelamento Pedido',
      'cancelamento_carrinho': 'Cancelamento Carrinho'
    };
    return labels[origem as keyof typeof labels] || origem;
  };

  const getTipoLabel = (tipo: string) => {
    const labels = {
      'entrada': 'Entrada',
      'saida': 'Saída',
      'cancelamento': 'Cancelamento'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <EstoqueTableHeader 
          onRequestSort={onRequestSort} 
          sortConfig={sortConfig} 
        />
        <TableBody>
          {movimentacoes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Nenhuma movimentação encontrada
              </TableCell>
            </TableRow>
          ) : (
            movimentacoes.map((movimentacao) => (
              <TableRow key={movimentacao.id} className="border-b transition-colors hover:bg-muted/50">
                <TableCell className="font-medium">{movimentacao.produtoNome}</TableCell>
                <TableCell>{new Date(movimentacao.data).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>
                  <Badge variant={getTipoVariant(movimentacao.tipo)}>
                    {getTipoLabel(movimentacao.tipo)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-semibold">{movimentacao.quantidade}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {getOrigemLabel(movimentacao.origem)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {movimentacao.referencia || '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                  {movimentacao.observacoes || '-'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default EstoqueTable;
