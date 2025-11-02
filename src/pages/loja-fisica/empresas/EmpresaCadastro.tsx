import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useApi } from '@/hooks/useApi';
import { EmpresaFormFields } from '@/components/loja-fisica/empresa/EmpresaFormFields';
import { NotaFiscalFormFields } from '@/components/loja-fisica/empresa/NotaFiscalFormFields';

import { EmpresaFormData as FormData } from '@/types/empresa';

const EmpresaCadastro = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { cadastrarEmpresa } = useApi();

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

  const onSubmit = async (data: FormData) => {
    try {
      await cadastrarEmpresa(data);
      toast({
        title: "Empresa cadastrada com sucesso!",
        description: "A empresa e a nota fiscal foram registradas.",
      });
      navigate('/loja-fisica/empresas');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar empresa",
        description: "Ocorreu um erro ao tentar cadastrar a empresa.",
      });
      console.error('Erro ao cadastrar empresa:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Cadastro de Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <EmpresaFormFields form={form} />
              <NotaFiscalFormFields form={form} />
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/loja-fisica/empresas')}
                >
                  Cancelar
                </Button>
                <Button type="submit">Cadastrar</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmpresaCadastro;