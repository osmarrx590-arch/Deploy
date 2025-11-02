import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { printComanda } from "@/services/PrintService";
import { criarPedidoLocal } from '@/services/pedidoHistoricoService';
import * as mesaService from '@/services/mesaService';
import * as pedidoApi from '@/api/loja-fisica/pedidos/pedidoService';
import { ItemMesa, ComandaCardProps } from '@/types/mesa';
import { CheckCircle, Send } from 'lucide-react';
import { formataPreco } from '@/contexts/moeda';

export const ComandaCard = ({ 
  mesaId,
  mesaNome,
  mesaPedido, 
  itensMesa, 
  statusPedido,
  onAddProduto, 
  onDeleteItem,
  onCancelPedido,
  onPedidoFinalizado,
  totalGeral 
}: ComandaCardProps) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [isEnviarParaPreparoOpen, setIsEnviarParaPreparoOpen] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeleteItem = (itemId: number, itemNome: string) => {
    onDeleteItem(itemId);
    toast({
      title: "Item removido",
      description: `${itemNome} foi removido da comanda.`
    });
  };

  const handleCancelPedido = async () => {
    if (!mesaId) {
      toast({ title: 'Erro', description: 'Mesa não carregada.', variant: 'destructive' });
      return;
    }
    // Tentar usar API primeiro; se falhar, usar fallback local (onCancelPedido)
    setIsCanceling(true);
    try {
      await pedidoApi.cancelarPedido(mesaId);
      toast({ title: 'Pedido cancelado', description: 'Todos os itens foram removidos e o estoque foi atualizado.' });
      // atualizar UI/local após cancelamento bem-sucedido
      if (onCancelPedido) {
        try { onCancelPedido(); } catch (err) { console.warn('[ComandaCard] onCancelPedido callback falhou', err); }
      }
    } catch (err) {
      console.warn('[ComandaCard] cancelarPedido via API falhou, usando fallback local', err);
      try {
        onCancelPedido();
        // onCancelPedido já mostra toast em alguns flows; garantir mensagem caso não
        toast({ title: 'Pedido cancelado', description: 'Operação realizada em modo offline.' });
      } catch (innerErr) {
        console.error('[ComandaCard] falha ao cancelar pedido localmente', innerErr);
        toast({ title: 'Erro', description: 'Não foi possível cancelar o pedido.', variant: 'destructive' });
      }
    } finally {
      setIsCanceling(false);
    }
  };

  const handlePreview = () => {
    printComanda(mesaPedido, itensMesa, totalGeral);
    toast({
      title: "Pré-visualização da comanda",
      description: "Uma nova janela foi aberta com a pré-visualização da comanda."
    });
  };

  const handleEnviarParaPreparo = () => {
    if (!mesaId || !mesaNome || !profile) {
      toast({
        title: "Erro",
        description: "Informações da mesa ou usuário não encontradas.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Criar pedido local
      const pedidoLocal = criarPedidoLocal({
        mesaId,
        mesaNome,
        itens: itensMesa,
        total: totalGeral,
        atendente: profile.nome,
        observacoes: observacoes || undefined,
        // Preserve número de pedido se já existir na mesa
        numeroPedido: mesaPedido ?? undefined
      });

    // Atualizar a mesa para status de preparo usando o valor correto do enum
    mesaService.atualizarMesa(mesaId, {
      statusPedido: 'Preparando'
    });

    // Fechar diálogo
    setIsEnviarParaPreparoOpen(false);
    setObservacoes('');

    // Callback para atualizar a interface
    if (onPedidoFinalizado) {
      onPedidoFinalizado();
    }

    toast({
      title: "Pedido finalizado com sucesso!",
      description: `Pedido #${pedidoLocal.numeroPedido} enviado para preparo. Mesa ${mesaNome} foi liberada.`
    });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Agrupa itens por produtoId para evitar duplicatas visuais
  const itensAgrupados = itensMesa.reduce((acc, item) => {
    const chave = `${item.produtoId}-${item.venda}`;
    if (acc[chave]) {
      acc[chave].quantidade += item.quantidade;
      acc[chave].total += item.total;
    } else {
      acc[chave] = { ...item };
    }
    return acc;
  }, {} as Record<string, ItemMesa>);

  const itensParaExibir = Object.values(itensAgrupados);
  const temItens = itensParaExibir.length > 0;

  return (
    <>
      <Card className="md:col-span-2">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              Comanda de Pedido: {mesaPedido ?? '-'}
            </h2>
            <Button onClick={onAddProduto} disabled={!mesaId} title={!mesaId ? 'Aguarde a mesa ser carregada' : undefined}>
              Adicionar Produto
            </Button>
          </div>

          {temItens ? (
            <div className="space-y-4">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left">Item</th>
                    <th className="text-left">Qtd</th>
                    <th className="text-left">Preço Unit.</th>
                    <th className="text-left">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {itensParaExibir.map((item) => (
                    <tr key={`${item.produtoId}-${item.venda}`}>
                      <td>{item.nome}</td>
                      <td>{item.quantidade}</td>
                      <td>{formataPreco(item.precoUnitario).replace("R$", "")}</td>
                      <td>{formataPreco(item.total).replace("R$", "")}</td>
                      <td>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteItem(item.id, item.nome)}
                        >
                          Excluir
                        </Button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3} className="text-right font-bold">
                      Total a pagar:
                    </td>
                    <td colSpan={1} className="font-bold">
                      {formataPreco(totalGeral)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="space-x-2 flex flex-wrap gap-2">
                <Button 
                  variant="secondary"
                  onClick={handlePreview}
                >
                  Visualizar e Imprimir Comanda
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleCancelPedido}
                  disabled={isCanceling}
                >
                  {isCanceling ? 'Cancelando...' : 'Cancelar Pedido'}
                </Button>
                <Button 
                  onClick={() => setIsEnviarParaPreparoOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={statusPedido === 'Preparando' || isSubmitting}
                >
                  {statusPedido === 'Preparando' ? (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Preparando
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar para Preparo
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <p>Nenhum item adicionado.</p>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Enviar para Preparo */}
      <Dialog open={isEnviarParaPreparoOpen} onOpenChange={setIsEnviarParaPreparoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Enviar para Preparo
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Mesa:</strong> {mesaNome}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Pedido:</strong> #{mesaPedido}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Total:</strong> {formataPreco(totalGeral)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Atendente:</strong> {profile?.nome}
              </p>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                placeholder="Ex: Sem cebola, bem passado, etc..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsEnviarParaPreparoOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleEnviarParaPreparo}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
