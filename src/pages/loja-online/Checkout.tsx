
// D:\OsmarSoftware\happy-hops-home - Sem a integração do mercado pago\src\pages\loja-online\Checkout.tsx
import React, { useState } from 'react';
import { useCarrinho } from '@/hooks/useCarrinho';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, ArrowLeft, CreditCard, Loader2, AlertCircle } from 'lucide-react';
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
import apiServices from '@/services/apiServices';
import { PedidoLocal } from '@/types/pedido';
import { formataPreco } from '@/contexts/moeda';
import { confirmarConsumoEstoque } from '@/services/estoqueReservaService';
import { registrarSaida } from '@/services/movimentacaoEstoqueService';
// Tipos locais para evitar `any` ao enviar payloads ao backend e ao Mercado Pago
type BackendPedidoPayload = Omit<PedidoLocal, 'id'> & { tipo: 'online'; usuarioId: number };

type PreferenceItem = { title: string; unit_price: number; quantity: number };
type PreferenceData = {
  items: PreferenceItem[];
  back_urls: { success: string; failure: string; pending: string };
  external_reference: string;
  auto_return?: string;
};

const Checkout = () => {
  // Hooks para gerenciamento do carrinho e navegação
  const { carrinho, totalCarrinho, limparCarrinho, subtotalCarrinho, descontoCupom } = useCarrinho();
  const [showPagamentoModal, setShowPagamentoModal] = useState(false); // Estado para exibir modal de pagamento
  const [environmentMode, setEnvironmentMode] = useState<'sandbox' | 'production'>('sandbox'); // Ambiente de pagamento
  const [isProcessing, setIsProcessing] = useState(false); // Estado para controlar processamento
  const { toast } = useToast(); // Hook para exibir notificações
  const navigate = useNavigate(); // Hook para navegação entre páginas
  const { user, profile } = useAuth(); // Pega o usuário autenticado do contexto

  // Função para processar o pagamento do pedido via Mercado Pago
  const handlePagamento = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      console.log('🚀 Processando pedido online via Mercado Pago...', { carrinho, ambiente: environmentMode, total: totalCarrinho });

      // Confirmar consumo de estoque para todos os itens do carrinho
      carrinho.forEach(item => {
        confirmarConsumoEstoque(item.id, item.quantidade);
        registrarSaida(item.id, item.quantidade, 'venda_online', `pedido-online-${Date.now()}`);
      });

      // Criar pedido no backend
      // Montar payload do pedido. O backend exige `usuarioId`, então incluímos
      // o id do usuário autenticado (user.id) ou fallback para profile.user_id.
      const pedidoPayload: Omit<PedidoLocal, 'id'> & { tipo: 'online' } = {
        numeroPedido: 0,
        mesaId: 0,
        mesaNome: '',
        status: 'Pendente',
        // tipo é exigido pelo backend (schemas.PedidoCreate.tipo)
        tipo: 'online',
        itens: carrinho.map(item => ({
          id: item.id,
          produtoId: item.id,
          nome: item.nome,
          quantidade: item.quantidade,
          venda: item.venda,
          total: item.venda * item.quantidade
        })),
        total: totalCarrinho,
        dataHora: new Date().toISOString(),
        atendente: profile?.nome ?? 'Cliente',
        observacoes: undefined,
      };

      // O backend espera `usuarioId` no body do pedido. Construímos um objeto
      // de request que inclui esse campo. Para manter compatibilidade de tipos
      // com o serviço existente (PedidoLocal não define `usuarioId`), fazemos
      // um cast ao enviar — isto apenas evita erro de tipagem TS, o JSON enviado
      // terá `usuarioId` corretamente.
      const backendPedidoPayload: BackendPedidoPayload = {
        ...pedidoPayload,
        usuarioId: user?.id ?? Number(profile?.user_id ?? 0),
      };

      const pedidoCriado = await apiServices.pedidoService.create(backendPedidoPayload);
      console.log('🌐 Pedido criado no backend:', pedidoCriado);

      // Montar payload de preferência para Mercado Pago
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const preferenceData: PreferenceData = {
        items: carrinho.map(item => ({
          title: item.nome,
          unit_price: item.venda,
          quantity: item.quantidade
        })),
        back_urls: {
          success: `${window.location.origin}/loja-online/historico?payment=success`,
          failure: `${window.location.origin}/loja-online/checkout?payment=failure`,
          pending: `${window.location.origin}/loja-online/historico?payment=pending`
        },
        external_reference: String(pedidoCriado.id)
      };

      // Detectar se estamos em ambiente localhost (Mercado Pago não aceita auto_return com URLs locais)
      const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
      if (!isLocalhost) {
        preferenceData.auto_return = 'approved';
      }

      // Solicitar ao backend que crie a preferência no Mercado Pago
      const backendRes = await fetch(`${backendUrl}/mp/create_preference/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferenceData)
      });

      if (!backendRes.ok) {
        const text = await backendRes.text().catch(() => '');
        throw new Error(`Erro ao criar preferência de pagamento no Mercado Pago: ${backendRes.status} ${text}`);
      }

      const preference = await backendRes.json();
      console.log('✅ Preferência MP criada:', preference);

      // Escolher URL baseado no ambiente selecionado
      const checkoutUrl = environmentMode === 'sandbox' 
        ? (preference.sandbox_init_point || preference.init_point)
        : preference.init_point;
        
      if (!checkoutUrl) {
        throw new Error('Resposta do Mercado Pago não contém URL de checkout (init_point)');
      }

      // Salvar pedido no histórico local antes de redirecionar
      salvarPedidoNoHistorico({
        metodoPagamento: 'Mercado Pago',
        itens: carrinho,
        subtotal: subtotalCarrinho,
        desconto: descontoCupom,
        total: totalCarrinho,
        nome: profile?.nome,
      });

      // Limpar carrinho e fechar modal
      limparCarrinho();
      setShowPagamentoModal(false);

      toast({
        title: 'Redirecionando para Mercado Pago',
        description: `Você será levado ao checkout do Mercado Pago (${environmentMode === 'sandbox' ? 'Teste' : 'Produção'}).`,
        duration: 3000,
      });

      // Redirecionar para checkout do Mercado Pago
      window.location.href = checkoutUrl;
    } catch (error: unknown) {
      console.error('❌ Erro ao processar pedido:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
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
                <CreditCard className="mr-2 h-5 w-5" />
                {isProcessing ? 'Processando...' : 'Finalizar Pedido'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Modal de pagamento Mercado Pago */}
      <Dialog open={showPagamentoModal} onOpenChange={setShowPagamentoModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Finalizar Pedido</DialogTitle>
            <DialogDescription>
              Complete seu pedido de forma rápida e segura
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Resumo do Pedido */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-foreground">Resumo do Pedido</h4>
              {carrinho.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.quantidade}x {item.nome}
                  </span>
                  <span className="font-medium">
                    {formataPreco(item.venda * item.quantidade)}
                  </span>
                </div>
              ))}
              {descontoCupom > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto:</span>
                  <span>- {formataPreco(descontoCupom)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-border flex justify-between items-center">
                <span className="font-bold">Total:</span>
                <span className="text-2xl font-bold text-primary">
                  {formataPreco(totalCarrinho)}
                </span>
              </div>
            </div>

            {/* Seleção de Ambiente */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Ambiente de Pagamento:</Label>
              <RadioGroup 
                value={environmentMode} 
                onValueChange={(value) => setEnvironmentMode(value as "sandbox" | "production")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2 flex-1">
                  <RadioGroupItem value="sandbox" id="sandbox" />
                  <Label htmlFor="sandbox" className="cursor-pointer flex-1 p-3 border rounded-lg hover:bg-accent">
                    <div className="font-semibold text-sm">🧪 Sandbox (Teste)</div>
                    <div className="text-xs text-muted-foreground">Para testes e desenvolvimento</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 flex-1">
                  <RadioGroupItem value="production" id="production" />
                  <Label htmlFor="production" className="cursor-pointer flex-1 p-3 border rounded-lg hover:bg-accent">
                    <div className="font-semibold text-sm">🚀 Produção</div>
                    <div className="text-xs text-muted-foreground">Pagamentos reais</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Botão Mercado Pago */}
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-[#009EE3] to-[#0084C8] hover:shadow-lg text-lg font-bold"
              onClick={handlePagamento}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pagar com Mercado Pago
                </>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground space-y-2">
              <p>🔒 Pagamento seguro via Mercado Pago</p>
              <p className="mt-1 font-semibold">
                {environmentMode === "sandbox" ? (
                  <span className="text-green-600">✅ Modo: Sandbox (Teste)</span>
                ) : (
                  <span className="text-yellow-600">⚠️ Modo: Produção</span>
                )}
              </p>
            </div>

            {/* Informações sobre cartões de teste - só mostrar em modo Sandbox */}
            {environmentMode === "sandbox" && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-900 dark:text-blue-100">
                    <p className="font-semibold mb-2">📝 Cartões de teste oficiais:</p>
                    <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                      <li>• <strong>Mastercard:</strong> 5031 4332 1540 6351</li>
                      <li>• <strong>Visa:</strong> 4509 9535 6623 3704</li>
                      <li>• <strong>CVV:</strong> qualquer 3 dígitos</li>
                      <li>• <strong>Validade:</strong> qualquer data futura</li>
                      <li>• <strong>Titular:</strong> APRO (para aprovar)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Alerta sobre ambiente de produção */}
            {environmentMode === "production" && (
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-yellow-900 dark:text-yellow-100">
                    <p className="font-semibold mb-1">⚠️ Ambiente de Produção</p>
                    <p>Você está usando o modo de produção. Certifique-se de usar credenciais de produção válidas.</p>
                    <p className="mt-1">Os pagamentos serão reais neste modo.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;


