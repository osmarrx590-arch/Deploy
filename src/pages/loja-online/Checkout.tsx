
// Integração direta com Mercado Pago - Frontend Only
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

// ⚠️ CREDENCIAIS MERCADO PAGO - SOMENTE PARA TESTES
// Em produção, estas chaves devem estar no backend ou em variáveis de ambiente seguras
const MP_PUBLIC_KEY = 'APP_USR-c1f99119-2376-47f9-b456-1fa509473fb6';
const MP_ACCESS_TOKEN = 'APP_USR-3542135147633802-102621-efdb375d6e6fab25f7ab0c586304c0d3-2939944844';
const MP_FORCE_SANDBOX = true;

type PreferenceItem = { 
  title: string; 
  unit_price: number; 
  quantity: number;
  currency_id?: string;
};

type MercadoPagoPreference = {
  items: PreferenceItem[];
  back_urls: { 
    success: string; 
    failure: string; 
    pending: string; 
  };
  auto_return?: string;
  external_reference?: string;
  notification_url?: string;
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

  // Função para processar o pagamento via Mercado Pago - INTEGRAÇÃO DIRETA
  const handlePagamento = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      console.log('🚀 Processando pedido online via Mercado Pago...', { 
        carrinho, 
        ambiente: environmentMode, 
        total: totalCarrinho,
        forceSandbox: MP_FORCE_SANDBOX 
      });

      // Confirmar consumo de estoque para todos os itens do carrinho
      carrinho.forEach(item => {
        confirmarConsumoEstoque(item.id, item.quantidade);
        registrarSaida(item.id, item.quantidade, 'venda_online', `pedido-online-${Date.now()}`);
      });

      // Salvar pedido no histórico local ANTES de processar pagamento
      const pedidoId = `MP-${Date.now()}`;
      salvarPedidoNoHistorico({
        metodoPagamento: 'Mercado Pago',
        itens: carrinho,
        subtotal: subtotalCarrinho,
        desconto: descontoCupom,
        total: totalCarrinho,
        nome: profile?.nome,
      });

      // 🔥 INTEGRAÇÃO DIRETA COM MERCADO PAGO
      // Criar preferência diretamente na API do MP
      const preferenceData: MercadoPagoPreference = {
        items: carrinho.map(item => ({
          title: item.nome,
          unit_price: item.venda,
          quantity: item.quantidade,
          currency_id: 'BRL'
        })),
        back_urls: {
          success: `${window.location.origin}/loja-online/historico?payment=success`,
          failure: `${window.location.origin}/loja-online/checkout?payment=failure`,
          pending: `${window.location.origin}/loja-online/historico?payment=pending`
        },
        external_reference: pedidoId,
      };

      const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
      if (!isLocalhost) {
        preferenceData.auto_return = 'approved';
      }

      console.log('📝 Criando preferência MP:', preferenceData);

      // Chamar API do Mercado Pago diretamente
      const mpApiUrl = 'https://api.mercadopago.com/checkout/preferences';
      
      const mpResponse = await fetch(mpApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
        },
        body: JSON.stringify(preferenceData)
      });

      if (!mpResponse.ok) {
        const errorText = await mpResponse.text();
        console.error('❌ Erro na resposta do MP:', errorText);
        throw new Error(`Erro ao criar preferência MP: ${mpResponse.status}`);
      }

      const preference = await mpResponse.json();
      console.log('✅ Preferência MP criada:', preference);

      // Determinar URL de checkout baseado no modo
      let checkoutUrl = '';
      
      if (MP_FORCE_SANDBOX || environmentMode === 'sandbox') {
        checkoutUrl = preference.sandbox_init_point || preference.init_point;
        console.log('🧪 Usando modo SANDBOX');
      } else {
        checkoutUrl = preference.init_point;
        console.log('🚀 Usando modo PRODUÇÃO');
      }

      if (!checkoutUrl) {
        throw new Error('Resposta do MP não contém URL de checkout');
      }

      // Limpar carrinho e fechar modal
      limparCarrinho();
      setShowPagamentoModal(false);

      toast({
        title: '✅ Redirecionando para Mercado Pago',
        description: `Checkout ${MP_FORCE_SANDBOX || environmentMode === 'sandbox' ? 'Teste (Sandbox)' : 'Produção'}`,
        duration: 3000,
      });

      // Redirecionar para checkout do Mercado Pago
      console.log('🔗 Redirecionando para:', checkoutUrl);
      window.location.href = checkoutUrl;

      /* ===============================================
         🔒 CÓDIGO BACKEND (COMENTADO PARA REFERÊNCIA)
         ===============================================
         
      // MODO BACKEND: Criar pedido e preferência via API
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      
      const pedidoPayload = {
        numeroPedido: 0,
        mesaId: 0,
        mesaNome: '',
        status: 'Pendente',
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
        usuarioId: user?.id ?? Number(profile?.user_id ?? 0),
      };

      const pedidoCriado = await apiServices.pedidoService.create(pedidoPayload);
      
      const preferenceData = {
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

      const backendRes = await fetch(`${backendUrl}/mp/create_preference/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferenceData)
      });

      const preference = await backendRes.json();
      checkoutUrl = environmentMode === 'sandbox' 
        ? (preference.sandbox_init_point || preference.init_point)
        : preference.init_point;
        
      =============================================== */
    } catch (error: unknown) {
      console.error('❌ Erro ao processar pedido:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "Erro ao processar pagamento",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
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


