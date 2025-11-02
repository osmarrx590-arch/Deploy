
import React from 'react';
import { Star } from 'lucide-react';
import { Button } from "@/components/ui/button";

import { ClassificacaoPorEstrelasProps } from '@/types/common';

const ClassificacaoPorEstrelas = ({ rating, onRate, readonly = false }: ClassificacaoPorEstrelasProps) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Button
          key={star}
          variant="ghost"
          size="icon"
          className={`h-6 w-6 p-0 ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
          onClick={() => !readonly && onRate?.(star)}
          disabled={readonly}
        >
          <Star
            className={`h-5 w-5 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-gray-300'
            }`}
          />
        </Button>
      ))}
    </div>
  );
};

export default ClassificacaoPorEstrelas;
