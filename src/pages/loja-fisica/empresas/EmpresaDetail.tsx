import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useApi } from '@/hooks/useApi';
import { NotaFiscalData } from '@/types/common'; // NotaFiscalData is used in TableBody, keep it.
// Ensure CriarNotaFiscalData is imported if you're using it directly from types,
// or use it implicitly via useApi's createNotaFiscal signature.

import { NotaFiscalFormData } from '@/types/empresa';

const EmpresaDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // ✨ Type updated to new NotaFiscalFormData ✨
  const form = useForm<NotaFiscalFormData>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { getEmpresaById, getNotasFiscaisByEmpresa, createNotaFiscal } = useApi();

  const empresaId = id ? parseInt(id, 10) : 0;

  const { data: empresa, isLoading: isLoadingEmpresa, error: empresaError } = useQuery({
    queryKey: ['company', empresaId],
    queryFn: () => getEmpresaById(empresaId),
    enabled: !!empresaId
  });

  const { data: notas = [], isLoading: isLoadingNotas } = useQuery({
    queryKey: ['notas', empresaId],
    queryFn: () => getNotasFiscaisByEmpresa(empresaId),
    enabled: !!empresaId && !!empresa
  });

  const createNotaFiscalMutation = useMutation({
    // mutationFn now receives the correctly typed data
    mutationFn: (data: NotaFiscalFormData) => createNotaFiscal({
      ...data,
      empresaId: empresaId,
      data: data.data, // Data de emissão
      serie: data.serie || '1', // Default series if not provided
      descricao: data.descricao // Now directly matches the name
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notas', empresaId] });
      queryClient.invalidateQueries({ queryKey: ['company', empresaId] });
      toast({
        title: "Nota fiscal cadastrada com sucesso",
        description: "A nova nota fiscal foi adicionada à lista.",
      });
      form.reset();
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      console.error('Erro ao criar nota fiscal:', error);
      toast({
        title: "Erro ao cadastrar nota fiscal",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NotaFiscalFormData) => {
    console.log('Dados da nota fiscal:', data);
    createNotaFiscalMutation.mutate(data);
  };

  // ... (rest of the component remains the same)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ... existing code ... */}

      <div className="flex justify-between items-center mt-8 mb-4">
        <h2 className="text-xl font-semibold">Notas Fiscais ({notas.length})</h2>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>Cadastrar Nota Fiscal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Nota Fiscal</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="serie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Série</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: A1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: 000123" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* ✨ RENAMED 'name' from 'descricao' to 'observacoes' ✨ */}
                <FormField
                  control={form.control}
                  name="descricao" // Changed from 'descricao'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel> {/* Label might change too */}
                      <FormControl>
                        <Input {...field} placeholder="Observações da nota fiscal (opcional)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* ✨ RENAMED 'name' from 'data' to 'dataEmissao' ✨ */}
                <FormField
                  control={form.control}
                  name="data" // Changed from 'data'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Emissão</FormLabel> {/* Label might change too */}
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createNotaFiscalMutation.isPending}>
                  {createNotaFiscalMutation.isPending ? 'Cadastrando...' : 'Cadastrar'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ... existing table display code ... */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Série</TableHead>
                <TableHead className="text-center">Número</TableHead>
                <TableHead className="text-center">Descrição</TableHead>
                <TableHead className="text-center">Data de Emissão</TableHead> {/* Changed label */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {notas.length > 0 ? (
                notas.map((nota: NotaFiscalData) => (
                  <TableRow key={nota.id}>
                    <TableCell className="text-center">{nota.serie}</TableCell>
                    <TableCell className="text-center">{nota.numero}</TableCell>
                    <TableCell className="text-center">{nota.descricao}</TableCell>
                    <TableCell className="text-center">
                      {new Date(nota.data).toLocaleDateString('pt-BR')} {/* Still uses nota.data from NotaFiscalData */}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500"> {/* colspan updated */}
                    Nenhuma nota fiscal encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmpresaDetail;

