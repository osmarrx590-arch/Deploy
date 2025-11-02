
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ItemMesa } from '@/types/mesa';
import { formataPreco } from '@/contexts/moeda';
import { processarPagamento } from '@/services/pagamentoService';

import { PagamentoDialogProps } from '@/types/mesa';

export const PagamentoDialog = ({
  isOpen,
  onClose,
  mesaNome,
  pedidoNumero,
  itensMesa,
  totalGeral,
  onPagamentoConfirmado
}: PagamentoDialogProps) => {
  const { toast } = useToast();
  const [metodoPagamento, setMetodoPagamento] = useState<string>('');
  const [valorRecebido, setValorRecebido] = useState<string>(totalGeral.toFixed(2));
  const [desconto, setDesconto] = useState<string>('0');
  const [isProcessing, setIsProcessing] = useState(false);

  const valorDescontoNum = parseFloat(desconto) || 0;
  const valorRecebidoNum = parseFloat(valorRecebido) || 0;
  const totalComDesconto = totalGeral - valorDescontoNum;
  const troco = Math.max(0, valorRecebidoNum - totalComDesconto);

  const handleConfirmarPagamento = async () => {
    if (!metodoPagamento) {
      toast({
        title: "Erro",
        description: "Selecione um método de pagamento.",
        variant: "destructive"
      });
      return;
    }

    // Só valida valor recebido para dinheiro
    if (metodoPagamento === 'dinheiro' && valorRecebidoNum < totalComDesconto) {
      toast({
        title: "Erro",
        description: "Valor recebido é insuficiente.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log('🚀 Processando pagamento físico...', {
        mesa: mesaNome,
        pedido: pedidoNumero,
        total: totalComDesconto,
        metodo: metodoPagamento
      });

      // Processar pagamento com integração completa de estoque
      await processarPagamento({
        mesaId: typeof pedidoNumero === 'number' ? pedidoNumero : parseInt(mesaNome.replace(/\D/g, '')), // Extrair número da mesa
        mesaNome,
        pedidoNumero,
        metodoPagamento,
        itens: itensMesa,
        subtotal: totalGeral,
        desconto: valorDescontoNum,
        total: totalComDesconto,
        valorRecebido: metodoPagamento === 'dinheiro' ? valorRecebidoNum : undefined,
        troco: metodoPagamento === 'dinheiro' ? troco : undefined
      });
      
      onPagamentoConfirmado();
      
      toast({
        title: "Pagamento realizado com sucesso!",
        description: `Mesa ${mesaNome} - Pedido #${pedidoNumero} finalizado e estoque atualizado.`,
      });

      onClose();
    } catch (error) {
      console.error('❌ Erro no pagamento:', error);
      toast({
        title: "Erro no pagamento",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Realizar Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">
              Mesa: {mesaNome} | Pedido: #{pedidoNumero}
            </p>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-semibold mb-2">Resumo do Pedido:</h4>
            {itensMesa.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.quantidade}x {item.nome}</span>
                <span>{formataPreco(item.total)}</span>
              </div>
            ))}
            <hr className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Subtotal:</span>
              <span>{formataPreco(totalGeral)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="metodo-pagamento">Método de Pagamento</Label>
              <Select value={metodoPagamento} onValueChange={setMetodoPagamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="desconto">Desconto (R$)</Label>
              <Input
                id="desconto"
                type="number"
                step="0.01"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {metodoPagamento === 'dinheiro' && (
              <div>
                <Label htmlFor="valor-recebido">Valor Recebido (R$)</Label>
                <Input
                  id="valor-recebido"
                  type="number"
                  step="0.01"
                  value={valorRecebido}
                  onChange={(e) => setValorRecebido(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded">
            <div className="flex justify-between">
              <span>Total com desconto:</span>
              <span className="font-bold">{formataPreco(totalComDesconto)}</span>
            </div>
            {metodoPagamento === 'dinheiro' && troco > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Troco:</span>
                <span className="font-bold">{formataPreco(troco)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmarPagamento}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
