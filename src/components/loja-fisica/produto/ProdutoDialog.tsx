import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProdutoForm from '@/components/loja-fisica/produto/ProdutoForm';
import { CategoriaData } from '@/types/common';
import { Produto } from '@/data/produtos_locais';

import { ProdutoDialogProps } from '@/types/produto';

const ProdutoDialog = ({ 
  isOpen, 
  onOpenChange, 
  onSubmit, 
  empresas,
  categorias,
  initialData,
  slug,
}: ProdutoDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {!slug && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar' : 'Novo'} Produto</DialogTitle>
        </DialogHeader>
        <ProdutoForm 
          editingProduct={initialData}
          empresas={empresas}
          categorias={categorias}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProdutoDialog;

