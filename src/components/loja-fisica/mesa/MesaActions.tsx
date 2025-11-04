import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, User } from "lucide-react";
import * as localMesaService from '@/services/mesaService';
import * as apiMesaService from '@/api/loja-fisica/mesas/mesaService';
import { useEffect, useState } from 'react';
import type { Mesa } from '@/types/mesa';
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { MesaActionsProps } from '@/types/mesa';
import MesaCard from './MesaCard2';

const MesaActions = ({
  isNovaMesaDialogOpen,
  setIsNovaMesaDialogOpen,
  isBalcaoDialogOpen,
  setIsBalcaoDialogOpen,
  nomeBalcao,
  setNomeBalcao,
  handleCreateMesa,
  handleCreateMesaBalcao,
  mesasDisponiveis,
}: MesaActionsProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [mesaParaExcluir, setMesaParaExcluir] = React.useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [mesas, setMesas] = useState<Mesa[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await apiMesaService.getAllMesas();
        if (mounted) setMesas(data || []);
      } catch (e) {
        try { const data = localMesaService.getAllMesas(); if (mounted) setMesas(data || []); } catch (err) { console.debug(err); }
      }
    };
    load();
    
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('mesa_events');
        bc.onmessage = async () => {
          try {
            const data = await apiMesaService.getAllMesas();
            if (mounted) setMesas(data || []);
          } catch (err) {
            try { const data = localMesaService.getAllMesas(); if (mounted) setMesas(data || []); } catch (e) { console.debug(e); }
          }
        };
      }
    } catch (e) {
      bc = null;
    }

    return () => { mounted = false; if (bc) try { bc.close(); } catch (e) { /* ignore */ } };
  }, []);

  const handleDeleteMesa = async (event: React.FormEvent) => {
    event.preventDefault();
    
    const raw = mesaParaExcluir || '';
    const value = raw.trim();
    let mesa = mesas.find(m => m.nome === value);
    if (!mesa) {
      const padded = value.replace(/^0+/, '').padStart(2, '0');
      mesa = mesas.find(m => m.nome === padded);
    }
    if (!mesa && /^\d+$/.test(value)) {
      mesa = mesas.find(m => Number(m.nome) === Number(value));
    }
    if (!mesa) {
      const lower = value.toLowerCase();
      mesa = mesas.find(m => String(m.nome).toLowerCase() === lower);
    }
    
    if (!mesa) {
      const available = mesas.map(m => m.nome).slice(0, 10).join(', ');
      toast({
        variant: "destructive",
        title: "Erro ao excluir mesa",
        description: available ? `Mesa não encontrada. Mesas existentes: ${available}` : 'Mesa não encontrada. Verifique o nome e tente novamente.',
      });
      return;
    }

    try {
      await apiMesaService.deleteMesa(mesa.id);
      const data = await apiMesaService.getAllMesas();
      setMesas(data || []);
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      
      toast({
        title: "Mesa excluída",
        description: "A mesa foi excluída com sucesso.",
      });
      
      setIsDeleteDialogOpen(false);
      setMesaParaExcluir('');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir mesa",
        description: "Não foi possível excluir a mesa.",
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      <Dialog open={isNovaMesaDialogOpen} onOpenChange={setIsNovaMesaDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="default" size="lg" className="bg-primary hover:bg-primary-hover shadow-card">
            <Plus className="h-5 w-5 mr-2" />
            Cadastrar Nova Mesa
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="space-y-3 pb-4">
            <DialogTitle className="text-2xl font-bold">Nova Mesa</DialogTitle>
            <DialogDescription className="text-base">
              Selecione um número para criar uma nova mesa
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-2">
            {mesasDisponiveis.map((numero) => (
              <MesaCard 
                key={numero} 
                numero={numero} 
                onSelect={handleCreateMesa}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBalcaoDialogOpen} onOpenChange={setIsBalcaoDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" size="lg" className="shadow-card">
            <User className="h-5 w-5 mr-2" />
            Pedido no Balcão
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-bold">Pedido no Balcão</DialogTitle>
            <DialogDescription>
              Digite o nome da pessoa para criar um pedido no balcão
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMesaBalcao} className="space-y-6 pt-4">
            <div className="space-y-2">
              <label htmlFor="nomeBalcao" className="text-sm font-medium">
                Nome da Pessoa
              </label>
              <Input
                id="nomeBalcao"
                value={nomeBalcao}
                onChange={(e) => setNomeBalcao(e.target.value)}
                placeholder="Digite o nome da pessoa"
                required
                className="h-11"
              />
            </div>
            <Button type="submit" size="lg" className="w-full">
              Cadastrar Pedido
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="lg" className="ml-auto shadow-card">
            <Trash2 className="h-5 w-5 mr-2" />
            Excluir Mesa
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-bold">Excluir Mesa</DialogTitle>
            <DialogDescription>
              Digite o nome da mesa que deseja excluir ou selecione uma das opções
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDeleteMesa} className="space-y-6 pt-4">
            <div className="space-y-2">
              <label htmlFor="mesaParaExcluir" className="text-sm font-medium">
                Nome da Mesa
              </label>
              <Input
                id="mesaParaExcluir"
                list="mesas-list"
                value={mesaParaExcluir}
                onChange={(e) => setMesaParaExcluir(e.target.value)}
                placeholder="Digite o nome da mesa"
                required
                className="h-11"
              />
              <datalist id="mesas-list">
                {mesas.map((m) => (
                  <option key={m.id} value={m.nome} />
                ))}
              </datalist>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button type="submit" variant="destructive" className="flex-1">
                Excluir
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setMesaParaExcluir(mesas[0]?.nome || '')}
                className="flex-1"
              >
                Primeira Mesa
              </Button>
            </div>
            <Button 
              type="button" 
              variant="secondary"
              className="w-full"
              onClick={async () => {
                const nome = (mesaParaExcluir || '').trim();
                if (!nome) return;
                const exists = mesas.some(m => m.nome === nome);
                if (exists) {
                  try { toast({ title: 'Aviso', description: `A mesa ${nome} já existe.` }); } catch (e) { console.debug(e); }
                  return;
                }
                try {
                  const nova = await apiMesaService.salvarMesa({ nome, status: 'livre', pedido: 0, itens: [] } as Omit<Mesa, 'id'>);
                  const data = await apiMesaService.getAllMesas();
                  setMesas(data || []);
                  queryClient.invalidateQueries({ queryKey: ['mesas'] });
                  setMesaParaExcluir(nova.nome);
                  try { toast({ title: 'Mesa criada', description: `Mesa ${nova.nome} criada com sucesso.` }); } catch (e) { console.debug(e); }
                } catch (e) {
                  try { toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível criar a mesa.' }); } catch (err) { console.debug(err); }
                }
              }}
            >
              Criar Nova Mesa
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MesaActions;
