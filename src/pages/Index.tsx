/**
 * Index.tsx
 * 
 * ✅ Funcionalidades Implementadas:
 * - Redireciona automaticamente usuários autenticados para a área correta (loja física ou online)
 * - Exibe cards de acesso para loja online e loja física
 * - Lista usuários cadastrados e permite exclusão com confirmação
 * 
 * 🔄 Como Funciona:
 * - Usa React hooks para controlar estado, efeitos e navegação
 * - Usa contexto de autenticação para saber se o usuário está logado e qual seu tipo
 * - Usa animações com Framer Motion para transições suaves
 * - Usa localStorage para persistir e manipular usuários cadastrados
 * 
 * 📊 Interface da Página:
 * - Layout responsivo, com cards de acesso e lista de usuários
 * - Cards estilizados com Tailwind CSS e ícones
 * - Modal de confirmação para exclusão de usuário
 */

import { motion } from "framer-motion"; // Importa animações
import { useNavigate } from "react-router-dom"; // Hook para navegação
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"; // Componentes de card
import { Store, Settings, Users, Trash2 } from "lucide-react"; // Ícones
import { Button } from "@/components/ui/button"; // Botão customizado
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Componentes de diálogo de alerta
import { useToast } from "@/components/ui/use-toast"; // Hook para toasts
import { useState, useEffect } from "react"; // Hooks de estado e efeito
import { useAuth } from '@/contexts/AuthContext'; // Contexto de autenticação
import { authStorage } from '@/services/storageService'; // Serviço de armazenamento

import { User, StoredUser } from '@/types/auth';

const Index = () => {
  const navigate = useNavigate(); // Hook para navegação programática
  const { toast } = useToast(); // Hook para exibir toasts
  const { user } = useAuth(); // Pega o usuário autenticado do contexto
  const [users, setUsers] = useState<User[]>([]); // Estado para lista de usuários

  useEffect(() => {
    // Carrega usuários do localStorage ao montar o componente
    try {
      const storedUsers = authStorage.getAllUsers(); // Busca usuários salvos usando serviço
      const sanitizedUsers: User[] = storedUsers.map((user) => ({
        id: user.id,
        nome: user.nome || 'Nome não informado',
        email: user.email || 'Email não informado',
        type: (user.type as 'fisica' | 'online') || 'online',
        tipo: (user.tipo as 'fisica' | 'online' | 'admin') || (user.type as 'fisica' | 'online' | 'admin') || 'online',
        createdAt: new Date()
      }));
      setUsers(sanitizedUsers); // Atualiza estado com usuários
    } catch (error) {
      console.error('Erro ao carregar usuários:', error); // Loga erro
      setUsers([]); // Limpa lista em caso de erro
    }
  }, []); // Executa apenas uma vez ao montar

  // Função para deletar usuário
  const handleDeleteUser = (userToDelete: User) => {
    try {
      authStorage.removeUserById(userToDelete.id); // Remove usuário usando serviço
      const updatedUsers = users.filter(user => user.id !== userToDelete.id); // Remove usuário da lista
      setUsers(updatedUsers); // Atualiza estado
      
      toast({
        title: "Usuário excluído", // Título do toast
        description: `O usuário ${userToDelete.nome} foi excluído com sucesso.`, // Descrição do toast
      });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error); // Loga erro
      toast({
        variant: "destructive",
        title: "Erro ao excluir usuário",
        description: "Não foi possível excluir o usuário.",
      });
    }
  };

  // Cards de acesso rápido
  const cards = [
    {
      title: "Área da Loja", // Título do card
      description: "Acesse nossa loja online para ver produtos e fazer pedidos.", // Descrição
      icon: Store, // Ícone
      onClick: () => navigate("/loja-online"), // Ação ao clicar
      bgColor: "bg-gradient-to-br from-orange-200 to-orange-400", // Cor de fundo
      iconColor: "text-orange-600", // Cor do ícone
    },
    {
      title: "Área da Loja Física",
      description: "Gerencie produtos, estoque, mesas e mais.",
      icon: Settings,
      onClick: () => navigate("/loja-fisica"),
      bgColor: "bg-gradient-to-br from-blue-200 to-blue-400",
      iconColor: "text-blue-600",
    },
  ];

  return (
    <div className="min-h-screen bg-brewery-cream flex flex-col items-center justify-start p-4 gap-8">
      {/* Título e subtítulo animados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} // Começa invisível e deslocado
        animate={{ opacity: 1, y: 0 }} // Anima para visível e posição normal
        transition={{ duration: 0.5 }} // Duração da animação
        className="text-center mb-6"
      >
        <h1 className="text-4xl font-bold text-brewery-dark-brown mb-4">
          Bem-vindo à Choperia
        </h1>
        <p className="text-xl text-brewery-dark-brown/80">
          Escolha como deseja acessar nossa plataforma
        </p>
      </motion.div>

      {/* Cards de acesso rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: index === 0 ? -20 : 20 }} // Animação de entrada lateral
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
          >
            <Card
              className={`cursor-pointer transform transition-all duration-300 hover:scale-105 ${card.bgColor} border-2 border-brewery-brown/10 hover:border-brewery-brown/20`}
              onClick={card.onClick} // Navega ao clicar
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-center text-2xl text-brewery-brown">
                  <card.icon className={`mr-2 h-8 w-8 ${card.iconColor}`} /> {/* Ícone */}
                  {card.title}
                </CardTitle>
                <CardDescription className="text-brewery-brown/80">
                  {card.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <p className="text-sm text-brewery-brown/60">
                  Clique para acessar
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Lista de usuários cadastrados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} // Animação de entrada
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="w-full max-w-4xl"
      >
        <Card className="bg-white backdrop-blur shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black font-bold">
              <Users className="h-6 w-6" /> {/* Ícone de usuários */}
              Usuários Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-center text-gray-700 font-medium">
                Nenhum usuário cadastrado
              </p>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
                  >
                    <div>
                       <p className="font-semibold text-brewery-dark-brown">
                        {user.nome}
                      </p>
                      <p className="text-sm text-gray-600">
                        {user.email}
                      </p>
                    </div>
                    {/* Botão de exclusão com confirmação */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o usuário {user.nome}? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteUser(user)}>
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Index;
