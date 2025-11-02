
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useApi } from '@/hooks/useApi';
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { EmpresaFormFields } from '@/components/loja-fisica/empresa/EmpresaFormFields';
import { NotaFiscalFormFields } from '@/components/loja-fisica/empresa/NotaFiscalFormFields';

import { EmpresaFormData as FormData } from '@/types/empresa';

const EmpresaList = () => {
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { getEmpresas, deleteEmpresa, cadastrarEmpresa } = useApi();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    defaultValues: {
      nome: '',
      endereco: '',
      telefone: '',
      email: '',
      cnpj: '',
      notaFiscal: {
        serie: '',
        numero: '',
        descricao: '',
        data: ''
      }
    }
  });

  const { data: empresas = [], isLoading } = useQuery({
    queryKey: ['companies', page],
    queryFn: getEmpresas,
  });

  console.log('Empresas buscadas:', empresas); // Adicione esta linha para depuração
  const totalPages = Math.ceil(empresas.length / 10);
  const paginatedEmpresas = empresas.slice((page - 1) * 10, page * 10);

  const deleteMutation = useMutation({
    mutationFn: deleteEmpresa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: "Empresa excluída com sucesso",
        description: "A empresa foi removida da lista.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir empresa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta empresa?')) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await cadastrarEmpresa(data);
      toast({
        title: "Empresa cadastrada com sucesso!",
        description: "A empresa e a nota fiscal foram registradas.",
      });
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar empresa",
        description: "Ocorreu um erro ao tentar cadastrar a empresa.",
      });
      console.error('Erro ao cadastrar empresa:', error);
    }
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de Empresas</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
              <DialogDescription>
                Preencha os dados da empresa e da nota fiscal.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <EmpresaFormFields form={form} />
                <NotaFiscalFormFields form={form} />
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Cadastrar</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {paginatedEmpresas.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEmpresas.map((empresa) => (
              <TableRow key={empresa.id}>
                <TableCell>{empresa.nome}</TableCell>
                <TableCell>{empresa.endereco}</TableCell>
                <TableCell>{empresa.telefone}</TableCell>
                <TableCell>{empresa.email}</TableCell>
                <TableCell>{empresa.cnpj}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button asChild variant="outline">
                      <a href={`/loja-fisica/empresas/${empresa.id}`}>Detalhes</a>
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleDelete(empresa.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-4">Nenhuma empresa encontrada</div>
      )}

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((old) => Math.max(old - 1, 1))}
                disabled={page === 1}
              >
                <PaginationPrevious />
              </Button>
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink 
                  onClick={() => setPage(i + 1)} 
                  isActive={page === i + 1}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((old) => Math.min(old + 1, totalPages))}
                disabled={page === totalPages}
              >
                <PaginationNext />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default EmpresaList;
