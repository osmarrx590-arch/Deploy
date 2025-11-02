
// D:\OsmarSoftware\happy-hops-home - Sem a integração do mercado pago\src\pages\loja-online\Checkout.tsx
import React, { useState } from 'react';
import { useCarrinho } from '@/hooks/useCarrinho';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, ArrowLeft, Send, CreditCard, Banknote } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { salvarPedidoNoHistorico } from '@/services/pedidoHistoricoService';
import { useAuth } from '@/contexts/AuthContext';
import { formataPreco } from '@/contexts/moeda';
import { confirmarConsumoEstoque } from '@/services/estoqueReservaService';
import { registrarSaida } from '@/services/movimentacaoEstoqueService';

const Checkout = () => {
  // Hooks para gerenciamento do carrinho e navegação
  const { carrinho, totalCarrinho, limparCarrinho, subtotalCarrinho, descontoCupom } = useCarrinho();
  const [showPagamentoModal, setShowPagamentoModal] = useState(false); // Estado para exibir modal de pagamento
  const [metodoPagamento, setMetodoPagamento] = useState(''); // Método de pagamento selecionado
  const [isProcessing, setIsProcessing] = useState(false); // Estado para controlar processamento
  const { toast } = useToast(); // Hook para exibir notificações
  const navigate = useNavigate(); // Hook para navegação entre páginas
  const { user, profile } = useAuth(); // Pega o usuário autenticado do contexto

  // Função para processar o pagamento do pedido
  const handlePagamento = async () => {
    if (isProcessing || !metodoPagamento) return; // Validação básica
    setIsProcessing(true);

    try {
      console.log('🚀 Processando pedido online...', { carrinho, metodoPagamento, total: totalCarrinho });

      // Simular processamento do pedido
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Confirmar consumo de estoque para todos os itens do carrinho
      carrinho.forEach(item => {
        confirmarConsumoEstoque(item.id, item.quantidade);
        registrarSaida(item.id, item.quantidade, 'venda_online', `pedido-online-${Date.now()}`);
      });

      // Tentar sincronizar com o backend. Se falhar, usar fallback local.
      let pedidoSalvo;
      try {
        // Monta payload para o backend (estrutura simples)
        const payload = {
          metodoPagamento,
          itens: carrinho.map(item => ({
            id: item.id,
            nome: item.nome,
            quantidade: item.quantidade,
            venda: item.venda
          })),
          subtotal: subtotalCarrinho,
          desconto: descontoCupom,
          total: totalCarrinho,
          nome: profile?.nome
        };

        // Chamada direta ao backend — segue mesmo padrão do pagamentoService
        const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'}/pedidos/`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!resp.ok) throw new Error('Backend retornou erro ao criar pedido');

        const criado = await resp.json();
        console.log('🌐 Pedido sincronizado com backend:', criado);

        // Também persistir histórico local (cópia) para exibição no cliente
        pedidoSalvo = salvarPedidoNoHistorico({
          metodoPagamento,
          itens: carrinho,
          subtotal: subtotalCarrinho,
          desconto: descontoCupom,
          total: totalCarrinho,
          nome: profile?.nome,
        });
        console.log('💾 Pedido local salvo (após sync):', pedidoSalvo);
      } catch (err) {
        console.warn('⚠️ Falha ao sincronizar pedido com backend, usando fallback local', err);
        // Fallback: salvar somente no histórico local
        pedidoSalvo = salvarPedidoNoHistorico({
          metodoPagamento,
          itens: carrinho,
          subtotal: subtotalCarrinho,
          desconto: descontoCupom,
          total: totalCarrinho,
          nome: profile?.nome,
        });
        console.log('💾 Pedido online salvo (fallback local):', pedidoSalvo);
      }

      // Limpar carrinho após sucesso
      limparCarrinho();
      
      // Exibir notificação de sucesso
      toast({
        title: "Pedido enviado com sucesso!",
        description: `Pedido #${pedidoSalvo.numero} foi registrado e o estoque foi atualizado.`,
        duration: 3000,
      });

      // Navegar para página de histórico
      navigate('/loja-online/historico');
    } catch (error: unknown) {
      console.error('❌ Erro ao processar pedido:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Exibir notificação de erro
      toast({
        title: "Erro ao enviar pedido",
        description: `Não foi possível registrar o pedido. ${errorMessage}`,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoltar = () => navigate(-1);

  if (carrinho.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Carrinho vazio</CardTitle>
            <CardDescription>Seu carrinho está vazio. Adicione produtos antes de continuar.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate('/loja-online/produtos')}>
              Ver produtos
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      {/* Botão para voltar à página anterior */}
      <Button variant="outline" onClick={handleVoltar} className="mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      {/* Layout principal com grid responsivo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Coluna principal: Resumo do pedido */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Resumo do Pedido
              </CardTitle>
              <CardDescription>Confira os itens do seu pedido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Lista de itens do carrinho */}
                {carrinho.map((item) => (
                  <div key={item.id} className="flex justify-between border-b pb-3">
                    <div>
                      <p className="font-medium">{item.nome}</p>
                      <p className="text-sm text-muted-foreground">                        
                        {item.quantidade} x {formataPreco(item.venda)}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formataPreco(item.venda * item.quantidade)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna lateral: Resumo financeiro e finalização */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formataPreco(subtotalCarrinho)}</span>

                </div>
                {/* Mostrar desconto se houver */}
                {descontoCupom > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto:</span>
                    <span>- {formataPreco(descontoCupom)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>{formataPreco(totalCarrinho)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={() => setShowPagamentoModal(true)}
                disabled={isProcessing}
              >
                <Send className="mr-2 h-5 w-5" />
                {isProcessing ? 'Processando...' : 'Finalizar Pedido'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Modal de seleção de método de pagamento */}
      <Dialog open={showPagamentoModal} onOpenChange={setShowPagamentoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escolha o método de pagamento</DialogTitle>
            <DialogDescription>
              Selecione como deseja pagar pelo seu pedido no valor de {formataPreco(totalCarrinho)}
            </DialogDescription>
          </DialogHeader>

          {/* Opções de pagamento */}
          <RadioGroup value={metodoPagamento} onValueChange={setMetodoPagamento}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dinheiro" id="dinheiro" />
              <Label htmlFor="dinheiro" className="flex items-center cursor-pointer">
                <Banknote className="mr-2 h-4 w-4" />
                Dinheiro
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cartao" id="cartao" />
              <Label htmlFor="cartao" className="flex items-center cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                Cartão (Débito/Crédito)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pix" id="pix" />
              <Label htmlFor="pix" className="flex items-center cursor-pointer">
                <span className="mr-2 text-sm font-bold">PIX</span>
                PIX
              </Label>
            </div>
          </RadioGroup>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowPagamentoModal(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handlePagamento} 
              disabled={!metodoPagamento || isProcessing}
            >
              {isProcessing ? 'Processando...' : 'Confirmar Pedido'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;


