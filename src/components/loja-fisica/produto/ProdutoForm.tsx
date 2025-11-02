
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Produto, ProdutoFormData as ProdutoFormType } from '@/types/produto';
import { produtoStorage } from '@/services/storageService';
import { useToast } from "@/components/ui/use-toast"
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { registrarEntrada } from '@/services/movimentacaoEstoqueService';
import { produtoService } from '@/services/apiServices';
import { resolveCategoryName } from '@/lib/productMapper';

const formSchema = z.object({
  nome: z.string().min(2, {
    message: "Nome deve ter pelo menos 2 caracteres.",
  }),
  categoria: z.union([z.string().min(1), z.number()]).transform((v) => String(v)).refine((s) => s.length > 0, {
    message: "Selecione a categoria.",
  }),
  descricao: z.string().min(10, {
    message: "Descrição deve ter pelo menos 10 caracteres.",
  }),
  custo: z.number(),
  venda: z.number(),
  codigo: z.string(),
  estoque: z.number(),
  empresaId: z.number(),
  disponivel: z.boolean().default(true),
  imagem: z.string().optional(),
})

interface ProdutoFormProps {
  editingProduct?: Produto;
  empresas?: import('@/types/empresa').EmpresaData[];
  categorias?: import('@/types/categoria').Categoria[];
  onSubmit?: (data: ProdutoFormType) => Promise<void> | void;
}

type FormData = z.infer<typeof formSchema>

const ProdutoForm = ({ editingProduct, empresas, categorias, onSubmit }: ProdutoFormProps) => {
  const { toast } = useToast()
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: editingProduct?.nome || "",
      categoria: String(editingProduct?.categoria ?? ''),
      descricao: editingProduct?.descricao || "",
      custo: editingProduct?.custo || 0,
      venda: editingProduct?.venda || 0,
      codigo: editingProduct?.codigo || "",
      estoque: editingProduct?.estoque || 0,
      empresaId: editingProduct?.empresaId || 1,
      disponivel: editingProduct?.disponivel || true,
      imagem: editingProduct?.imagem || "",
    },
    mode: "onChange"
  })

  // Quando categorias/empresas ou produto de edição mudam, ajustar os valores do formulário
  React.useEffect(() => {
    if (editingProduct) {
      const categoriaId = categorias?.find(c => c.nome === editingProduct.categoria)?.id;
      form.reset({
        nome: editingProduct.nome,
        categoria: categoriaId ? String(categoriaId) : String(editingProduct.categoria ?? ''),
        descricao: editingProduct.descricao,
        custo: editingProduct.custo,
        venda: editingProduct.venda,
        codigo: editingProduct.codigo,
        estoque: editingProduct.estoque,
        empresaId: editingProduct.empresaId || 1,
        disponivel: editingProduct.disponivel,
        imagem: editingProduct.imagem || '',
      });
    }
  }, [editingProduct, categorias, empresas, form]);

  const parseNumber = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const onSubmitInternal = async (data: FormData) => {
    try {
      // Normalize numbers and pass the form payload to the parent via onSubmit
      const payload = {
        nome: data.nome,
        categoria: String(data.categoria), // categoria is the selected id as string
        descricao: data.descricao,
        custo: parseNumber(data.custo),
        venda: parseNumber(data.venda),
        codigo: data.codigo,
        estoque: parseNumber(data.estoque),
        empresaId: Number(data.empresaId),
        disponivel: Boolean(data.disponivel),
        imagem: data.imagem || '',
      };

      if (onSubmit) {
        // Let parent handle API calls, cache invalidation and closing the dialog.
        await onSubmit(payload as ProdutoFormType);
      }

      toast({
        title: "Sucesso",
        description: editingProduct ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!",
      });

      // Parent is responsible for navigation/closing; we keep a safe navigation here
      navigate('/loja-fisica/produtos');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Houve um erro ao salvar o produto.",
      });
    }
  };

  return (
    <Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmitInternal)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do produto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <FormControl>
                  <Select value={String(field.value)} onValueChange={(v) => field.onChange(String(v))} disabled={!categorias || categorias.length === 0}>
                    <SelectTrigger>
                      <SelectValue placeholder={(!categorias || categorias.length === 0) ? 'Carregando categorias...' : 'Selecione a categoria'} />
                    </SelectTrigger>
                    <SelectContent>
                      {(categorias ?? []).map(cat => (
                        <SelectItem key={cat.id} value={String(cat.id)}>{cat.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="custo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custo</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Custo do produto" 
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="venda"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venda</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Valor de venda do produto" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="estoque"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estoque</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Quantidade em estoque" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="codigo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código</FormLabel>
                <FormControl>
                  <Input placeholder="Código do produto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="empresaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <FormControl>
                  <Select value={String(field.value)} onValueChange={(value) => field.onChange(parseInt(value))} disabled={!empresas || empresas.length === 0}>
                    <SelectTrigger>
                      <SelectValue placeholder={(!empresas || empresas.length === 0) ? 'Carregando empresas...' : 'Selecione a empresa'} />
                    </SelectTrigger>
                    <SelectContent>
                      {(empresas ?? []).map(emp => (
                        <SelectItem key={emp.id} value={String(emp.id)}>{emp.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="disponivel"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Disponível</FormLabel>
                  <FormDescription>
                    Defina se o produto está disponível para venda.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Descrição detalhada do produto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imagem"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Imagem</FormLabel>
              <FormControl>
                <Input placeholder="URL da imagem do produto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline">
                Salvar produto
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmação</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja salvar as alterações?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={form.handleSubmit(onSubmitInternal)}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </Form>
  )
}

export default ProdutoForm;
