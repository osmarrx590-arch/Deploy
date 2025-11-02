
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Beer } from '@/types/produto';

// Re-export Beer type for backward compatibility
export type { Beer };

interface BeerCardProps {
  beer: Beer;
  index: number;
}

const BeerCard: React.FC<BeerCardProps> = ({ beer, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
        <div className="relative">
          <img
            src={beer.image}
            alt={beer.name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          <Badge className="absolute top-2 right-2 bg-amber-600">
            {beer.style}
          </Badge>
        </div>
        
        <CardContent className="flex-1 p-4">
          <h3 className="text-xl font-bold text-amber-900 mb-2">{beer.name}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{beer.description}</p>
          
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm text-gray-500">
              <span className="font-medium">ABV:</span> {beer.abv}%
            </div>
            <div className="text-sm text-gray-500">
              <span className="font-medium">IBU:</span> {beer.ibu}
            </div>
          </div>
          
          <div className="flex items-center mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(beer.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">({beer.rating})</span>
            </div>
          </div>
          
          <div className="text-2xl font-bold text-amber-600">
            R$ {beer.price.toFixed(2)}
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <Button className="w-full bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar ao Carrinho
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default BeerCard;
