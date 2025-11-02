
import React from 'react';
import { Beer, GlassWater, ShoppingCart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';

const Loja = () => {
  const navigate = useNavigate();

  const handlePedirAgora = () => {
    try {
      toast({
        title: "Sucesso",
        description: "Redirecionando para a página de produtos...",
      });
      navigate('/loja-online/produtos');
    } catch (error) {
      console.error('Erro durante o redirecionamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao redirecionar para a página de produtos",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="container mx-auto py-8">
      <section className="text-center mb-12">
        <h2 className="text-4xl font-bold text-amber-900 mb-4">
          Bem-vindo à Loja Online
        </h2>
        <p className="text-xl text-amber-700">
          Descubra nossos produtos exclusivos
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Produto do Dia</CardTitle>
            <CardDescription>Confira nossa seleção especial</CardDescription>
          </CardHeader>
          <CardContent>
            <Beer className="w-16 h-16 text-amber-600 mx-auto mb-4" />
            <p>Produtos selecionados especialmente para você.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={handlePedirAgora} className="w-full">
              Pedir Agora
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorias</CardTitle>
            <CardDescription>Explore nossos produtos</CardDescription>
          </CardHeader>
          <CardContent>
            <GlassWater className="w-16 h-16 text-amber-600 mx-auto mb-4" />
            <p>Navegue por nossas diferentes categorias de produtos.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={handlePedirAgora} className="w-full">
              Ver Categorias
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promoções</CardTitle>
            <CardDescription>Ofertas especiais</CardDescription>
          </CardHeader>
          <CardContent>
            <ShoppingCart className="w-16 h-16 text-amber-600 mx-auto mb-4" />
            <p>Confira nossas promoções e descontos exclusivos.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={handlePedirAgora} className="w-full">
              Ver Promoções
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
};

export default Loja;
