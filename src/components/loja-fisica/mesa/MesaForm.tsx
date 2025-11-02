import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MesaFormData } from '@/types';

const mesaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  status: z.enum(['Ocupada', 'Livre']),
  pedido: z.number().min(0, 'Número do pedido deve ser positivo')
});

interface MesaFormProps {
  onSubmit: (data: MesaFormData) => void;
  initialData?: MesaFormData;
}

const MesaForm = ({ onSubmit, initialData }: MesaFormProps) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<MesaFormData>({
    resolver: zodResolver(mesaSchema),
    defaultValues: initialData || {
      nome: '',
      status: 'Livre',
      pedido: 0
    }
  });

  const handleFormSubmit = (data: MesaFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome da Mesa</Label>
        <Input
          id="nome"
          {...register('nome')}
          placeholder="Ex: Mesa 01"
        />
        {errors.nome && (
          <p className="text-sm text-red-500 mt-1">{errors.nome.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          value={watch('status')}
          onValueChange={(value: 'Ocupada' | 'Livre') => setValue('status', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Livre">Livre</SelectItem>
            <SelectItem value="Ocupada">Ocupada</SelectItem>
          </SelectContent>
        </Select>
        {errors.status && (
          <p className="text-sm text-red-500 mt-1">{errors.status.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="pedido">Número do Pedido</Label>
        <Input
          id="pedido"
          type="number"
          {...register('pedido', { valueAsNumber: true })}
          placeholder="0"
        />
        {errors.pedido && (
          <p className="text-sm text-red-500 mt-1">{errors.pedido.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full">
        {initialData ? 'Atualizar Mesa' : 'Criar Mesa'}
      </Button>
    </form>
  );
};

export default MesaForm;
