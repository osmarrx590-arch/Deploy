import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import * as localMesaService from '@/services/mesaService';
import * as apiMesaService from '@/api/loja-fisica/mesas/mesaService';
import { useEffect, useState } from 'react';
import type { Mesa } from '@/types/mesa';
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from '@tanstack/react-query';

import { MesaActionsProps } from '@/types/mesa';

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
        // fallback local sync
        try { const data = localMesaService.getAllMesas(); if (mounted) setMesas(data || []); } catch (err) { console.debug(err); }
      }
    };
    load();
    
    // Listen to BroadcastChannel events to refresh when other tabs change mesas
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('mesa_events');
        bc.onmessage = async (ev: MessageEvent) => {
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
    // Tenta várias estratégias de busca para ser tolerante ao input do usuário
    let mesa = mesas.find(m => m.nome === value);
    if (!mesa) {
      // tentar padding (ex: '1' -> '01')
      const padded = value.replace(/^0+/, '').padStart(2, '0');
      mesa = mesas.find(m => m.nome === padded);
    }
    if (!mesa && /^\d+$/.test(value)) {
      // comparar numericamente (aceita '11' mesmo que armazenado como '11' ou '011')
      mesa = mesas.find(m => Number(m.nome) === Number(value));
    }
    if (!mesa) {
      // comparação case-insensitive para nomes tipo 'Mesa A'
      const lower = value.toLowerCase();
      mesa = mesas.find(m => String(m.nome).toLowerCase() === lower);
    }
    console.log('Mesa encontrada para exclusão:', mesa);
    if (!mesa) {
      // Log detalhado para debug
      console.log('Valor pesquisado:', value, 'Mesas existentes:', mesas.map(m => m.nome));

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
      // atualizar lista local
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
    <div className="flex gap-4 mb-8">
      <Dialog open={isNovaMesaDialogOpen} onOpenChange={setIsNovaMesaDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="default" className="bg-green-600 hover:bg-green-700">
            Cadastrar Nova Mesa
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Nova Mesa</DialogTitle>
            <DialogDescription>
              Selecione um número para criar uma nova mesa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
            {mesasDisponiveis.map((numero) => (
              <Card key={numero} className="bg-green-100 hover:bg-green-200 cursor-pointer transition-colors">
                <div className="text-center mb-2">
                  <Button onClick={() => handleCreateMesa(numero)}>
                    Escolher
                  </Button>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <h5 className="text-xl font-bold text-center">{numero}</h5>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBalcaoDialogOpen} onOpenChange={setIsBalcaoDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
            Pedido no balcão
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Mesa com Nome de Pessoa</DialogTitle>
            <DialogDescription>
              Digite o nome da pessoa para criar um pedido no balcão.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMesaBalcao} className="space-y-4">
            <div>
              <label htmlFor="nomeBalcao" className="text-sm font-medium">
                Nome da Mesa (Pessoa)
              </label>
              <Input
                id="nomeBalcao"
                value={nomeBalcao}
                onChange={(e) => setNomeBalcao(e.target.value)}
                placeholder="Digite o nome da pessoa"
                required
              />
            </div>
            <Button type="submit">Cadastrar</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" className="ml-auto">
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Mesa
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Mesa</DialogTitle>
            <DialogDescription>
              Digite o nome da mesa que deseja excluir ou selecione uma das opções.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDeleteMesa} className="space-y-4">
            <div>
              <label htmlFor="mesaParaExcluir" className="text-sm font-medium">
                Nome da Mesa
              </label>
              <Input
                id="mesaParaExcluir"
                list="mesas-list"
                value={mesaParaExcluir}
                onChange={(e) => setMesaParaExcluir(e.target.value)}
                placeholder="Digite o nome da mesa (ou selecione)"
                required
              />
              <datalist id="mesas-list">
                {mesas.map((m) => (
                  <option key={m.id} value={m.nome} />
                ))}
              </datalist>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="destructive">Excluir</Button>
              <Button type="button" variant="ghost" onClick={() => setMesaParaExcluir(mesas[0]?.nome || '')}>Preencher com primeira</Button>
              <Button type="button" onClick={async () => {
                const nome = (mesaParaExcluir || '').trim();
                if (!nome) return;
                const exists = mesas.some(m => m.nome === nome);
                if (exists) {
                  // já existe
                  try { toast({ title: 'Aviso', description: `A mesa ${nome} já existe.` }); } catch (e) { console.debug(e); }
                  return;
                }
                try {
                  // criar via API e atualizar state
                  const nova = await apiMesaService.salvarMesa({ nome, status: 'Livre', pedido: 0, itens: [] } as Omit<Mesa, 'id'>);
                  const data = await apiMesaService.getAllMesas();
                  setMesas(data || []);
                  queryClient.invalidateQueries({ queryKey: ['mesas'] });
                  setMesaParaExcluir(nova.nome);
                  try { toast({ title: 'Mesa criada', description: `Mesa ${nova.nome} criada com sucesso.` }); } catch (e) { console.debug(e); }
                } catch (e) {
                  try { toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível criar a mesa.' }); } catch (err) { console.debug(err); }
                }
              }}>Criar mesa</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MesaActions;