
import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from 'lucide-react';

interface EstoqueTableHeaderProps {
  onRequestSort: (key: string) => void;
  sortConfig: {
    key: string | null;
    direction: 'ascending' | 'descending';
  };
}

const EstoqueTableHeader = ({ onRequestSort, sortConfig }: EstoqueTableHeaderProps) => {
  const SortableTableHead = ({ children, sortKey }: { children: React.ReactNode; sortKey: string }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => onRequestSort(sortKey)}
        className="w-full justify-start font-bold hover:text-primary/80"
      >
        {children}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  );

  return (
    <TableHeader>
      <TableRow>
        <SortableTableHead sortKey="produtoNome">Produto</SortableTableHead>
        <SortableTableHead sortKey="data">Data</SortableTableHead>
        <SortableTableHead sortKey="tipo">Tipo</SortableTableHead>
        <SortableTableHead sortKey="quantidade">Quantidade</SortableTableHead>
        <SortableTableHead sortKey="origem">Origem</SortableTableHead>
        <TableHead>Referência</TableHead>
        <TableHead>Observações</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default EstoqueTableHeader;
