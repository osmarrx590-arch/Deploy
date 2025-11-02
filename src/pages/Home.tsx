
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Beer, Clock, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Home = () => {
  const { user, profile } = useAuth();

  // Determinar o link da loja baseado no tipo do usuário
  const getLojaLink = () => {
    if (!user) return '/auth';
    return profile?.tipo === 'fisica' ? '/loja-fisica' : '/loja-online';
  };

  const getLojaLabel = () => {
    if (!user) return 'Fazer Login';
    return profile?.tipo === 'fisica' ? 'Acessar Loja Física' : 'Acessar Loja Online';
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Título de boas-vindas */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-amber-800 mb-4">Bem-vindo à Choperia</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Sua cervejaria artesanal favorita agora disponível online e em nossa loja física
        </p>
      </div>

      {/* Cards de destaques: cervejas, horários, localização */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Card 1: Seleção de cervejas */}
        <Card className="border-amber-600/20">
          <CardHeader>
            <Beer className="h-10 w-10 text-amber-600 mb-2" />
            <CardTitle>Cervejas Artesanais</CardTitle>
            <CardDescription>Conheça nossa seleção exclusiva</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Oferecemos uma ampla variedade de cervejas artesanais produzidas com ingredientes selecionados e técnicas tradicionais.</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link to="/menu">Ver Menu</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Card 2: Horários */}
        <Card className="border-amber-600/20">
          <CardHeader>
            <Clock className="h-10 w-10 text-amber-600 mb-2" />
            <CardTitle>Horários</CardTitle>
            <CardDescription>Estamos esperando por você</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Segunda à Sexta: 16h às 23h<br />
              Sábados e Domingos: 12h às 00h</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link to="/sobre">Sobre Nós</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Card 3: Localização */}
        <Card className="border-amber-600/20">
          <CardHeader>
            <MapPin className="h-10 w-10 text-amber-600 mb-2" />
            <CardTitle>Localização</CardTitle>
            <CardDescription>Venha nos visitar</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Rua da Cerveja, 123<br />
              Bairro Artesanal<br />
              São Paulo, SP</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link to="/contato">Como Chegar</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Seção de chamada para ação (CTA) */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-amber-800 mb-4">
          {user ? `Olá, ${profile?.nome}!` : "Faça seu pedido online"}
        </h2>
        <p className="mb-6">
          {user 
            ? `Acesse sua área da ${profile?.tipo === 'fisica' ? 'loja física' : 'loja online'}`
            : "Experimente nossas cervejas no conforto da sua casa"
          }
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link to={getLojaLink()}>{getLojaLabel()}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/menu">Ver Menu</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
