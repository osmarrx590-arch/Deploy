import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { produtoService, mesaService, empresaService, pedidoService, estoqueService } from '@/services/apiServices';
import { StatusPedido } from '@/types/status';
import { useToast } from '@/hooks/use-toast';

// Produtos
export const useProdutos = () => {
  return useQuery({
    queryKey: ['produtos'],
    queryFn: () => produtoService.getAll(),
  });
};

export const useCreateProduto = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: produtoService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast({
        title: "Produto criado",
        description: "Produto criado com sucesso!",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar produto.",
      });
    },
  });
};

// Mesas
export const useMesas = () => {
  return useQuery({
    queryKey: ['mesas'],
    queryFn: () => mesaService.getAll(),
  });
};

export const useCreateMesa = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: mesaService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      toast({
        title: "Mesa criada",
        description: "Mesa criada com sucesso!",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar mesa.",
      });
    },
  });
};

export const useUpdateMesa = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => mesaService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      toast({
        title: "Mesa atualizada",
        description: "Mesa atualizada com sucesso!",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar mesa.",
      });
    },
  });
};

// Empresas
export const useEmpresas = () => {
  return useQuery({
    queryKey: ['empresas'],
    queryFn: () => empresaService.getAll(),
  });
};

export const useCreateEmpresa = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: empresaService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      toast({
        title: "Empresa criada",
        description: "Empresa criada com sucesso!",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar empresa.",
      });
    },
  });
};

// Pedidos
export const usePedidos = () => {
  return useQuery({
    queryKey: ['pedidos'],
    queryFn: () => pedidoService.getAll(),
  });
};

export const useCreatePedido = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: pedidoService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      toast({
        title: "Pedido criado",
        description: "Pedido criado com sucesso!",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar pedido.",
      });
    },
  });
};

export const useUpdatePedidoStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
  mutationFn: ({ id, status }: { id: number; status: StatusPedido }) => pedidoService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast({
        title: "Status atualizado",
        description: "Status do pedido atualizado com sucesso!",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar status do pedido.",
      });
    },
  });
};

// Estoque
export const useEstoque = () => {
  return useQuery({
    queryKey: ['estoque'],
    queryFn: () => estoqueService.getMovimentacoes(),
  });
};

export const useAddMovimentacao = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: estoqueService.addMovimentacao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      toast({
        title: "Movimentação adicionada",
        description: "Movimentação de estoque adicionada com sucesso!",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao adicionar movimentação de estoque.",
      });
    },
  });
};