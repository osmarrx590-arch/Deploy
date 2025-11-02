
import React, { useState } from 'react';
import { useCarrinho } from '@/hooks/useCarrinho';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingCart, Plus, Minus, Trash2, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formataPreco} from '@/contexts/moeda';

const CarrinhoDrawer = () => {
  // Hooks para gerenciamento do carrinho de compras
  const {
    carrinho,
    removerDoCarrinho,
    atualizarQuantidade,
    totalCarrinho,
    subtotalCarrinho,
    descontoCupom,
    quantidadeItens,
    limparCarrinho,
    cupom,
    aplicarCupom,
    removerCupom
  } = useCarrinho();
  
  const [codigoCupom, setCodigoCupom] = useState(''); // Estado para código do cupom de desconto
  const [open, setOpen] = useState(false); // controle de abertura do Drawer
  const navigate = useNavigate(); // Hook para navegação entre páginas

  // Função para navegar para página de checkout da loja online
  const handleCheckout = () => {
    setOpen(false); // fecha o Drawer
    // setTimeout(() => navigate('/loja-online/checkout'), 200); // navega após fechar
    navigate('/loja-online/checkout'); // Navegação correta para checkout dentro do layout da loja online
  };

  // Função para aplicar cupom de desconto
  const handleAplicarCupom = () => {
    if (codigoCupom.trim()) {
      aplicarCupom(codigoCupom);
      setCodigoCupom(''); // Limpar campo após aplicar
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Botão trigger que abre o drawer do carrinho */}
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="relative hover:scale-105 transition-transform duration-200"
        >
          <ShoppingCart className="h-5 w-5" />
          {/* Badge com quantidade de itens no carrinho */}
          {quantidadeItens > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {quantidadeItens}
            </span>
          )}
        </Button>
      </SheetTrigger>

      {/* Conteúdo do drawer lateral */}
      <SheetContent className="w-full sm:w-[400px] md:w-[540px] lg:w-[640px] xl:w-[720px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Seu Carrinho</SheetTitle>
          <SheetDescription>
            Gerencie os itens do seu carrinho de compras
          </SheetDescription>
        </SheetHeader>

        {/* Área scrollável com lista de produtos */}
        <div className="flex-1 mt-8 overflow-y-auto h-[calc(100vh-250px)]">
          {carrinho.length === 0 ? (
            <p className="text-center text-gray-500">Seu carrinho está vazio</p>
          ) : (
            <div className="space-y-4 pr-4">
              {/* Lista de itens do carrinho */}
              {carrinho.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:shadow-lg transition-shadow duration-300 space-y-4 sm:space-y-0"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{item.nome}</h3>
                    <p className="text-sm text-gray-500">
                      {typeof item.venda === 'number' ? formataPreco(item.venda) : '0,00'}
                    </p>
                  </div>
                  {/* Controles de quantidade e remoção */}
                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => atualizarQuantidade(item.id, item.quantidade - 1)}
                      className="hover:scale-105 transition-transform duration-200"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantidade}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => atualizarQuantidade(item.id, item.quantidade + 1)}
                      className="hover:scale-105 transition-transform duration-200"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removerDoCarrinho(item.id)}
                      className="hover:scale-105 transition-transform duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Área fixa inferior com cupons, totais e ações */}
        <div className="sticky bottom-0 bg-background border-t pt-4">
          {/* Seção de cupons de desconto */}
          {carrinho.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Input
                  type="text"
                  placeholder="Código do cupom"
                  value={codigoCupom}
                  onChange={(e) => setCodigoCupom(e.target.value)}
                />
                <Button 
                  variant="outline"
                  onClick={handleAplicarCupom}
                  className="whitespace-nowrap"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  Aplicar
                </Button>
              </div>
              {/* Exibir cupom aplicado */}
              {cupom && (
                <div className="flex justify-between items-center mb-2">
                  <span>Cupom aplicado: {cupom.nome}</span>
                  <Button 
                    variant="ghost" 
                    onClick={removerCupom}
                    className="text-destructive hover:text-destructive/90"
                  >
                    Remover
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Resumo financeiro */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span>Subtotal:</span>
              <span>{typeof subtotalCarrinho === 'number' ? formataPreco(subtotalCarrinho) : '0,00'}</span>
            </div>
            {/* Mostrar desconto se houver cupom aplicado */}
            {descontoCupom > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span>Desconto:</span>
                <span>- {typeof descontoCupom === 'number' ? formataPreco(descontoCupom) : '0,00'}</span>
              </div>
            )}
            <div className="flex justify-between items-center font-bold">
              <span>Total:</span>
              <span>{typeof totalCarrinho === 'number' ? formataPreco(totalCarrinho) : '0,00'}</span>
            </div>
          </div>
          
          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 py-4">
            <Button 
              variant="outline"
              className="w-full sm:w-auto"
              onClick={limparCarrinho}
            >
              Limpar Carrinho
            </Button>
            {/* Botão que navega para página de checkout */}
            <Button 
              onClick={handleCheckout} 
              className="w-full sm:w-auto"
              disabled={carrinho.length === 0}
            >
              Finalizar Compra
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CarrinhoDrawer;

