import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShoppingBag, Table2, Package } from "lucide-react";
import { motion } from "framer-motion";

const AdminIndex = () => {
  const navigate = useNavigate();

  const cards = [
    { 
      title: 'Produtos', 
      description: 'Gerencie o catálogo de produtos da sua choperia.', 
      icon: ShoppingBag, 
      onClick: () => navigate('/loja-fisica/produtos'),
      colorClass: 'text-neon-green'
    },
    { 
      title: 'Mesas', 
      description: 'Visualize e gerencie as mesas do seu estabelecimento.', 
      icon: Table2, 
      onClick: () => navigate('/loja-fisica/mesas'),
      colorClass: 'text-neon-pink'
    },
    { 
      title: 'Estoque', 
      description: 'Mantenha seu estoque atualizado e sob controle.', 
      icon: Package, 
      onClick: () => navigate('/loja-fisica/estoque'),
      colorClass: 'text-neon-yellow'
    },
  ];

  return (
    <div className="container mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12 p-8"
      >
        <h1 className="text-4xl font-bold text-neon-blue mb-4">
          Área da Loja Local
        </h1>
        <p className="text-xl text-neon-blue mb-4">
          Gerencie sua choperia de forma eficiente
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card 
              onClick={card.onClick}
              className="transform transition-all duration-300 hover:scale-105 bg-black/50 backdrop-blur-sm border border-white/10 cursor-pointer"
            >
              <CardHeader>
                <CardTitle className={`flex items-center ${card.colorClass}`}>
                  <card.icon className="mr-2 h-6 w-6" />
                  {card.title}
                </CardTitle>
                <CardDescription className="text-white/70">
                  {card.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/60">
                  Clique para acessar
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminIndex;
