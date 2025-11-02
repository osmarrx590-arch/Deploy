import { useEffect, useRef } from 'react'; // Importa hooks do React
import { Mesa, MesaEvent } from '@/types/mesa'; // Importa os tipos Mesa e MesaEvent
import { useToast } from '@/hooks/use-toast'; // Importa hook para exibir toasts
import { User } from '@/types/auth'; // Importa o tipo User
import { mesaStorage } from '@/services/storageService'; // Importa serviço de storage

// Hook customizado para notificações de mesa
export const useMesaNotifications = (user: User | { id: number; nome?: string } | null) => {
  const { toast } = useToast(); // Obtém função para exibir toast
  const lastNotificationRef = useRef<number>(0); // Ref para armazenar o timestamp do último evento notificado

  useEffect(() => {
    if (!user) return; // Se não houver usuário, não faz nada

    // Função para verificar mudanças nos eventos de mesa
    const checkForChanges = () => {
      // Recupera eventos usando o serviço de storage
      const events = mesaStorage.getEvents() as MesaEvent[];
      // Helper para extrair id do usuário de forma segura
      const getUserId = (u: User | { id: number; nome?: string } | null | undefined): number | undefined => {
        if (!u) return undefined;
        if ('id' in u && typeof u.id === 'number') return u.id;
        return undefined;
      };

      // Filtra eventos novos (após o último notificado e de outros usuários)
      const currentUserId = getUserId(user);
      const newEvents = events.filter(event =>
        event.timestamp > lastNotificationRef.current &&
        event.user.id !== currentUserId
      );

      // Para cada novo evento, exibe um toast conforme o tipo
  newEvents.forEach((event: MesaEvent) => {
        switch (event.type) {
          case 'occupied':
            toast({
              title: "Mesa ocupada",
              description: `${event.user.nome || event.user.nome} começou a atender a mesa ${event.mesa.nome}`,
              duration: 3000,
            });
            break;
          case 'freed':
            toast({
              title: "Mesa liberada",
              description: `Mesa ${event.mesa.nome} foi liberada por ${event.user.nome || event.user.nome}`,
              duration: 3000,
            });
            break;
          case 'transferred':
            toast({
              title: "Mesa transferida",
              description: `Mesa ${event.mesa.nome} foi transferida para ${event.user.nome || event.user.nome}`,
              duration: 3000,
            });
            break;
        }
      });

      // Atualiza o timestamp do último evento notificado
      if (newEvents.length > 0) {
        lastNotificationRef.current = Math.max(...newEvents.map(e => e.timestamp));
      }
    };

    // Executa checkForChanges a cada 2 segundos
    const interval = setInterval(checkForChanges, 2000);
    // Limpa o intervalo ao desmontar ou mudar dependências
    return () => clearInterval(interval);
  }, [user, toast]); // Executa efeito quando user ou toast mudam

  // Função para registrar um novo evento de mesa
  const notifyMesaChange = (type: MesaEvent['type'], mesa: Mesa) => {
    if (!user) return; // Se não houver usuário, não faz nada

    // Cria o evento
    const event: MesaEvent = {
      type,
      mesa,
      user,
      timestamp: Date.now()
    };

    // Salva o evento usando o serviço de storage
    mesaStorage.addEvent(event);
  };

  // Retorna a função para notificar mudanças de mesa
  return { notifyMesaChange };
};
