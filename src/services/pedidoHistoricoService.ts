import { ItemPedidoInput } from '@/types/produto';
import { ItemMesa } from '@/types/mesa';
import { PedidoHistorico, DadosPedidoInput } from '@/types/pedido';
import { getNextPedidoNumber } from '@/services/mesaService';

const STORAGE_KEY = 'pedidos_historico';
// Observação: geração de número do pedido foi centralizada em `mesaService.getNextPedidoNumber`
// As chaves abaixo permanecem apenas para o ID local sequencial do histórico (gerarIdPedido).
const CONTADOR_PEDIDOS_KEY = 'contador_pedidos';
const DATA_CONTADOR_KEY = 'data_contador_pedidos';

// Função para obter a data atual no formato YYYY-MM-DD
const obterDataAtual = (): string => {
  return new Date().toISOString().slice(0, 10);
};

// Função para resetar o contador se a data mudou
const verificarOuResetarContador = () => {
  const dataAtual = obterDataAtual();
  const dataArmazenada = localStorage.getItem(DATA_CONTADOR_KEY);
  if (dataArmazenada !== dataAtual) {
    localStorage.setItem(CONTADOR_PEDIDOS_KEY, '0');
    localStorage.setItem(DATA_CONTADOR_KEY, dataAtual);
  }
};

// Função para gerar um ID inteiro e sequencial para o pedido
const gerarIdPedido = (): number => {
  verificarOuResetarContador();
  const contador = localStorage.getItem(CONTADOR_PEDIDOS_KEY);
  const proximoNumero = contador ? parseInt(contador) + 1 : 1;
  localStorage.setItem(CONTADOR_PEDIDOS_KEY, proximoNumero.toString());
  return proximoNumero;
};

// NOTE: A geração do número de pedido na aplicação foi consolidada em
// `mesaService.getNextPedidoNumber`. Esta função antiga (`obterProximoNumeroPedido`)
// foi removida para evitar duplicação e inconsistência entre serviços.

// Função para salvar pedido no histórico
export const salvarPedidoNoHistorico = (dadosPedido: DadosPedidoInput): PedidoHistorico => {
  // Validar dados do pedido
  const pedido: PedidoHistorico = {
    id: gerarIdPedido(),
    numero: getNextPedidoNumber(),
    data: new Date().toISOString(),
    status: 'Pendente',
    metodoPagamento: dadosPedido.metodoPagamento,
    itens: dadosPedido.itens.map(item => ({
      id: item.id,
      nome: item.nome, // Nome do item
      quantidade: item.quantidade,
      venda: item.venda,
      subtotal: item.venda * item.quantidade
    })),
    subtotal: dadosPedido.subtotal,
    desconto: dadosPedido.desconto,
    total: dadosPedido.total,
    nome: dadosPedido.nome // Nome do cliente
  };

  // Obter pedidos existentes
  const pedidosExistentes = obterHistoricoPedidos();
  
  // Adicionar novo pedido no início da lista
  pedidosExistentes.unshift(pedido);
  
  // Salvar no localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidosExistentes));
  
  console.log('✅ Pedido salvo no histórico:', pedido);
  return pedido;
};

// Função para obter histórico de pedidos
export const obterHistoricoPedidos = (): PedidoHistorico[] => {
  const historico = localStorage.getItem(STORAGE_KEY);
  return historico ? JSON.parse(historico) : [];
};

// Função para atualizar status de um pedido
export const atualizarStatusPedido = (pedido_id: number, novoStatus: PedidoHistorico['status']): void => {
  const pedidos = obterHistoricoPedidos();
  const pedidoIndex = pedidos.findIndex(p => p.id === pedido_id);
  
  if (pedidoIndex !== -1) {
    pedidos[pedidoIndex].status = novoStatus;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
    console.log(`✅ Status do pedido ${pedido_id} atualizado para: ${novoStatus}`);
  }
};

// Função para criar pedido local
interface DadosPedidoLocal {
  mesaId: number;
  mesaNome: string;
  itens: ItemMesa[];
  total: number;
  atendente: string;
  observacoes?: string;
  // número do pedido existente (opcional). Se fornecido, será usado em vez de gerar um novo.
  numeroPedido?: number | string;
}

export const criarPedidoLocal = (dados: DadosPedidoLocal) => {
  const pedidoLocal = {
    id: Date.now(),
    // Use o número do pedido existente quando disponível (ex: mesa.pedido).
    numeroPedido: dados.numeroPedido ?? getNextPedidoNumber(),
    mesaId: dados.mesaId,
    mesaNome: dados.mesaNome,
    status: 'Em Preparo' as const,
    itens: dados.itens,
    total: dados.total,
    dataHora: new Date().toISOString(),
    atendente: dados.atendente,
    observacoes: dados.observacoes
  };

  // Salvar no localStorage de pedidos locais
  const pedidosLocais = JSON.parse(localStorage.getItem('pedidos_locais') || '[]');
  pedidosLocais.push(pedidoLocal);
  localStorage.setItem('pedidos_locais', JSON.stringify(pedidosLocais));

  // Disparar evento customizado para sinalizar atualização dentro da mesma aba
  try {
    const event = new Event('pedidos_locais_updated');
    window.dispatchEvent(event);
  } catch (e) {
    // ignore
  }

  console.log('✅ Pedido local criado:', pedidoLocal);
  return pedidoLocal;
};

// Função para limpar histórico (para testes)
export const limparHistorico = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CONTADOR_PEDIDOS_KEY);
  console.log('🧹 Histórico de pedidos limpo');
};

