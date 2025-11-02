import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, DollarSign, TrendingUp } from "lucide-react";
import { Mesa } from '@/types';
import { formataPreco } from '@/contexts/moeda';

import { MesaDashboardProps } from '@/types/mesa';
import type { PedidoLocal } from '@/types/pedido';
import usePedidosLocais from '@/hooks/usePedidosLocais';
import { authStorage } from '@/services/storageService';
import { useEffect, useState } from 'react';

const MesaDashboard = ({ mesas }: MesaDashboardProps) => {
  const mesasLivres = mesas.filter(m => m.status === 'Livre').length;
  const mesasOcupadas = mesas.filter(m => m.status === 'Ocupada').length;
  const totalMesas = mesas.length;
  const ocupacao = totalMesas > 0 ? Math.round((mesasOcupadas / totalMesas) * 100) : 0;
  
  const totalVendas = mesas
    .filter(m => m.status === 'Ocupada')
    .reduce((acc, mesa) => acc + (mesa.itens?.reduce((sum, item) => sum + item.total, 0) || 0), 0);

  const pedidosAtivos = mesas.filter(m => m.status === 'Ocupada' && Number(m.pedido) > 0).length;

  const usuariosAtivos = new Set(
    mesas
      .filter(m => m.usuarioId)
      .map(m => m.usuarioId)
  ).size;

  // Contagem de usuários logados entre abas (persistidos em localStorage via authStorage)
  const [usuariosAtivosCount, setUsuariosAtivosCount] = useState<number>(() => {
    try {
      const users = authStorage.getAllUsers();
      if (users && users.length) return users.length;
      // fallback: checar se há um usuário logado
      return authStorage.isLoggedIn() ? 1 : 0;
    } catch (e) {
      return 0;
    }
  });

  useEffect(() => {
    const handle = () => {
      try {
        const users = authStorage.getAllUsers();
        setUsuariosAtivosCount(users ? users.length : (authStorage.isLoggedIn() ? 1 : 0));
      } catch (e) {
        setUsuariosAtivosCount(0);
      }
    };

    // ouvir evento customizado
    window.addEventListener('usuarios_atualizados', handle);
    // ouvir mudanças de localStorage vindas de outras abas
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === 'users' || e.key === 'usuario_logado' || e.key === null) handle();
    });

    return () => {
      window.removeEventListener('usuarios_atualizados', handle);
      window.removeEventListener('storage', (e: StorageEvent) => { if (e.key === 'users' || e.key === 'usuario_logado' || e.key === null) handle(); });
    };
  }, []);

  // Calcular tempo médio (em minutos) dos pedidos em mesas ocupadas
  const { pedidos: pedidosLocais, now } = usePedidosLocais(5000);

  const temposMinutos = mesas
    .filter(m => m.status === 'Ocupada' && Number(m.pedido) > 0)
    .map(m => {
      const pedido = pedidosLocais.find(p => Number(p.numeroPedido) === Number(m.pedido));
      if (!pedido || !pedido.dataHora) return null;
      const diffMin = (now - Date.parse(pedido.dataHora)) / 60000;
      return diffMin;
    })
    .filter((t): t is number => typeof t === 'number' && !isNaN(t));

  const tempoMedioNum = temposMinutos.length > 0
    ? (temposMinutos.reduce((a, b) => a + b, 0) / temposMinutos.length)
    : null;

  const tempoMedio = tempoMedioNum !== null
    ? tempoMedioNum.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{ocupacao}%</div>
          <p className="text-xs text-muted-foreground">
            {mesasOcupadas} de {totalMesas} mesas ocupadas
          </p>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="text-green-600">
              {mesasLivres} Livres
            </Badge>
            <Badge variant="outline" className="text-blue-600">
              {mesasOcupadas} Ocupadas
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas Ativas</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formataPreco(totalVendas)}
          </div>
          <p className="text-xs text-muted-foreground">
            {pedidosAtivos} pedidos em andamento
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usuariosAtivosCount}</div>
          <p className="text-xs text-muted-foreground">
            Atendentes trabalhando
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{tempoMedio !== null ? `${tempoMedio} min` : '--'}</div>
          <p className="text-xs text-muted-foreground">
            Tempo médio por pedido
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MesaDashboard;
