import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MesaCardProps {
  numero: string;
  onSelect: (numero: string) => void;
}

const MesaCard = ({ numero, onSelect }: MesaCardProps) => {
  return (
    <Card 
      className="relative overflow-hidden bg-emerald-50 border-2 border-emerald-400 hover:bg-emerald-100 hover:shadow-md transition-all duration-300 cursor-pointer group"
      onClick={() => onSelect(numero)}
    >
      <div className="p-6 flex flex-col items-center justify-center min-h-[140px] gap-4">
        <div className="text-5xl font-bold text-emerald-600 group-hover:scale-110 transition-transform duration-300">
          {numero}
        </div>
        <Button 
          variant="default"
          size="sm"
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(numero);
          }}
        >
          Selecionar
        </Button>
      </div>
      <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100 rounded-bl-full -z-10" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-emerald-100 rounded-tr-full -z-10" />
    </Card>
  );
};

export default MesaCard;
